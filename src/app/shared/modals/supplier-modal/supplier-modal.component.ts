import { SuppliersService } from "@features/garage-system/components/inventory/suppliers/suppliers.service";
import { Supplier } from "./../../models/models";
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from "@angular/core";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { InputGenericComponent } from "../../components/input-generic/input-generic.component";
import { AlertService } from "../../services/alert.service";
import { ToastService } from "../../services/toast.service";

@Component({
  selector: "app-supplier-modal",
  templateUrl: "./supplier-modal.component.html",
  styleUrls: ["./supplier-modal.component.scss"],
  imports: [FormsModule, CommonModule, InputGenericComponent],
})
export class SupplierModalComponent implements OnInit, OnChanges {
  @Input() supplier: Supplier | null = null;
  @Input() readonly: boolean = false;
  @Output() closeModalEvent: EventEmitter<void> = new EventEmitter<void>();
  @Output() supplierSaved: EventEmitter<void> = new EventEmitter<void>();

  supplierData: Supplier = {
    code: "",
    name: "",
    cnpj: "",
    mobile: "",
    phone: "",
    email: "",
    address: { zipCode: "", street: "", number: "", district: "", city: "", state: "" },
    description: "",
  };

  isConsultingZip: boolean = false;
  isLoading: boolean = false;
  public states = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

  @ViewChild("codeInput") codeInput!: InputGenericComponent;
  @ViewChild("nameInput") nameInput!: InputGenericComponent;
  @ViewChild("cnpjInput") cnpjInput!: InputGenericComponent;
  @ViewChild("phoneInput") phoneInput!: InputGenericComponent;
  @ViewChild("emailInput") emailInput!: InputGenericComponent;
  @ViewChild("cepInput") cepInput!: InputGenericComponent;
  @ViewChild("numberInput") numberInput!: InputGenericComponent;

  constructor(private http: HttpClient, private suppliersService: SuppliersService, private alertService: AlertService, private toastService: ToastService) {}

  ngOnInit(): void {
    if (this.supplier) {
      this.loadSupplierData();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["supplier"] && changes["supplier"].currentValue) {
      this.loadSupplierData();
    } else if (changes["supplier"] && !changes["supplier"].currentValue) {
      this.resetSupplierData();
    }
  }

  private loadSupplierData(): void {
    this.supplierData = { ...this.supplier } as Supplier;
    if (!this.supplierData.address) {
      this.supplierData.address = { zipCode: "", street: "", number: "", district: "", city: "", state: "" };
    }
  }

  private resetSupplierData(): void {
    this.supplierData = {
      code: "",
      name: "",
      cnpj: "",
      mobile: "",
      phone: "",
      email: "",
      address: { zipCode: "", street: "", number: "", district: "", city: "", state: "" },
      description: "",
    };
  }

  saveSupplier(): void {
    if (this.readonly) return;

    if (this.codeInput) {
      this.codeInput.inputTouched = true;
    }
    if (this.nameInput) {
      this.nameInput.inputTouched = true;
    }
    if (this.cnpjInput) {
      this.cnpjInput.inputTouched = true;
    }
    if (this.phoneInput) {
      this.phoneInput.inputTouched = true;
    }
    if (this.emailInput && this.supplierData.email) {
      this.emailInput.inputTouched = true;
    }

    let valid = true;
    if (!this.codeInput.isValid() || !this.nameInput.isValid() || !this.cnpjInput.isValid() || !this.phoneInput.isValid()) {
      valid = false;
    }
    if (this.supplierData.email && this.emailInput && !this.emailInput.isValid()) {
      valid = false;
    }

    if (valid) {
      if (this.supplier && this.supplier._id) {
        this.editSupplier(this.supplier._id, this.supplierData);
      } else {
        this.createSupplier(this.supplierData);
      }
    } else {
      this.alertService.showAlert("Validação", "Por favor, preencha corretamente todos os campos obrigatórios.", "warning", "OK");
    }
  }

  createSupplier(supplierData: Supplier): void {
    this.isLoading = true;
    this.suppliersService.createSupplier(supplierData).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200) {
          this.toastService.success("Sucesso!", "Fornecedor cadastrado com sucesso.");
          this.supplierSaved.emit();
          this.closeModal();
        }
        this.isLoading = false;
      },
      (error: any) => {
        this.isLoading = false;
      }
    );
  }

  editSupplier(id: string, supplierData: Supplier): void {
    this.isLoading = true;
    this.suppliersService.editSupplier(id, supplierData).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200) {
          this.toastService.success("Sucesso!", "Fornecedor atualizado com sucesso.");
          this.supplierSaved.emit();
          this.closeModal();
        }
        this.isLoading = false;
      },
      (error: any) => {
        this.isLoading = false;
      }
    );
  }

  searchZipCode(): void {
    if (this.readonly) return;

    const zipCodeDigits = (this.supplierData.address.zipCode || "").replace(/\D/g, "");
    if (zipCodeDigits.length === 8) {
      this.isConsultingZip = true;
      this.http.get<any>(`https://brasilapi.com.br/api/cep/v2/${this.supplierData.address.zipCode}`).subscribe(
        (response) => {
          this.supplierData.address.street = response.street;
          this.supplierData.address.city = response.city;
          this.supplierData.address.state = response.state;
          this.supplierData.address.district = response.neighborhood;
          this.isConsultingZip = false;
        },
        (error: any) => {
          this.isConsultingZip = false;
        }
      );
    }
  }

  closeModal(): void {
    this.closeModalEvent.emit();
  }

  enableEditing(): void {
    this.readonly = false;
  }
}
