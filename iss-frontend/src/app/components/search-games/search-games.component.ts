import { Component } from '@angular/core';
import { Game, GameService } from '../../services/game.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-games',
  standalone: true,
  imports: [FormsModule, CommonModule, HttpClientModule],
  providers: [GameService],
  templateUrl: './search-games.component.html',
  styleUrl: './search-games.component.scss',
})
export class SearchGamesComponent {
  searchQuery: string = '';
  searchResults: Game[] = [];

  constructor(private gameService: GameService) {}

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.searchResults = [];
      return;
    }

    this.gameService.searchGames(this.searchQuery).subscribe(
      (results) => {
        this.searchResults = results;
      },
      (error) => {
        console.error('Error fetching search results:', error);
      },
    );
  }
}
