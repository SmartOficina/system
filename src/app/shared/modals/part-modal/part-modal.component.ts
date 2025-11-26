import { Part } from "./../../models/models";
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from "@angular/core";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { InputGenericComponent } from "../../components/input-generic/input-generic.component";
import { AlertService } from "../../services/alert.service";
import { finalize } from "rxjs";
import { PartsService } from "@features/garage-system/components/inventory/parts/parts.service";
import { CurrencyUtils } from "../../utils/currency-utils";
import { ToastService } from "../../services/toast.service";

@Component({
  selector: "app-part-modal",
  templateUrl: "./part-modal.component.html",
  styleUrls: ["./part-modal.component.scss"],
  imports: [FormsModule, CommonModule, InputGenericComponent],
})
export class PartModalComponent implements OnInit, OnChanges {
  @Input() part: Part | null = null;
  @Input() readonly: boolean = false;
  @Output() closeModalEvent: EventEmitter<void> = new EventEmitter<void>();
  @Output() partSaved: EventEmitter<void> = new EventEmitter<void>();

  partData: any = {
    code: "",
    name: "",
    sellingPrice: 0,
    costPrice: 0,
    averageCost: 0,
    profitMargin: 30,
    minimumStock: 0,
    unit: "",
    location: "",
    barcode: "",
    manufacturerCode: "",
    ncmCode: "",
    cfopCode: "",
    anpCode: "",
    anpDescription: "",
    anpConsumptionState: "",
    cestCode: "",
    currentStock: 0,
  };

  unitOptions: string[] = ["AMPOLA", "BALDE", "BANDEJA", "BARRA", "BISNAGA", "BLOCO", "BOBINA", "BOMBONA", "CAPSULA", "CARTELA", "CENTO", "CONJUNTO", "CENTIMETRO", "CENTIMETRO QUADRADO", "CAIXA", "CAIXA COM 2 UNIDADES", "CAIXA COM 3 UNIDADES", "CAIXA COM 5 UNIDADES", "CAIXA COM 10 UNIDADES", "CAIXA COM 15 UNIDADES", "CAIXA COM 20 UNIDADES", "CAIXA COM 25 UNIDADES", "CAIXA COM 50 UNIDADES", "CAIXA COM 100 UNIDADES", "DISPLAY", "DUZIA", "EMBALAGEM", "FARDO", "FOLHA", "FRASCO", "GALÃO", "GARRAFA", "GRAMAS", "JOGO", "QUILOGRAMA", "KIT", "LATA", "LITRO", "METRO", "METRO QUADRADO", "METRO CÚBICO", "MILHEIRO", "MILILITRO", "MEGAWATT HORA", "PACOTE", "PALETE", "PARES", "PEÇA", "POTE", "QUILATE", "RESMA", "ROLO", "SACO", "SACOLA", "TAMBOR", "TANQUE", "TONELADA", "TUBO", "UNIDADE", "VASILHAME", "VIDRO"];

  stateOptions: string[] = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

  isCalculatingPrice: boolean = false;
  isLoading: boolean = false;
  formValid: boolean = false;

  formattedCostPrice: string = "R$ 0,00";
  formattedSellingPrice: string = "R$ 0,00";
  formattedAverageCost: string = "R$ 0,00";

  @ViewChild("codeInput") codeInput!: InputGenericComponent;
  @ViewChild("nameInput") nameInput!: InputGenericComponent;
  @ViewChild("unitInput") unitInput!: HTMLSelectElement;

  constructor(private partsService: PartsService, private alertService: AlertService, private toastService: ToastService) {}

