import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ServiceOrder } from "@shared/models/models";
import { CurrencyUtils } from "@shared/utils/currency-utils";
import { ServiceOrderStatusUtils } from "@shared/utils/service-order-status.utils";

@Component({
  selector: "app-budget-share",
  templateUrl: "./budget-share.component.html",
  styleUrls: ["./budget-share.component.scss"],
  imports: [CommonModule, FormsModule],
})
export class BudgetShareComponent {
  @Input() serviceOrderData!: ServiceOrder;
  @Input() approvalLink: string = "";
  @Output() share = new EventEmitter<{ method: string; recipient: string }>();

  @ViewChild("modalContainer") modalContainer!: ElementRef;

  isVisible: boolean = false;
  shareMethod: string = "whatsapp";
  recipientEmail: string = "";
  recipientPhone: string = "";
  customMessage: string = "";
  selectedClientName: string = "";
  formattedTotal: string = "";

  getStatusLabel = ServiceOrderStatusUtils.getStatusLabel;
  formatCurrency = CurrencyUtils.formatCurrency;

  constructor() {}

  show(serviceOrder: ServiceOrder, approvalLink: string): void {
    this.serviceOrderData = serviceOrder;
    this.approvalLink = approvalLink;

    if (this.serviceOrderData.client) {
      const client = this.serviceOrderData.client as any;
      this.selectedClientName = client.fullName || "";
      this.recipientEmail = client.email || "";
      this.recipientPhone = client.phone || "";
    } else if (this.serviceOrderData.vehicle && this.serviceOrderData.vehicle.client) {
      const client = this.serviceOrderData.vehicle.client as any;
      this.selectedClientName = client.fullName || "";
      this.recipientEmail = client.email || "";
      this.recipientPhone = client.phone || "";
    }

    this.formattedTotal = CurrencyUtils.formatCurrencyWithPrefix(this.serviceOrderData.estimatedTotal || 0);

    this.customMessage = `Olá ${this.selectedClientName},\n\nO orçamento para o seu veículo está pronto.\nValor total: ${this.formattedTotal}\n\nClique no link abaixo para visualizar e aprovar o orçamento:\n${this.approvalLink}\n\nAguardamos sua resposta.`;

    this.isVisible = true;
  }

  hide(): void {
    this.isVisible = false;
  }

  shareViaWhatsApp(): void {
    const phone = this.recipientPhone.replace(/\D/g, "");
    const encodedMessage = encodeURIComponent(this.customMessage);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
    this.share.emit({ method: "whatsapp", recipient: this.recipientPhone });
    this.hide();
  }

  shareViaEmail(): void {
    this.share.emit({ method: "email", recipient: this.recipientEmail });
    this.hide();
    alert(`Email enviado para ${this.recipientEmail} com sucesso!`);
  }

  copyLinkToClipboard(): void {
    navigator.clipboard.writeText(this.approvalLink).then(
      () => {
        alert("Link copiado para a área de transferência");
        this.share.emit({ method: "clipboard", recipient: "clipboard" });
        this.hide();
      },
      (err) => {
        alert("Não foi possível copiar o link. Por favor, copie manualmente.");
      }
    );
  }
}
