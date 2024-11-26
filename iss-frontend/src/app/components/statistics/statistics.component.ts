import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [BaseChartDirective, FormsModule, CommonModule, HttpClientModule], // Add this line to import ChartsModule
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss'],
})
export class StatisticsComponent implements OnInit {
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
  chartOptions: ChartOptions = {
    responsive: true,
    scales: {
      x: {
        ticks: {
          maxRotation: 90,
          minRotation: 45,
        },
      },
    },
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchTopKeywords();
  }

  fetchTopKeywords(): void {
    this.http
      .get<
        { term: string; count: number }[]
      >('http://localhost:3000/api/statistics/top-keywords')
      .subscribe((data) => {
        this.topKeywords = data;

        // Update chart data
        this.chartData.labels = this.topKeywords.map((k) => k.term);
        this.chartData.datasets[0].data = this.topKeywords.map((k) => k.count);
      });
  }
}
