import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { GameService, Game } from '../../services/game.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-scrape-game',
  standalone: true,
  imports: [FormsModule, CommonModule, HttpClientModule],
  providers: [GameService],
  templateUrl: './scrape-game.component.html',
  styleUrls: ['./scrape-game.component.scss'],
})
export class ScrapeGameComponent {
  gameUrl: string = '';
  scrapedGame: Game | null = null;

  constructor(private gameService: GameService) {}

  onScrapeGame() {
    this.gameService.scrapeGame(this.gameUrl).subscribe((game) => {
      this.scrapedGame = game;
    });
  }
}
