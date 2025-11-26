import { InventoryEntry, Part, Supplier } from "./../../models/models";
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from "@angular/core";
import { HttpResponse } from "@angular/common/http";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { InputGenericComponent } from "../../components/input-generic/input-generic.component";
import { AlertService } from "../../services/alert.service";
import { ToastService } from "../../services/toast.service";
import { finalize } from "rxjs";
import { InventoryEntriesService } from "src/app/features/garage-system/components/inventory/inventory-entries/inventory-entries.service";
import { PartsService } from "src/app/features/garage-system/components/inventory/parts/parts.service";
import { SuppliersService } from "src/app/features/garage-system/components/inventory/suppliers/suppliers.service";
import { PartDropdownComponent } from "../../components/part-dropdown/part-dropdown.component";
import { SupplierDropdownComponent } from "../../components/supplier-dropdown/supplier-dropdown.component";
import { CurrencyUtils } from "../../utils/currency-utils";
import { DateUtils } from "../../utils/date-utils";

@Component({
  selector: "app-inventory-entry-modal",
  templateUrl: "./inventory-entry-modal.component.html",
  styleUrls: ["./inventory-entry-modal.component.scss"],
  imports: [FormsModule, CommonModule, InputGenericComponent, PartDropdownComponent, SupplierDropdownComponent],
})
export class InventoryEntryModalComponent implements OnInit, OnChanges {
  @Input() entry: any | null = null;
  @Input() readonly: boolean = false;
  @Output() closeModalEvent: EventEmitter<void> = new EventEmitter<void>();
  @Output() entrySaved: EventEmitter<void> = new EventEmitter<void>();

  entryData: any = {
    partId: "",
    quantity: 1,
    costPrice: 0,
    profitMargin: 30,
    sellingPrice: 0,
    invoiceNumber: "",
    supplierId: "",
    description: "",
    entryDate: new Date().toISOString().split("T")[0],
  };

  parts: Part[] = [];
  suppliers: Supplier[] = [];
  selectedPart: any | null = null;
  selectedSupplier: any | null = null;

  formattedCostPrice: string = "R$ 0,00";
  formattedSellingPrice: string = "R$ 0,00";

  isLoadingParts: boolean = false;
  isLoadingSuppliers: boolean = false;
  isCalculatingPrice: boolean = false;
  isLoading: boolean = false;

  selectedPartId: string = "";
  selectedPartName: string = "";
  selectedPartStock: number = 0;
  selectedPartUnit: string = "";
  selectedPartCost: number = 0;
  selectedPartPrice: number = 0;
  selectedSupplierId: string = "";
  selectedSupplierName: string = "";

  @ViewChild("quantityInput") quantityInput!: InputGenericComponent;

  constructor(private inventoryEntriesService: InventoryEntriesService, private suppliersService: SuppliersService, private partsService: PartsService, private alertService: AlertService, private toastService: ToastService) {}

  ngOnInit(): void {
    if (this.entry) {
      this.loadEntryData();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["entry"] && changes["entry"].currentValue) {
      this.loadEntryData();
    } else if (changes["entry"] && !changes["entry"].currentValue) {
      this.resetEntryData();
    }
  }

  private loadEntryData(): void {
    this.entryData = { ...this.entry } as InventoryEntry;

    if (this.entry?.part) {
      this.selectedPart = this.entry.part;
      this.selectedPartId = this.entry.part._id || "";
      this.selectedPartName = this.entry.part.name || "";
      this.selectedPartStock = this.entry.part.currentStock || 0;
      this.selectedPartUnit = this.entry.part.unit || "";
      this.selectedPartCost = this.entry.part.costPrice || 0;
      this.selectedPartPrice = this.entry.part.sellingPrice || 0;
    } else if (this.entry?.partId) {
      if (typeof this.entry.partId === "object") {
        this.selectedPart = this.entry.partId;
        this.selectedPartId = this.entry.partId._id || "";
        this.selectedPartName = this.entry.partId.name || "";
        this.selectedPartStock = this.entry.partId.currentStock || 0;
        this.selectedPartUnit = this.entry.partId.unit || "";
        this.selectedPartCost = this.entry.partId.costPrice || 0;
        this.selectedPartPrice = this.entry.partId.sellingPrice || 0;
      } else {
        this.selectedPartId = this.entry.partId || "";
        this.loadPartDetails(this.entry.partId);
      }
    }

    if (this.entry?.supplier) {
      this.selectedSupplier = this.entry.supplier;
      this.selectedSupplierId = this.entry.supplier._id || "";
      this.selectedSupplierName = this.entry.supplier.name || "";
    } else if (this.entry?.supplierId) {
      if (typeof this.entry.supplierId === "object") {
        this.selectedSupplier = this.entry.supplierId;
        this.selectedSupplierId = this.entry.supplierId._id || "";
        this.selectedSupplierName = this.entry.supplierId.name || "";
      } else {
        this.selectedSupplierId = this.entry.supplierId || "";
        this.loadSupplierDetails(this.entry.supplierId);
      }
    }

    if (this.entryData.entryDate) {
      this.entryData.entryDate = DateUtils.toInputFormat(this.entryData.entryDate);
    } else {
      this.entryData.entryDate = DateUtils.toInputFormat(new Date());
    }

    this.formattedCostPrice = CurrencyUtils.formatCurrencyWithPrefix(this.entryData.costPrice || 0);
    this.formattedSellingPrice = CurrencyUtils.formatCurrencyWithPrefix(this.entryData.sellingPrice || 0);
  }

