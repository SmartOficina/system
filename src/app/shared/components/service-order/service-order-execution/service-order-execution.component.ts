import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceOrder, ServiceOrderStatus } from '../../../models/models';
import { ServiceOrderStatusUtils } from '@shared/utils/service-order-status.utils';

@Component({
  selector: 'app-service-order-execution',
  templateUrl: './service-order-execution.component.html',
  styleUrls: ['./service-order-execution.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class ServiceOrderExecutionComponent {
  @Input() serviceOrderData!: ServiceOrder;
  @Input() readonly: boolean = false;
  @Input() isLoading: boolean = false;
  @Input() statusOptions: { value: string, label: string }[] = [];
  @Output() updateStatusEvent = new EventEmitter<{ status: string, notes: string }>();
  @Output() completeServiceOrderEvent = new EventEmitter<void>();

  ServiceOrderStatus = ServiceOrderStatus;

  manualStatus: string = '';
  manualStatusNotes: string = '';

  constructor() { }

  getStatusClass(status: string): string {
    return ServiceOrderStatusUtils.getStatusClass(status);
  }

  getStatusLabel(status: string): string {
    return ServiceOrderStatusUtils.getStatusLabel(status);
  }

  updateStatus(statusData: { status: string, notes: string }): void {
    this.updateStatusEvent.emit(statusData);
  }

  manualUpdateStatus(): void {
    if (!this.manualStatus) return;
    this.updateStatusEvent.emit({ status: this.manualStatus, notes: this.manualStatusNotes || '' });
    this.manualStatus = '';
    this.manualStatusNotes = '';
  }

  completeServiceOrder(): void {
    this.completeServiceOrderEvent.emit();
  }
}