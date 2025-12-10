import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { RankingService } from './ranking.service';

@Controller('ranking')
export class RankingController {
  constructor(private rankingService: RankingService) {}

  @Post()
  create(@Body() body: { domain: string; rank: number }) {
    return this.rankingService.create(body.domain, body.rank);
  }

  @Get(':domain')
  get(@Param('domain') domain: string) {
    return this.rankingService.fetchRank(domain);
  }

  @Get()
  async getMultiple(@Query('domains') domains: string) {
    const list = domains.split(',').map((d) => d.trim());

    const results = await Promise.all(
      list.map((domain) => this.rankingService.fetchRank(domain)),
    );

    return results;
  }
}
