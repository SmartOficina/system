import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardScheduleEvent } from '../../../../../shared/models/models';

@Component({
  selector: 'app-schedule-today',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './schedule-today.component.html',
  styleUrls: ['./schedule-today.component.scss']
})
export class ScheduleTodayComponent {
  @Input() events: DashboardScheduleEvent[] = [];
  @Input() loading = false;

  trackByEvent(index: number, event: DashboardScheduleEvent): string {
    return event.id;
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    });
  }

  formatTime(time: string): string {
    return time.substring(0, 5);
  }

  getTimeBadgeClasses(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'canceled':
      case 'no_show':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  }

  getServiceTagClasses(serviceTag: string): string {
    switch (serviceTag) {
      case 'Manutenção':
        return 'bg-blue-100 text-blue-700';
      case 'Retorno':
        return 'bg-yellow-100 text-yellow-700';
      case 'Garantia':
        return 'bg-green-100 text-green-700';
      case 'Acessório':
        return 'bg-purple-100 text-purple-700';
      case 'Orçamento':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  getStatusClasses(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'canceled':
        return 'bg-red-100 text-red-700';
      case 'no_show':
        return 'bg-red-100 text-red-700';
      case 'scheduled':
      default:
        return 'bg-blue-100 text-blue-700';
    }
  }

  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'scheduled': 'Agendado',
      'completed': 'Concluído',
      'canceled': 'Cancelado',
      'no_show': 'Não Compareceu'
    };
    return statusLabels[status] || status;
  }
}