import { Component, Input, OnChanges, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { FinancialStats } from '../../../../../shared/models/models';

@Component({
  selector: 'app-revenue-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './revenue-chart.component.html',
  styleUrls: ['./revenue-chart.component.scss']
})
export class RevenueChartComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() data: FinancialStats | null = null;
  @Input() period = 'month';
  @Input() loading = false;
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  ngAfterViewInit() {
    if (this.data && !this.loading) {
      this.createChart();
    }
  }

  ngOnChanges() {
    if (this.chartCanvas && this.data && !this.loading) {
      this.createChart();
    }
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private createChart() {
    if (!this.chartCanvas?.nativeElement || !this.data?.revenueByPeriod?.length) {
      return;
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    if (this.chart) {
      this.chart.destroy();
    }

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: this.data.revenueByPeriod.map(item => this.formatDateLabel(item.date)),
        datasets: [{
          label: 'Receita (R$)',
          data: this.data.revenueByPeriod.map(item => item.revenue),
          borderColor: '#EC9253',
          backgroundColor: 'rgba(236, 146, 83, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#EC9253',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'R$ ' + Number(value).toLocaleString('pt-BR');
              }
            },
            grid: {
              color: '#f3f4f6'
            }
          },
          x: {
            grid: {
              color: '#f3f4f6'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return 'Receita: R$ ' + (context.parsed.y ?? 0).toLocaleString('pt-BR');
              }
            },
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#EC9253',
            borderWidth: 1
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  private formatDateLabel(date: string): string {
    const d = new Date(date);
    if (this.period === 'today' || this.period === 'week') {
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } else {
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    }
  }
}