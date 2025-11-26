import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { HttpResponse } from "@angular/common/http";
import { InventoryEntriesService } from "@features/garage-system/components/inventory/inventory-entries/inventory-entries.service";
import { PartsService } from "@features/garage-system/components/inventory/parts/parts.service";
import { PartDropdownComponent } from "@shared/components/part-dropdown/part-dropdown.component";
import { AlertService } from "@shared/services/alert.service";
import { ToastService } from "@shared/services/toast.service";
import { InputGenericComponent } from "@shared/components/input-generic/input-generic.component";

@Component({
  selector: "app-inventory-exit-modal",
  templateUrl: "./inventory-exit-modal.component.html",
  styleUrls: ["./inventory-exit-modal.component.scss"],
  imports: [FormsModule, CommonModule, InputGenericComponent, PartDropdownComponent],
})
export class InventoryExitModalComponent implements OnInit {
  @Input() readonly: boolean = false;
  @Output() closeModalEvent: EventEmitter<void> = new EventEmitter<void>();
  @Output() exitSaved: EventEmitter<void> = new EventEmitter<void>();

  exitData = {
    partId: "",
    quantity: 1,
    costPrice: 0,
    sellingPrice: 0,
    description: "",
    exitType: "manual",
    reference: "",
  };

  exitTypes = [
    { value: "manual", label: "Saída Manual" },
    { value: "loss", label: "Perda" },
    { value: "transfer", label: "Transferência" },
  ];

  isLoading: boolean = false;
  isValidatingStock: boolean = false;
  selectedPartStock: number = 0;
  selectedPartInfo: any = null;
  formValid: boolean = true;

  constructor(private inventoryEntriesService: InventoryEntriesService, private partsService: PartsService, private alertService: AlertService, private toastService: ToastService) {}

  ngOnInit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.exitData = {
      partId: "",
      quantity: 1,
      costPrice: 0,
      sellingPrice: 0,
      description: "",
      exitType: "manual",
      reference: "",
    };
    this.selectedPartStock = 0;
    this.selectedPartInfo = null;
    this.formValid = true;
  }

  onPartSelected(event: any): void {
    this.exitData.partId = event.partId;
    this.selectedPartStock = event.currentStock || 0;
    this.selectedPartInfo = event.part || event;

    if (this.selectedPartInfo) {
      this.exitData.costPrice = parseFloat((this.selectedPartInfo.averageCost || this.selectedPartInfo.costPrice || 0).toFixed(2));
      this.exitData.sellingPrice = parseFloat((this.selectedPartInfo.sellingPrice || 0).toFixed(2));
    }
    if (this.exitData.partId) {
      this.revalidateStock().then((success) => {
        if (success) {
        }
      });
    }
  }

  closeModal(): void {
    this.closeModalEvent.emit();
  }

  async revalidateStock(): Promise<boolean> {
    if (!this.exitData.partId) {
      return true;
    }

    this.isValidatingStock = true;
    try {
      const response = await this.partsService.getPart(this.exitData.partId).toPromise();

      if (response?.status === 200 && response.body?.result) {
        const newStock = response.body.result.currentStock || 0;

        if (newStock !== this.selectedPartStock) {
          this.selectedPartStock = newStock;
        }

        return true;
      } else {
        return true;
      }
    } catch (error) {
      return true;
    } finally {
      this.isValidatingStock = false;
    }
  }

  async validateForm(): Promise<void> {
    this.formValid = true;

    if (!this.exitData.partId) {
      this.alertService.showAlert("Erro!", "Selecione uma peça.", "error", "Fechar");
      this.formValid = false;
      return;
    }

    if (!this.exitData.quantity || this.exitData.quantity <= 0) {
      this.alertService.showAlert("Erro!", "Quantidade deve ser maior que zero.", "error", "Fechar");
      this.formValid = false;
      return;
    }

    if (!this.exitData.description?.trim()) {
      this.alertService.showAlert("Erro!", "Descrição é obrigatória.", "error", "Fechar");
      this.formValid = false;
      return;
    }

    if (this.exitData.description.trim().length < 3) {
      this.alertService.showAlert("Erro!", "Descrição deve ter pelo menos 3 caracteres.", "error", "Fechar");
      this.formValid = false;
      return;
    }

    if (this.exitData.costPrice < 0) {
      this.alertService.showAlert("Erro!", "Preço de custo não pode ser negativo.", "error", "Fechar");
      this.formValid = false;
      return;
    }

    if (this.exitData.sellingPrice < 0) {
      this.alertService.showAlert("Erro!", "Preço de venda não pode ser negativo.", "error", "Fechar");
      this.formValid = false;
      return;
    }

    await this.revalidateStock();

    if (this.exitData.quantity > this.selectedPartStock) {
      this.alertService.showAlert("Estoque Insuficiente!", `Quantidade solicitada: ${this.exitData.quantity}\nEstoque disponível: ${this.selectedPartStock}\n\nNão é possível realizar esta saída.`, "error", "Fechar");
      this.formValid = false;
      return;
    }

    if (this.selectedPartStock > 0 && this.exitData.quantity > this.selectedPartStock * 0.5) {
      const confirmed = await this.alertService.showAlert("Quantidade Alta", `Você está retirando ${this.exitData.quantity} unidades de um estoque de ${this.selectedPartStock}. Deseja continuar?`, "warning", "Sim", "Cancelar");

      if (!confirmed) {
        this.formValid = false;
        return;
      }
    }
  }

  async saveExit(): Promise<void> {
    if (this.readonly) return;

    try {
      await this.validateForm();

      if (this.formValid) {
        this.isLoading = true;

        const exitDataToSend = {
          ...this.exitData,
          quantity: Math.floor(this.exitData.quantity),
          description: this.exitData.description.trim(),
          costPrice: Number(this.exitData.costPrice),
          sellingPrice: Number(this.exitData.sellingPrice),
        };

        this.inventoryEntriesService.createManualExit(exitDataToSend).subscribe(
          (response: HttpResponse<any>) => {
            if (response.status === 200) {
              this.toastService.success("Sucesso!", "Saída registrada com sucesso.");
              this.exitSaved.emit();
              this.closeModal();
            }
            this.isLoading = false;
          },
          (error: any) => {
            this.isLoading = false;

            if (error.status === 400 && error.error?.msg) {
              this.alertService.showAlert("Erro de Validação", error.error.msg, "error", "Fechar");
            } else if (error.status === 0) {
              this.alertService.showAlert("Erro de Conexão", "Não foi possível conectar ao servidor. Verifique sua conexão.", "error", "Fechar");
            } else {
              this.alertService.showAlert("Erro", "Ocorreu um erro ao processar a saída. Tente novamente.", "error", "Fechar");
            }
          }
        );
      }
    } catch (error) {
      this.alertService.showAlert("Erro", "Ocorreu um erro durante a validação. Tente novamente.", "error", "Fechar");
    }
  }
}
