import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceOrderStatusUtils } from '../../../utils/service-order-status.utils';

@Component({
  selector: 'app-service-order-timeline',
  templateUrl: './service-order-timeline.component.html',
  styleUrls: ['./service-order-timeline.component.scss'],
  imports: [CommonModule]
})
export class ServiceOrderTimelineComponent implements OnInit {
  @Input() statusHistory: any[] = [];

  constructor() { }

  ngOnInit(): void {
  }

  getStatusLabel(status: string): string {
    return ServiceOrderStatusUtils.getStatusLabel(status);
  }

  getStatusColorClass(status: string): string {
    return ServiceOrderStatusUtils.getStatusClass(status);
  }

  formatDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}