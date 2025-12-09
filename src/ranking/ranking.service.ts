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

  async getHistory(domain: string) {
    return this.rankingModel.findAll({
      where: { domain },
      order: [['timestamp', 'ASC']],
    });
  }

  async fetchTrancoRank(domain: string) {
    const url = `${process.env.TRNACO_API_BASE}/${domain}`;
    console.log(url, 'url');
    const response = await fetch(url);
    const json = await response.json();

    console.log(json, 'json');

    // validate
    if (!json.ranks || !Array.isArray(json.ranks)) {
      throw new Error('Unexpected Tranco response format');
    }

    const sorted = json.ranks.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const labels = sorted.map((entry) => entry.date);
    const ranks = sorted.map((entry) => entry.rank);

    return {
      domain: json.domain,
      labels,
      ranks,
    };
  }
}
