import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrencyUtils } from './../../../utils/currency-utils';
import { ServiceOrder, ServiceOrderStatus, PaymentMethod } from '../../../models/models';

@Component({
    selector: 'app-service-order-completion',
    templateUrl: './service-order-completion.component.html',
    styleUrls: ['./service-order-completion.component.scss'],
    imports: [CommonModule, FormsModule]
})
export class ServiceOrderCompletionComponent {
  @Input() serviceOrderData!: ServiceOrder;
  @Input() readonly: boolean = false;
  @Input() isLoading: boolean = false;
  @Output() deliverVehicleEvent = new EventEmitter<void>();

  ServiceOrderStatus = ServiceOrderStatus;
  PaymentMethod = PaymentMethod;

  paymentMethodOptions = [
    { value: PaymentMethod.CASH, label: 'Dinheiro' },
    { value: PaymentMethod.CREDIT_CARD, label: 'Cartão de Crédito' },
    { value: PaymentMethod.DEBIT_CARD, label: 'Cartão de Débito' },
    { value: PaymentMethod.PIX_PF, label: 'PIX - PF' },
    { value: PaymentMethod.PIX_PJ, label: 'PIX - PJ' },
    { value: PaymentMethod.BANK_TRANSFER, label: 'Transferência Bancária' },
    { value: PaymentMethod.INSTALLMENT, label: 'Parcelado' }
  ];

  constructor() { }

  deliverVehicle(): void {
    this.deliverVehicleEvent.emit();
  }

  formatCurrency(value: number | null | undefined): string {
    return CurrencyUtils.formatCurrency(value);
  }
}