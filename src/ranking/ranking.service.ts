import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Ranking } from './ranking.model';

@Injectable()
export class RankingService {
  constructor(
    @InjectModel(Ranking)
    private rankingModel: typeof Ranking,
  ) {}

  async create(domain: string, rank: number) {
    return this.rankingModel.create({ domain, rank });
  }

  async fetchRank(domain: string) {
    // Check cache from database
    const cached = await this.rankingModel.findAll({
      where: { domain },
      order: [['date', 'ASC']],
    });

    if (cached.length > 0) {
      const newest = cached[cached.length - 1].updatedAt;
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

    // Fetch from Tranco
    const url = `${process.env.TRNACO_API_BASE}/${domain}`;
    const response = await fetch(url);
    const json = await response.json();

    // Save to DB
    await this.rankingModel.destroy({ where: { domain } });

    const rows = json.ranks.map((r) => ({
      domain,
      date: r.date,
      rank: r.rank,
    }));

    await this.rankingModel.bulkCreate(rows);

    return {
      domain,
      labels: rows.map((r) => r.date),
      ranks: rows.map((r) => r.rank),
    };
  }
}
