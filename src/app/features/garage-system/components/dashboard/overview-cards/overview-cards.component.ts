import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverviewData } from '../../../../../shared/models/models';

@Component({
  selector: 'app-overview-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overview-cards.component.html',
  styleUrls: ['./overview-cards.component.scss']
})
export class OverviewCardsComponent {
  @Input() data: OverviewData | null = null;
  @Input() loading = false;

  formatCurrency(value: number | undefined): string {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  formatChange(change: number | undefined): string {
    if (change === undefined || change === null) return '';
    const prefix = change > 0 ? '+' : '';
    return `${prefix}${change.toFixed(1)}% vs anterior`;
  }

  getChangeClass(change: number | undefined): string {
    if (change === undefined || change === null) return 'text-gray-500';
    return change > 0 ? 'text-green-600' : 'text-red-600';
  }
}