  private resetEntryData(): void {
    this.entryData = {
      partId: "",
      quantity: 1,
      costPrice: 0,
      profitMargin: 30,
      sellingPrice: 0,
      invoiceNumber: "",
      supplierId: "",
      description: "",
      entryDate: DateUtils.toInputFormat(new Date()),
    };
    this.selectedPart = null;
    this.selectedSupplier = null;
    this.selectedPartId = "";
    this.selectedPartName = "";
    this.selectedPartStock = 0;
    this.selectedPartUnit = "";
    this.selectedPartCost = 0;
    this.selectedPartPrice = 0;
    this.selectedSupplierId = "";
    this.selectedSupplierName = "";
    this.formattedCostPrice = "R$ 0,00";
    this.formattedSellingPrice = "R$ 0,00";
  }

  loadPartDetails(partId: string): void {
    if (!partId) return;

    this.partsService.getPart(partId).subscribe((response: HttpResponse<any>) => {
      if (response.status === 200 && response.body?.result) {
        this.selectedPart = response.body.result;
        this.selectedPartName = this.selectedPart.name;
        this.selectedPartStock = this.selectedPart.currentStock || 0;
        this.selectedPartUnit = this.selectedPart.unit || "";
        this.selectedPartCost = this.selectedPart.costPrice || 0;
        this.selectedPartPrice = this.selectedPart.sellingPrice || 0;

        if (!this.entry) {
          this.entryData.costPrice = this.selectedPart.costPrice || 0;
          this.entryData.profitMargin = this.selectedPart.profitMargin || 30;
          this.entryData.sellingPrice = this.selectedPart.sellingPrice || 0;
          this.formattedCostPrice = CurrencyUtils.formatCurrencyWithPrefix(this.entryData.costPrice);
          this.formattedSellingPrice = CurrencyUtils.formatCurrencyWithPrefix(this.entryData.sellingPrice);
        }
      }
    });
  }

  loadSupplierDetails(supplierId: string): void {
    if (!supplierId) return;

    this.suppliersService.getSupplier(supplierId).subscribe((response: HttpResponse<any>) => {
      if (response.status === 200 && response.body?.result) {
        this.selectedSupplier = response.body.result;
        this.selectedSupplierName = this.selectedSupplier.name;
      }
    });
  }

  onPartSelected(partInfo: any): void {
    if (this.readonly) return;

    this.selectedPart = partInfo.part;
    this.selectedPartId = partInfo.partId;
    this.selectedPartName = partInfo.name;
    this.selectedPartStock = partInfo.currentStock || 0;
    this.selectedPartUnit = partInfo.unit || "";
    this.selectedPartCost = partInfo.costPrice || 0;
    this.selectedPartPrice = partInfo.sellingPrice || 0;
    this.entryData.partId = partInfo.partId;

    if (partInfo.costPrice !== undefined && partInfo.sellingPrice !== undefined) {
      this.entryData.costPrice = partInfo.costPrice;
      this.entryData.sellingPrice = partInfo.sellingPrice;
      this.entryData.profitMargin = partInfo.profitMargin || 30;

      this.formattedCostPrice = CurrencyUtils.formatCurrencyWithPrefix(this.entryData.costPrice);
      this.formattedSellingPrice = CurrencyUtils.formatCurrencyWithPrefix(this.entryData.sellingPrice);
    }
  }

  onSupplierSelected(supplierInfo: any): void {
    if (this.readonly) return;

    this.selectedSupplierId = supplierInfo.supplierId;
    this.selectedSupplierName = supplierInfo.name;
    this.entryData.supplierId = supplierInfo.supplierId;
  }

  onCostPriceChange(value: string): void {
    if (this.readonly) return;

    const result = CurrencyUtils.processMoneyInput(value);
    this.entryData.costPrice = result.numericValue;
    this.formattedCostPrice = result.formattedValue;
    this.calculateSellingPrice();
  }

