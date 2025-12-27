import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class RankingService {
  constructor(@Inject('DB_POOL') private pool: Pool) {}

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  }

  async create(domain: string, rank: number, date: string) {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO rankings (id, domain, rank, date, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
        RETURNING *
      `;
      const result = await client.query(query, [domain, rank, date]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async fetchRank(domain: string) {
    const client = await this.pool.connect();

    try {
      const cacheQuery = `
        SELECT domain, rank, date, "updatedAt"
        FROM rankings
        WHERE domain = $1
        ORDER BY date DESC
      `;
      const cacheResult = await client.query(cacheQuery, [domain]);
      const cached = cacheResult.rows;

      if (cached.length > 0) {
        const newest = new Date(cached[0].updatedAt);
        const isRecent = Date.now() - newest.getTime() < 24 * 60 * 60 * 1000;

        if (isRecent) {
          console.log(`Serving ${domain} from cache`);

          return {
            domain,
            labels: cached.map((c) => this.formatDate(c.date)),
            ranks: cached.map((c) => c.rank),
          };
        }
      }

      const url = `${process.env.TRANCO_API_BASE}/${domain}`;
      console.log(`Fetching from Tranco API: ${url}`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Tranco API request failed: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();

      if (!json.ranks || !Array.isArray(json.ranks)) {
        throw new Error('Invalid response from Tranco API - missing or invalid ranks array');
      }

      await client.query('DELETE FROM rankings WHERE domain = $1', [domain]);

      const rows = json.ranks
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((r) => ({
          domain,
          date: r.date,
          rank: r.rank,
        }));

      if (rows.length > 0) {
        const insertQuery = `
          INSERT INTO rankings (id, domain, rank, date, "createdAt", "updatedAt")
          VALUES ${rows.map((_, i) =>
            `(gen_random_uuid(), $${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3}, NOW(), NOW())`
          ).join(', ')}
        `;

        const values = rows.flatMap(r => [r.domain, r.rank, r.date]);
        await client.query(insertQuery, values);
      }

      return {
        domain,
        labels: rows.map((r) => this.formatDate(r.date)),
        ranks: rows.map((r) => r.rank),
      };
    } finally {
      client.release();
    }
  }
}
