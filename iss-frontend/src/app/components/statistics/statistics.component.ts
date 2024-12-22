import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ChartData, ChartOptions } from 'chart.js';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  standalone: true,
  imports: [BaseChartDirective, FormsModule, CommonModule, HttpClientModule],
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss'],
})
export class StatisticsComponent implements OnInit {
  // Top 500 Keywords
  topKeywords: { term: string; count: number }[] = [];
  chartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Game Count',
        backgroundColor: '#007bff',
      },
    ],
  };

  // Top Keywords by Genre
  genreKeywords: { genre: string; chartData: ChartData<'bar'> }[] = [];

  chartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { ticks: { maxRotation: 90, minRotation: 45 } },
      y: { beginAtZero: true },
    },
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchTopKeywords();
    this.fetchTopKeywordsByGenre();
  }

  fetchTopKeywords(): void {
    this.http
      .get<
        { term: string; count: number }[]
      >('http://localhost:3000/api/statistics/top-keywords')
      .subscribe((data) => {
        this.topKeywords = data;

        // Update chart data for top 500 keywords
        this.chartData.labels = this.topKeywords.map((k) => k.term);
        this.chartData.datasets[0].data = this.topKeywords.map((k) => k.count);
      });
  }

  fetchTopKeywordsByGenre(): void {
    this.http
      .get<
        { genre: string; keywords: { term: string; count: number }[] }[]
      >('http://localhost:3000/api/statistics/top-keywords-by-genre')
      .subscribe((data) => {
        this.genreKeywords = data.map((genreData) => ({
          genre: genreData.genre,
          chartData: {
            labels: genreData.keywords.map((k) => k.term),
            datasets: [
              {
                data: genreData.keywords.map((k) => k.count),
                label: `Keywords in ${genreData.genre}`,
                backgroundColor: '#4caf50',
              },
            ],
          },
        }));
      });
  }
}
