import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from "@angular/core";
import { HttpResponse } from "@angular/common/http";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { ServicesService } from "@features/garage-system/components/services/services.service";
import { ToastService } from "@shared/services/toast.service";
import { InputGenericComponent } from "@shared/components/input-generic/input-generic.component";
import { Service } from "@shared/models/models";
import { CurrencyUtils } from "@shared/utils/currency-utils";

@Component({
  selector: "app-service-modal",
  templateUrl: "./service-modal.component.html",
  styleUrls: ["./service-modal.component.scss"],
  // prettier-ignore
  imports: [
    FormsModule,
    CommonModule,
    InputGenericComponent
  ],
})
export class ServiceModalComponent implements OnInit, OnChanges {
  @Input() service: Service | null = null;
  @Input() readonly: boolean = false;
  @Output() closeModalEvent: EventEmitter<void> = new EventEmitter<void>();
  @Output() serviceSaved: EventEmitter<void> = new EventEmitter<void>();

  serviceData: Service = {
    code: "",
    name: "",
    sellingPrice: 0,
    profitMargin: 30,
    costPrice: 0,
  };

  originalServiceData: Service = {
    code: "",
    name: "",
    sellingPrice: 0,
    profitMargin: 30,
    costPrice: 0,
  };

  formattedSellingPrice: string = "R$ 0,00";
  formattedCostPrice: string = "R$ 0,00";

  calculateFromMargin: boolean = true;
  isLoading: boolean = false;

  @ViewChild("codeInput") codeInput!: InputGenericComponent;
  @ViewChild("nameInput") nameInput!: InputGenericComponent;
  @ViewChild("profitMarginInput") profitMarginInput!: InputGenericComponent;

  // prettier-ignore
  constructor(
    private servicesService: ServicesService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    if (this.service) {
      this.loadServiceData();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["service"] && changes["service"].currentValue) {
      this.loadServiceData();
    } else if (changes["service"] && !changes["service"].currentValue) {
      this.resetServiceData();
    }
  }

  private loadServiceData(): void {
    this.serviceData = { ...this.service } as Service;

    this.formattedSellingPrice = CurrencyUtils.formatCurrencyWithPrefix(this.serviceData.sellingPrice || 0);
    this.formattedCostPrice = CurrencyUtils.formatCurrencyWithPrefix(this.serviceData.costPrice || 0);

    if (this.serviceData.sellingPrice && this.serviceData.profitMargin) {
      const calculatedCost = this.calculateCostFromSellingAndMargin(this.serviceData.sellingPrice, this.serviceData.profitMargin);
      const costDiff = Math.abs(calculatedCost - this.serviceData.costPrice);

      this.calculateFromMargin = costDiff < 0.01;
    }

    this.originalServiceData = JSON.parse(JSON.stringify(this.serviceData));
  }

  private resetServiceData(): void {
    this.serviceData = {
      code: "",
      name: "",
      sellingPrice: 0,
      profitMargin: 30,
      costPrice: 0,
    };
    this.formattedSellingPrice = "R$ 0,00";
    this.formattedCostPrice = "R$ 0,00";
    this.calculateFromMargin = true;
  }

  onSellingPriceChange(value: string): void {
    if (this.readonly) return;

    const result = CurrencyUtils.processMoneyInput(value);
    this.serviceData.sellingPrice = result.numericValue;
    this.formattedSellingPrice = result.formattedValue;

    if (this.calculateFromMargin) {
      this.calculateCostPrice();
    } else {
      this.calculateProfitMargin();
    }
  }

  onCostPriceChange(value: string): void {
    if (this.readonly || this.calculateFromMargin) return;

    const result = CurrencyUtils.processMoneyInput(value);
    this.serviceData.costPrice = result.numericValue;
    this.formattedCostPrice = result.formattedValue;

    this.calculateSellingPrice();
  }

