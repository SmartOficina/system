import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { ServiceOrderStatusUtils } from "@shared/utils/service-order-status.utils";

@Component({
  selector: "app-service-order-history-modal",
  templateUrl: "./service-order-history-modal.component.html",
  styleUrls: ["./service-order-history-modal.component.scss"],
  imports: [CommonModule, DatePipe],
})
export class ServiceOrderHistoryModalComponent implements OnInit {
  @Input() serviceOrderHistory: any[] = [];
  @Input() serviceOrderInfo: any;
  @Input() isLoading: boolean = false;
  @Output() closeModalEvent = new EventEmitter<void>();

  constructor() {}

  ngOnInit(): void {
    if (this.serviceOrderHistory && this.serviceOrderHistory.length > 0) {
      this.serviceOrderHistory.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
    }
  }

  getStatusLabel(status: string): string {
    return ServiceOrderStatusUtils.getStatusLabel(status);
  }

  getStatusColorClass(status: string): string {
    return ServiceOrderStatusUtils.getStatusClass(status);
  }

  closeModal(): void {
    this.closeModalEvent.emit();
  }
}