  ngOnInit(): void {
    if (this.part) {
      this.loadPartData();
    }
    this.validateForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["part"] && changes["part"].currentValue) {
      this.loadPartData();
    } else if (changes["part"] && !changes["part"].currentValue) {
      this.resetPartData();
    }
    this.validateForm();
  }

  private loadPartData(): void {
    this.partData = { ...this.part } as Part;

    this.formattedCostPrice = CurrencyUtils.formatCurrencyWithPrefix(this.partData.costPrice || 0);
    this.formattedSellingPrice = CurrencyUtils.formatCurrencyWithPrefix(this.partData.sellingPrice || 0);
    this.formattedAverageCost = CurrencyUtils.formatCurrencyWithPrefix(this.partData.averageCost || 0);
  }

  private resetPartData(): void {
    this.partData = {
      code: "",
      name: "",
      sellingPrice: 0,
      costPrice: 0,
      averageCost: 0,
      profitMargin: 30,
      minimumStock: 0,
      unit: "",
      location: "",
      barcode: "",
      manufacturerCode: "",
      ncmCode: "",
      cfopCode: "",
      anpCode: "",
      anpDescription: "",
      anpConsumptionState: "",
      cestCode: "",
      currentStock: 0,
    };

    this.formattedCostPrice = "R$ 0,00";
    this.formattedSellingPrice = "R$ 0,00";
    this.formattedAverageCost = "R$ 0,00";
  }

  savePart(): void {
    if (this.readonly) return;

    if (this.codeInput) {
      this.codeInput.inputTouched = true;
    }
    if (this.nameInput) {
      this.nameInput.inputTouched = true;
    }

    this.validateForm();

    if (this.formValid) {
      if (this.part && this.part._id) {
        this.editPart(this.part._id, this.partData);
      } else {
        this.createPart(this.partData);
      }
    } else {
      this.alertService.showAlert("Validação", "Por favor, preencha corretamente todos os campos obrigatórios.", "warning", "OK");
    }
  }

  validateForm(): void {
    this.formValid = !!this.partData.code && !!this.partData.code.trim() && !!this.partData.name && !!this.partData.name.trim() && !!this.partData.unit;
  }

  createPart(partData: Part): void {
    this.isLoading = true;
    this.partsService.createPart(partData).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200) {
          this.toastService.success("Sucesso!", "Peça cadastrada com sucesso.");
          this.partSaved.emit();
          this.closeModal();
        }
        this.isLoading = false;
      },
      (error: any) => {
        this.isLoading = false;
      }
    );
  }

  editPart(id: string, partData: Part): void {
    this.isLoading = true;
    this.partsService.editPart(id, partData).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200) {
          this.toastService.success("Sucesso!", "Peça atualizada com sucesso.");
          this.partSaved.emit();
          this.closeModal();
        }
        this.isLoading = false;
      },
      (error: any) => {
        this.isLoading = false;
      }
    );
  }

  onCostPriceChange(value: string): void {
    if (this.readonly) return;

    const result = CurrencyUtils.processMoneyInput(value);
    this.partData.costPrice = result.numericValue;
    this.formattedCostPrice = result.formattedValue;
    this.calculateSellingPrice();
    this.validateForm();
  }

  onSellingPriceChange(value: string): void {
    if (this.readonly) return;

    const result = CurrencyUtils.processMoneyInput(value);
    this.partData.sellingPrice = result.numericValue;
    this.formattedSellingPrice = result.formattedValue;

    if (this.partData.costPrice > 0) {
      this.calculateProfitMargin();
    }

    this.validateForm();
  }

  onCostOrMarginChange(): void {
    if (this.readonly) return;
    this.calculateSellingPrice();
    this.validateForm();
  }

  calculateSellingPrice(): void {
    if (this.partData.costPrice && this.partData.profitMargin !== undefined) {
      this.isCalculatingPrice = true;
      setTimeout(() => {
        this.partData.sellingPrice = this.partData.costPrice * (1 + this.partData.profitMargin / 100);
        this.formattedSellingPrice = CurrencyUtils.formatCurrencyWithPrefix(this.partData.sellingPrice);
        this.isCalculatingPrice = false;
      }, 300);
    }
  }

  calculateProfitMargin(): void {
    if (this.partData.costPrice > 0 && this.partData.sellingPrice > 0) {
      const marginDecimal = this.partData.sellingPrice / this.partData.costPrice - 1;
      this.partData.profitMargin = Math.round(marginDecimal * 100);

      if (this.partData.profitMargin < 0) {
        this.partData.profitMargin = 0;
      }
    } else {
      this.partData.profitMargin = 0;
    }
  }

  enableEditing(): void {
    this.readonly = false;
  }

  closeModal(): void {
    this.closeModalEvent.emit();
  }
}
