import { Component, Input, Output, EventEmitter, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { CurrencyUtils } from "./../../../utils/currency-utils";
import { ServiceOrder, ServiceOrderStatus } from "./../../../models/models";
import { PrintService } from "../../../services/print.service";
import { InventoryService } from "../../../services/inventory.service";
import { PartDropdownComponent } from "../../part-dropdown/part-dropdown.component";
import { ServiceDropdownComponent } from "../../service-dropdown/service-dropdown.component";
import { AlertService } from "../../../services/alert.service";

interface PartItemWithInventory {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  formattedUnitPrice?: string;
  partId?: string;
  fromInventory?: boolean;
  code?: string;
  _id?: string;
}

interface ServiceItemWithPricing {
  description: string;
  estimatedHours: number;
  pricePerHour: number;
  totalPrice: number;
  formattedPricePerHour?: string;
  serviceId?: string;
  code?: string;
  _id?: string;
}

@Component({
  selector: "app-service-order-diagnosis",
  templateUrl: "./service-order-diagnosis.component.html",
  styleUrls: ["./service-order-diagnosis.component.scss"],
  standalone: true,
  imports: [CommonModule, FormsModule, PartDropdownComponent, ServiceDropdownComponent],
})
export class ServiceOrderDiagnosisComponent implements OnInit {
  @Input() serviceOrderData!: ServiceOrder;
  @Input() readonly: boolean = false;
  @Input() isLoading: boolean = false;
  @Input() showGenerateBudgetButton: boolean = true;
  @Input() selectedClientName: string = "";
  @Input() approvalLink: string = "";

  @Input() isNewDiagnosis: boolean = false;

  @Output() generateDiagnosticAndBudgetEvent = new EventEmitter<void>();
  @Output() approveBudgetEvent = new EventEmitter<void>();
  @Output() rejectBudgetEvent = new EventEmitter<void>();
  @Output() partsOrServicesChanged = new EventEmitter<void>();
  @Output() shareBudgetEvent = new EventEmitter<void>();
  @Output() cancelEvent = new EventEmitter<void>();
  @Output() startDiagnosisEvent = new EventEmitter<void>();
  @Output() share = new EventEmitter<{ method: string; recipient: string }>();
  @Output() statusChangeEvent = new EventEmitter<{ id: string; status: ServiceOrderStatus; notes?: string }>();

  ServiceOrderStatus = ServiceOrderStatus;
  formatCurrency = CurrencyUtils.formatCurrency;
  formatCurrencyWithPrefix = CurrencyUtils.formatCurrencyWithPrefix;

  previousStatus: ServiceOrderStatus | null = null;
  inventoryChecked: boolean = false;
  hasMissingParts: boolean = false;
  missingParts: any[] = [];

  shareMethod: string = "copy";
  recipientEmail: string = "";
  recipientPhone: string = "";
  customMessage: string = "";
  linkCopied: boolean = false;
  
  estimatedCompletionDateError: boolean = false;

  constructor(private printService: PrintService, private inventoryService: InventoryService, private alertService: AlertService) {}

  ngOnInit() {
    this.previousStatus = this.serviceOrderData?.status;

    this.initializeArrays();

    if (this.isNewDiagnosis) {
      this.clearArrays();
    }

    this.initializeFormattedValues();

    if (this.approvalLink) {
      this.prepareDefaultMessage();
    }
  }

  private initializeArrays() {
    if (!this.serviceOrderData.identifiedProblems) {
      this.serviceOrderData.identifiedProblems = [];
    }
    if (!this.serviceOrderData.requiredParts) {
      this.serviceOrderData.requiredParts = [];
    }
    if (!this.serviceOrderData.services) {
      this.serviceOrderData.services = [];
    }
  }

  private clearArrays() {
    if (this.serviceOrderData) {
      this.serviceOrderData.requiredParts = [];
      this.serviceOrderData.services = [];

      this.serviceOrderData.estimatedTotalParts = 0;
      this.serviceOrderData.estimatedTotalServices = 0;
      this.serviceOrderData.estimatedTotal = 0;
    }
  }

  public initializeFormattedValues() {
    if (this.serviceOrderData.requiredParts) {
      this.serviceOrderData.requiredParts.forEach((part: any) => {
        if (part.unitPrice) {
          part.formattedUnitPrice = this.formatCurrencyWithPrefix(part.unitPrice);
        } else {
          part.formattedUnitPrice = "R$ 0,00";
        }
      });
    }

    if (this.serviceOrderData.services) {
      this.serviceOrderData.services.forEach((service: any) => {
        if (service.pricePerHour) {
          service.formattedPricePerHour = this.formatCurrencyWithPrefix(service.pricePerHour);
        } else {
          service.formattedPricePerHour = "R$ 0,00";
        }
      });
    }
  }

  getProblemsText(): string {
    if (!this.serviceOrderData.identifiedProblems) return "";
    return this.serviceOrderData.identifiedProblems.join("\n");
  }

  setProblemsText(text: string): void {
    this.serviceOrderData.identifiedProblems = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    this.partsOrServicesChanged.emit();
  }

  addRequiredPart(): void {
    if (!this.serviceOrderData.requiredParts) {
      this.serviceOrderData.requiredParts = [];
    }

    const newPart: PartItemWithInventory = {
      description: "",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      formattedUnitPrice: "R$ 0,00",
      fromInventory: false,
    };

    this.serviceOrderData.requiredParts.push(newPart);
    this.partsOrServicesChanged.emit();
  }

  removeRequiredPart(index: number): void {
    if (this.serviceOrderData.requiredParts) {
      this.serviceOrderData.requiredParts.splice(index, 1);
      this.calculateTotals();
      this.partsOrServicesChanged.emit();
    }
  }

  onUnitPriceKeypress(part: PartItemWithInventory, value: string): void {
    const result = CurrencyUtils.processMoneyInput(value);
    part.unitPrice = result.numericValue;
    part.formattedUnitPrice = result.formattedValue;
    this.updatePartTotalPrice(part);
  }

  updatePartTotalPrice(part: PartItemWithInventory): void {
    part.totalPrice = part.quantity * part.unitPrice;
    this.calculateTotals();
    this.partsOrServicesChanged.emit();
  }

  onPartSelected(partInfo: any, index: number): void {
    if (!this.serviceOrderData.requiredParts) {
      this.serviceOrderData.requiredParts = [];
    }

    const part = this.serviceOrderData.requiredParts[index] as PartItemWithInventory;

    if (partInfo && partInfo.partId) {
      part.description = partInfo.name;
      part.partId = partInfo.partId;
      part.fromInventory = true;
      part.code = partInfo.code;
      part.unitPrice = partInfo.sellingPrice || 0;
      part.formattedUnitPrice = this.formatCurrencyWithPrefix(part.unitPrice);
      this.updatePartTotalPrice(part);
      this.verifyPartAvailability(part);
    } else {
      part.description = "";
      part.partId = undefined;
      part.code = undefined;
      part.fromInventory = false;
      part.unitPrice = 0;
      part.totalPrice = 0;
      part.formattedUnitPrice = "R$ 0,00";
      this.calculateTotals();
      this.partsOrServicesChanged.emit();
    }
  }

  verifyPartAvailability(part: PartItemWithInventory): void {
    if (part.fromInventory && part.partId) {
      this.inventoryService.getPartStock(part.partId).subscribe(
        (response: any) => {
          if (response.body?.result) {
            const stockInfo = response.body.result;
            if (stockInfo.currentStock < part.quantity) {
              this.alertService.showAlert("Estoque insuficiente", `A peça ${part.description} possui apenas ${stockInfo.currentStock} ${stockInfo.unit} em estoque, mas você solicitou ${part.quantity}.`, "warning", "OK");
            }
          }
        },
        (error) => {
        }
      );
    }
  }

  addService(): void {
    if (!this.serviceOrderData.services) {
      this.serviceOrderData.services = [];
    }

    const newService: ServiceItemWithPricing = {
      description: "",
      estimatedHours: 1,
      pricePerHour: 0,
      totalPrice: 0,
      formattedPricePerHour: "R$ 0,00",
      serviceId: undefined,
      code: undefined,
    };

    this.serviceOrderData.services.push(newService);
    this.partsOrServicesChanged.emit();
  }

  removeService(index: number): void {
    if (this.serviceOrderData.services) {
      this.serviceOrderData.services.splice(index, 1);
      this.calculateTotals();
      this.partsOrServicesChanged.emit();
    }
  }

  onPricePerHourKeypress(service: ServiceItemWithPricing, value: string): void {
    const result = CurrencyUtils.processMoneyInput(value);
    service.pricePerHour = result.numericValue;
    service.formattedPricePerHour = result.formattedValue;
    this.updateServiceTotalPrice(service);
  }

  updateServiceTotalPrice(service: ServiceItemWithPricing): void {
    service.totalPrice = service.estimatedHours * service.pricePerHour;
    this.calculateTotals();
    this.partsOrServicesChanged.emit();
  }

  onServiceSelected(serviceInfo: any, index: number): void {
    if (!this.serviceOrderData.services) {
      this.serviceOrderData.services = [];
    }

    const service = this.serviceOrderData.services[index] as ServiceItemWithPricing;

    if (serviceInfo && serviceInfo.serviceId) {
      service.description = serviceInfo.name;
      service.serviceId = serviceInfo.serviceId;
      service.code = serviceInfo.code;
      service.pricePerHour = serviceInfo.sellingPrice || 0;
      service.formattedPricePerHour = this.formatCurrencyWithPrefix(service.pricePerHour);
      this.updateServiceTotalPrice(service);
    } else {
      service.description = "";
      service.serviceId = undefined;
      service.code = undefined;
      service.pricePerHour = 0;
      service.totalPrice = 0;
      service.formattedPricePerHour = "R$ 0,00";
      this.calculateTotals();
      this.partsOrServicesChanged.emit();
    }
  }

  calculateTotals(): void {
    this.serviceOrderData.estimatedTotalParts = this.serviceOrderData.requiredParts?.reduce((sum: number, part: any) => sum + part.totalPrice, 0) || 0;

    this.serviceOrderData.estimatedTotalServices = this.serviceOrderData.services?.reduce((sum: number, service: any) => sum + service.totalPrice, 0) || 0;

    this.serviceOrderData.estimatedTotal = this.serviceOrderData.estimatedTotalParts + this.serviceOrderData.estimatedTotalServices;
  }

  checkInventoryAvailability(): Promise<boolean> {
    return new Promise((resolve) => {
      const inventoryParts = (this.serviceOrderData.requiredParts || [])
        .filter((part: any) => part.fromInventory && part.partId)
        .map((part: any) => ({
          partId: part.partId,
          quantity: part.quantity,
        }));

      if (inventoryParts.length === 0) {
        this.inventoryChecked = true;
        this.hasMissingParts = false;
        this.missingParts = [];
        resolve(true);
        return;
      }

      this.inventoryService.checkPartsAvailability(inventoryParts).subscribe(
        (response: any) => {
          if (response.body?.result) {
            const result = response.body.result;
            this.inventoryChecked = true;
            this.hasMissingParts = !result.allAvailable;
            this.missingParts = result.items.filter((item: any) => !item.available);

            resolve(result.allAvailable);
          } else {
            this.alertService.showAlert("Erro", "Não foi possível verificar a disponibilidade do estoque.", "error", "OK");
            resolve(false);
          }
        },
        (error) => {
          this.alertService.showAlert("Erro", "Erro ao verificar disponibilidade de estoque.", "error", "OK");
          resolve(false);
        }
      );
    });
  }

  async startDiagnosis(): Promise<void> {
    this.previousStatus = this.serviceOrderData.status;
    this.startDiagnosisEvent.emit();
  }

  async generateDiagnosticAndBudget(): Promise<void> {
    if (!this.serviceOrderData.estimatedCompletionDate) {
      this.estimatedCompletionDateError = true;
      return;
    }
    
    this.estimatedCompletionDateError = false;
    this.generateDiagnosticAndBudgetEvent.emit();
  }
  
  onEstimatedCompletionDateChange(): void {
    if (this.serviceOrderData.estimatedCompletionDate) {
      this.estimatedCompletionDateError = false;
    }
  }

  async approveBudget(): Promise<void> {
    this.approveBudgetEvent.emit();
  }

  async rejectBudget(): Promise<void> {
    this.rejectBudgetEvent.emit();
  }

  shareBudget(): void {
    this.shareBudgetEvent.emit();
  }

  cancelAction(): void {
    if (this.isNewDiagnosis) {
      this.clearArrays();
    }
    this.cancelEvent.emit();
  }

  shareViaWhatsApp(): void {
    const phone = this.recipientPhone.replace(/\D/g, "");
    const encodedMessage = encodeURIComponent(this.customMessage);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
    this.share.emit({ method: "whatsapp", recipient: this.recipientPhone });
  }

  shareViaEmail(): void {
    this.share.emit({ method: "email", recipient: this.recipientEmail });
    alert(`Email enviado para ${this.recipientEmail} com sucesso!`);
  }

  copyLinkToClipboard(): void {
    navigator.clipboard.writeText(this.approvalLink).then(
      () => {
        this.linkCopied = true;
        setTimeout(() => {
          this.linkCopied = false;
        }, 3000);

        this.share.emit({ method: "clipboard", recipient: "clipboard" });
      },
      (err) => {
        alert("Não foi possível copiar o link. Por favor, copie manualmente.");
      }
    );
  }

  printBudget(): void {
    this.printService.printBudget(this.serviceOrderData, this.selectedClientName);
    this.share.emit({ method: "print", recipient: "printer" });
  }

  prepareDefaultMessage(): void {
    if (this.serviceOrderData && this.approvalLink) {
      const formattedTotal = this.formatCurrencyWithPrefix(this.serviceOrderData.estimatedTotal || 0);

      this.customMessage = `Olá ${this.selectedClientName},\n\nO orçamento para o seu veículo está pronto.\nValor total: ${formattedTotal}\n\nClique no link abaixo para visualizar e aprovar o orçamento:\n${this.approvalLink}\n\nAguardamos sua resposta.`;

      if (this.serviceOrderData.client) {
        const client = this.serviceOrderData.client as any;
        this.recipientEmail = client.email || "";
        this.recipientPhone = client.phone || "";
      } else if (this.serviceOrderData.vehicle && this.serviceOrderData.vehicle.client) {
        const client = this.serviceOrderData.vehicle.client as any;
        this.recipientEmail = client.email || "";
        this.recipientPhone = client.phone || "";
      }
    }
  }
}