  onSellingPriceChange(value: string): void {
    if (this.readonly) return;

    const result = CurrencyUtils.processMoneyInput(value);
    this.entryData.sellingPrice = result.numericValue;
    this.formattedSellingPrice = result.formattedValue;

    if (this.entryData.costPrice > 0) {
      this.calculateProfitMargin();
    }
  }

  onCostOrMarginChange(): void {
    if (this.readonly) return;
    this.calculateSellingPrice();
  }

  calculateSellingPrice(): void {
    if (this.entryData.costPrice && this.entryData.profitMargin !== undefined) {
      this.isCalculatingPrice = true;
      setTimeout(() => {
        this.entryData.sellingPrice = this.entryData.costPrice * (1 + this.entryData.profitMargin / 100);
        this.formattedSellingPrice = CurrencyUtils.formatCurrencyWithPrefix(this.entryData.sellingPrice);
        this.isCalculatingPrice = false;
      }, 300);
    }
  }

  calculateProfitMargin(): void {
    if (this.entryData.costPrice > 0 && this.entryData.sellingPrice > 0) {
      const marginDecimal = this.entryData.sellingPrice / this.entryData.costPrice - 1;
      this.entryData.profitMargin = Math.round(marginDecimal * 100);

      if (this.entryData.profitMargin < 0) {
        this.entryData.profitMargin = 0;
      }
    } else {
      this.entryData.profitMargin = 0;
    }
  }

  saveEntry(): void {
    if (this.readonly) return;

    if (!this.selectedPartId) {
      this.alertService.showAlert("Erro!", "Selecione uma peça.", "error", "Fechar");
      return;
    }

    if (!this.entryData.quantity || this.entryData.quantity <= 0) {
      this.alertService.showAlert("Erro!", "Quantidade deve ser maior que zero.", "error", "Fechar");
      return;
    }

    if (!this.entryData.costPrice || this.entryData.costPrice < 0) {
      this.alertService.showAlert("Erro!", "Preço de custo deve ser maior ou igual a zero.", "error", "Fechar");
      return;
    }

    if (!this.entryData.sellingPrice || this.entryData.sellingPrice < 0) {
      this.alertService.showAlert("Erro!", "Preço de venda deve ser maior ou igual a zero.", "error", "Fechar");
      return;
    }

    if (!this.entryData.entryDate) {
      this.alertService.showAlert("Erro!", "Data de entrada é obrigatória.", "error", "Fechar");
      return;
    }

    const entryDataToSend = {
      ...this.entryData,
      partId: this.selectedPartId,
      quantity: Math.floor(this.entryData.quantity),
      costPrice: Number(this.entryData.costPrice),
      sellingPrice: Number(this.entryData.sellingPrice),
      profitMargin: Number(this.entryData.profitMargin || 0),
      description: this.entryData.description?.trim() || `Entrada de estoque - ${this.selectedPartName}`,
      supplierId: this.selectedSupplierId || undefined,
      invoiceNumber: this.entryData.invoiceNumber?.trim() || undefined,
      entryDate: this.entryData.entryDate + "T12:00:00.000Z",
    };



    if (this.entry && this.entry._id) {
      this.editEntry(this.entry._id, entryDataToSend);
    } else {
      this.createEntry(entryDataToSend);
    }
  }

  createEntry(entryData: any): void {
    this.isLoading = true;
    this.inventoryEntriesService
      .createEntry(entryData)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        (response: HttpResponse<any>) => {
          if (response.status === 200) {
            this.toastService.success("Sucesso!", "Entrada de estoque registrada com sucesso.");
            this.entrySaved.emit();
            this.closeModal();
          }
        },
        (error: any) => {

          if (error.status === 400 && error.error?.msg) {
            this.alertService.showAlert("Erro de Validação", error.error.msg, "error", "Fechar");
          } else {
            this.alertService.showAlert("Erro", "Ocorreu um erro ao processar a entrada. Verifique os dados e tente novamente.", "error", "Fechar");
          }
        }
      );
  }

  editEntry(id: string, entryData: any): void {
    this.isLoading = true;
    this.inventoryEntriesService
      .editEntry(id, entryData)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        (response: HttpResponse<any>) => {
          if (response.status === 200) {
            this.toastService.success("Sucesso!", "Entrada de estoque editada com sucesso.");
            this.entrySaved.emit();
            this.closeModal();
          }
        },
        (error: any) => {

          if (error.status === 400 && error.error?.msg) {
            this.alertService.showAlert("Erro de Validação", error.error.msg, "error", "Fechar");
          } else {
            this.alertService.showAlert("Erro", "Ocorreu um erro ao processar a edição. Verifique os dados e tente novamente.", "error", "Fechar");
          }
        }
      );
  }

  closeModal(): void {
    this.closeModalEvent.emit();
  }

  enableEditing(): void {
    this.readonly = false;
  }
}
