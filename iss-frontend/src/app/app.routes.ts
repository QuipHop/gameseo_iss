import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GameListComponent } from './components/game-list/game-list.component';
import { ScrapeGameComponent } from './components/scrape-game/scrape-game.component';
import { SearchGamesComponent } from './components/search-games/search-games.component';
import { StatisticsComponent } from './components/statistics/statistics.component';

export const routes: Routes = [
  { path: '', redirectTo: '/scrape', pathMatch: 'full' },
  { path: 'games', component: GameListComponent },
  { path: 'scrape', component: ScrapeGameComponent },
  { path: 'search', component: SearchGamesComponent },
  { path: 'statistics', component: StatisticsComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
