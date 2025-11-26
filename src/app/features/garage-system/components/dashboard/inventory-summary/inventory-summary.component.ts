import { Component, Input } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { RouterModule } from '@angular/router';
import localePt from '@angular/common/locales/pt';

registerLocaleData(localePt);

interface InventorySummary {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
}

@Component({
  selector: 'app-inventory-summary',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './inventory-summary.component.html',
  styleUrls: ['./inventory-summary.component.scss']
})
export class InventorySummaryComponent {
  @Input() data: InventorySummary | null = null;
  @Input() loading = false;
}