import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScrapingController } from './scraping/scraping.controller';
import { ScrapingService } from './scraping/scraping.service';
import { Game } from './entities/game.entity';
import { Term } from './entities/term.entity';
import { StatisticsController } from './statistics/statistics.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'iss.db',
      entities: [Game, Term],
      synchronize: true, // Automatically creates tables based on entities
    }),
    TypeOrmModule.forFeature([Game, Term]),
  ],
  controllers: [AppController, ScrapingController, StatisticsController],
  providers: [AppService, ScrapingService],
})
export class AppModule {}
