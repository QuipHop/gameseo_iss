import { Controller, Get } from '@nestjs/common';
import { ScrapingService } from 'src/scraping/scraping.service';

@Controller('api/statistics')
export class StatisticsController {
  constructor(private readonly scrapingService: ScrapingService) {}

  @Get('top-keywords')
  async getTopKeywords() {
    return this.scrapingService.getTopKeywords();
  }
}
