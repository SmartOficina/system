import { Component, Input, OnChanges, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { ServiceOrdersStats } from '../../../../../shared/models/models';

@Component({
  selector: 'app-service-orders-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './service-orders-chart.component.html',
  styleUrls: ['./service-orders-chart.component.scss']
})
export class ServiceOrdersChartComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() data: ServiceOrdersStats | null = null;
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
    if (!this.chartCanvas?.nativeElement || !this.data?.statusDistribution?.length) {
      return;
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    if (this.chart) {
      this.chart.destroy();
    }

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: this.data.statusDistribution.map(item => this.getStatusLabel(item.status)),
        datasets: [{
          data: this.data.statusDistribution.map(item => item.count),
          backgroundColor: this.data.statusDistribution.map(item => this.getStatusColor(item.status)),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = Number(context.parsed);
                const dataset = context.dataset;
                const total = dataset.data.reduce((acc: number, current: any) => {
                  return acc + (typeof current === 'number' ? current : 0);
                }, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    if (config.type === 'doughnut') {
      (config.options as any).cutout = '60%';
    }

    this.chart = new Chart(ctx, config);
  }

  private getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'aberta': 'Abertas',
      'em_diagnostico': 'Em Diagnóstico',
      'aguardando_aprovacao': 'Aguardando Aprovação',
      'aprovada': 'Aprovadas',
      'rejeitada': 'Rejeitadas',
      'em_andamento': 'Em Andamento',
      'aguardando_pecas': 'Aguardando Peças',
      'concluida': 'Concluídas',
      'entregue': 'Entregues',
      'cancelada': 'Canceladas'
    };
    return statusLabels[status] || status;
  }

  private getStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'aberta': '#93C5FD',
      'em_diagnostico': '#FCD34D',
      'aguardando_aprovacao': '#C4B5FD',
      'aprovada': '#86EFAC',
      'rejeitada': '#FCA5A5',
      'em_andamento': '#EC9253',
      'aguardando_pecas': '#D1D5DB',
      'concluida': '#6EE7B7',
      'entregue': '#34D399',
      'cancelada': '#F87171'
    };
    return statusColors[status] || '#EC9253';
  }
}