  onMarginChange(value?: string): void {
    if (this.readonly) return;

    if (value !== undefined) {
      this.serviceData.profitMargin = Number(value);
    }

    if (this.calculateFromMargin) {
      this.calculateCostPrice();
    } else {
      this.calculateSellingPrice();
    }
  }

  onCalculationModeChange(): void {
    if (this.calculateFromMargin) {
      this.calculateCostPrice();
    } else {
      this.calculateSellingPrice();
    }
  }

  calculateCostPrice(): void {
    if (this.serviceData.sellingPrice > 0 && this.serviceData.profitMargin >= 0) {
      let calculatedCost = this.calculateCostFromSellingAndMargin(this.serviceData.sellingPrice, this.serviceData.profitMargin);

      calculatedCost = Math.round(calculatedCost * 100) / 100;

      this.serviceData.costPrice = calculatedCost;
      this.formattedCostPrice = CurrencyUtils.formatCurrencyWithPrefix(calculatedCost);
    }
  }

  calculateSellingPrice(): void {
    if (this.serviceData.costPrice > 0 && this.serviceData.profitMargin >= 0) {
      let calculatedSelling = this.calculateSellingFromCostAndMargin(this.serviceData.costPrice, this.serviceData.profitMargin);

      calculatedSelling = Math.round(calculatedSelling * 100) / 100;

      this.serviceData.sellingPrice = calculatedSelling;
      this.formattedSellingPrice = CurrencyUtils.formatCurrencyWithPrefix(calculatedSelling);
    }
  }

  calculateProfitMargin(): void {
    if (this.serviceData.costPrice > 0 && this.serviceData.sellingPrice > 0) {
      const marginDecimal = this.serviceData.sellingPrice / this.serviceData.costPrice - 1;
      this.serviceData.profitMargin = Math.round(marginDecimal * 100);

      if (this.serviceData.profitMargin < 0) {
        this.serviceData.profitMargin = 0;
      }
    } else {
      this.serviceData.profitMargin = 0;
    }
  }

  private calculateCostFromSellingAndMargin(sellingPrice: number, profitMargin: number): number {
    return Math.round((sellingPrice / (1 + profitMargin / 100)) * 100) / 100;
  }

  private calculateSellingFromCostAndMargin(costPrice: number, profitMargin: number): number {
    return Math.round(costPrice * (1 + profitMargin / 100) * 100) / 100;
  }

  saveService(): void {
    if (this.readonly) return;

    if (this.codeInput) {
      this.codeInput.inputTouched = true;
    }
    if (this.nameInput) {
      this.nameInput.inputTouched = true;
    }

    let valid = true;
    if (!this.codeInput.isValid() || !this.nameInput.isValid()) {
      valid = false;
    }

    if (valid) {
      if (this.service && this.service._id) {
        this.editService(this.service._id, this.serviceData);
      } else {
        this.createService(this.serviceData);
      }
    }
  }

  createService(serviceData: Service): void {
    this.isLoading = true;
    this.servicesService.createService(serviceData).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200) {
          this.toastService.success("Sucesso", "Serviço cadastrado com sucesso.");
          this.serviceSaved.emit();
          this.closeModal();
        }
        this.isLoading = false;
      },
      () => {
        this.isLoading = false;
      }
    );
  }

  editService(id: string, serviceData: Service): void {
    this.isLoading = true;
    this.servicesService.editService(id, serviceData).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200) {
          this.toastService.success("Sucesso", "Serviço atualizado com sucesso.");
          this.serviceSaved.emit();
          this.closeModal();
        }
        this.isLoading = false;
      },
      () => {
        this.isLoading = false;
      }
    );
  }

  enableEditing(): void {
    this.readonly = false;
  }

  closeModal(): void {
    this.closeModalEvent.emit();
  }

  get hasDataChanged(): boolean {
    if (!this.service || !this.service._id) {
      return true;
    }

    return JSON.stringify(this.serviceData) !== JSON.stringify(this.originalServiceData);
  }
}
