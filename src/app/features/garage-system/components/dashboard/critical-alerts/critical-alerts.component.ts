import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination.component';
import { Alert } from '../../../../../shared/models/models';

@Component({
  selector: 'app-critical-alerts',
  standalone: true,
  imports: [CommonModule, RouterModule, PaginationComponent],
  templateUrl: './critical-alerts.component.html',
  styleUrls: ['./critical-alerts.component.scss']
})
export class CriticalAlertsComponent implements OnChanges {
  @Input() alerts: Alert[] = [];

  currentPage = 1;
  itemsPerPage = 8;
  paginatedAlerts: Alert[] = [];

  ngOnChanges() {
    this.updatePaginatedAlerts();
  }

  updatePaginatedAlerts() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedAlerts = this.alerts.slice(startIndex, endIndex);
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.updatePaginatedAlerts();
  }

  get totalPages(): number {
    return Math.ceil(this.alerts.length / this.itemsPerPage);
  }

  trackByAlert(index: number, alert: Alert): string {
    return alert.title + alert.message;
  }

  getAlertClasses(type: Alert['type']): string {
    const baseClasses = 'bg-opacity-50';
    switch (type) {
      case 'danger':
        return `${baseClasses} bg-red-50 border-red-400`;
      case 'warning':
        return `${baseClasses} bg-orange-50 border-orange-400`;
      case 'info':
        return `${baseClasses} bg-blue-50 border-blue-400`;
      default:
        return `${baseClasses} bg-gray-50 border-gray-400`;
    }
  }

  getAlertIcon(type: Alert['type']): string {
    switch (type) {
      case 'danger':
        return 'fa-exclamation-circle';
      case 'warning':
        return 'fa-exclamation-triangle';
      case 'info':
        return 'fa-info-circle';
      default:
        return 'fa-bell';
    }
  }

  getAlertIconColor(type: Alert['type']): string {
    switch (type) {
      case 'danger':
        return 'text-red-500';
      case 'warning':
        return 'text-orange-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  }

  getActionButtonClasses(type: Alert['type']): string {
    switch (type) {
      case 'danger':
        return 'bg-red-100 text-red-700 hover:bg-red-200';
      case 'warning':
        return 'bg-orange-100 text-orange-700 hover:bg-orange-200';
      case 'info':
        return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    }
  }

  getAlertPriority(type: Alert['type']): string {
    switch (type) {
      case 'danger':
        return 'Alta';
      case 'warning':
        return 'Média';
      case 'info':
        return 'Baixa';
      default:
        return 'Normal';
    }
  }

  getAlertPriorityColor(type: Alert['type']): string {
    switch (type) {
      case 'danger':
        return 'text-red-600 bg-red-100';
      case 'warning':
        return 'text-orange-600 bg-orange-100';
      case 'info':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}