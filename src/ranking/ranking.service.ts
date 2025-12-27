import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class RankingService {
  constructor(@Inject('DB_POOL') private pool: Pool) {}

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
      // Check cache from database
      const cacheQuery = `
        SELECT domain, rank, date, "updatedAt"
        FROM rankings
        WHERE domain = $1
        ORDER BY date ASC
      `;
      const cacheResult = await client.query(cacheQuery, [domain]);
      const cached = cacheResult.rows;

      if (cached.length > 0) {
        const newest = new Date(cached[cached.length - 1].updatedAt);
        const isRecent = Date.now() - newest.getTime() < 24 * 60 * 60 * 1000;

        if (isRecent) {
          console.log(`Serving ${domain} from cache`);

          return {
            domain,
            labels: cached.map((c) => c.date),
            ranks: cached.map((c) => c.rank),
          };
        }
      }

      // Fetch from Tranco (fixed typo: TRANCO_API_BASE)
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

      // Clear old data for this domain
      await client.query('DELETE FROM rankings WHERE domain = $1', [domain]);

      // Prepare bulk insert
      const rows = json.ranks.map((r) => ({
        domain,
        date: r.date,
        rank: r.rank,
      }));

      // Bulk insert new data
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
        labels: rows.map((r) => r.date),
        ranks: rows.map((r) => r.rank),
      };
    } finally {
      client.release();
    }
  }
}
