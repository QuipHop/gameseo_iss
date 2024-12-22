import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Game {
  id: number;
  title: string;
  category: string;
  rating: number;
  description: string;
  releaseDate: string;
  genre: string[];
  iconUrl: string;
}

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private apiUrl = 'http://localhost:3000/api/games';

  constructor(private http: HttpClient) {}

  // Fetch all games from the backend
  getGames(): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.apiUrl}`);
  }

  // Search games by query
  searchGames(query: string): Observable<Game[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<Game[]>(`${this.apiUrl}/search`, { params });
  }

  // Scrape a new game and add it to the database
  scrapeGame(url: string): Observable<Game> {
    return this.http.post<Game>(`${this.apiUrl}/scrape`, { url });
  }
}
