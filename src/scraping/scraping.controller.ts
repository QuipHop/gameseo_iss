import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ScrapingService } from './scraping.service';
import { Game } from 'src/entities/game.entity';

@Controller('api/games') // Set the base route as 'api/games'
export class ScrapingController {
  constructor(private readonly scrapingService: ScrapingService) {}

  // Endpoint to retrieve all games
  @Get()
  async getAllGames(): Promise<Game[]> {
    return this.scrapingService.getAllGames();
  }

  // Endpoint to scrape a new game and save it
  @Post('scrape')
  async scrapeGame(@Body('url') url: string): Promise<Game> {
    console.log('url', url);
    return await this.scrapingService.scrapeAndSaveGameData(url);
  }

  @Get('search')
  async searchGames(@Query('query') query: string): Promise<Game[]> {
    if (!query || query.trim() === '') {
      return []; // Return an empty array for empty queries
    }

    return this.scrapingService.searchGames(query);
  }
}
