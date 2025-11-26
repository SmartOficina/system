import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from "@angular/core";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { ClientsService } from "@features/garage-system/components/clients/clients.service";
import { ToastService } from "@shared/services/toast.service";
import { Client } from "@shared/models/models";
import { AlertService } from "@shared/services/alert.service";
import { InputGenericComponent } from "@shared/components/input-generic/input-generic.component";

@Component({
  selector: "app-client-modal",
  templateUrl: "./client-modal.component.html",
  styleUrls: ["./client-modal.component.scss"],
  // prettier-ignore
  imports: [
    FormsModule,
    CommonModule,
    InputGenericComponent
  ],
})
export class ClientModalComponent implements OnInit, OnChanges {
  @Input() client: Client | null = null;
  @Input() readonly: boolean = false;
  @Output() closeModalEvent: EventEmitter<void> = new EventEmitter<void>();
  @Output() clientSaved: EventEmitter<void> = new EventEmitter<void>();
  @Output() photoChanged: EventEmitter<void> = new EventEmitter<void>();

  clientData: Client = {
    fullName: "",
    cpfCnpj: "",
    phone: "",
    email: "",
    birthDate: "",
    gender: "",
    photo: "",
    address: { zipCode: "", street: "", number: "", district: "", city: "", state: "" },
  };

  originalClientData: Client = {
    fullName: "",
    cpfCnpj: "",
    phone: "",
    email: "",
    birthDate: "",
    gender: "",
    photo: "",
    address: { zipCode: "", street: "", number: "", district: "", city: "", state: "" },
  };

  isConsultingZip: boolean = false;
  isLoading: boolean = false;
  public states = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

  @ViewChild("fullNameInput") fullNameInput!: InputGenericComponent;
  @ViewChild("phoneInput") phoneInput!: InputGenericComponent;
  @ViewChild("cpfCnpjInput") cpfCnpjInput!: InputGenericComponent;
  @ViewChild("emailInput") emailInput!: InputGenericComponent;
  @ViewChild("cepInput") cepInput!: InputGenericComponent;
  @ViewChild("numberInput") numberInput!: InputGenericComponent;
  @ViewChild("fileInput") fileInput!: ElementRef<HTMLInputElement>;

  // prettier-ignore
  constructor(
    private http: HttpClient,
    private clientsService: ClientsService,
    private alertService: AlertService,
    private toastService: ToastService
  ) { }

  get hasDataChanged(): boolean {
    if (!this.client || !this.client._id) {
      return true;
    }

    const currentDataWithoutPhoto = { ...this.clientData };
    const originalDataWithoutPhoto = { ...this.originalClientData };

    delete currentDataWithoutPhoto.photo;
    delete originalDataWithoutPhoto.photo;

    return JSON.stringify(currentDataWithoutPhoto) !== JSON.stringify(originalDataWithoutPhoto);
  }

  ngOnInit(): void {
    if (this.client) {
      this.loadClientData();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["client"] && changes["client"].currentValue) {
      this.loadClientData();
    } else if (changes["client"] && !changes["client"].currentValue) {
      this.resetClientData();
    }
  }

  private loadClientData(): void {
    this.clientData = { ...this.client } as Client;
    if (this.clientData.birthDate) {
      this.clientData.birthDate = new Date(this.clientData.birthDate).toISOString().split("T")[0];
    }
    if (!this.clientData.address) {
      this.clientData.address = { zipCode: "", street: "", number: "", district: "", city: "", state: "" };
    }

    this.originalClientData = JSON.parse(JSON.stringify(this.clientData));
  }

  private resetClientData(): void {
    this.clientData = {
      fullName: "",
      cpfCnpj: "",
      phone: "",
      email: "",
      birthDate: "",
      gender: "",
      photo: "",
      address: { zipCode: "", street: "", number: "", district: "", city: "", state: "" },
    };
  }

  saveClient(): void {
    if (this.readonly) return;

    if (this.fullNameInput) {
      this.fullNameInput.inputTouched = true;
    }
    if (this.phoneInput) {
      this.phoneInput.inputTouched = true;
    }
    if (this.emailInput) {
      this.emailInput.inputTouched = true;
    }
    if (this.cpfCnpjInput) {
      this.cpfCnpjInput.inputTouched = true;
    }
    if (this.cepInput) {
      this.cepInput.inputTouched = true;
    }
    if (this.numberInput) {
      this.numberInput.inputTouched = true;
    }

    let valid = true;
    if (!this.fullNameInput.isValid() || !this.phoneInput.isValid()) {
      valid = false;
    }
    if (this.clientData.email && this.emailInput && !this.emailInput.isValid()) {
      valid = false;
    }
    if (this.clientData.cpfCnpj && this.cpfCnpjInput && !this.cpfCnpjInput.isValid()) {
      valid = false;
    }
    if (this.clientData.address.zipCode && this.cepInput && !this.cepInput.isValid()) {
      valid = false;
    }
    if (this.clientData.address.number && this.numberInput && !this.numberInput.isValid()) {
      valid = false;
    }

    if (valid) {
      if (this.client && this.client._id) {
        this.editClient(this.client._id, this.clientData);
      } else {
        this.createClient(this.clientData);
      }
    }
  }

  createClient(clientData: Client): void {
    this.isLoading = true;
    this.clientsService.createClient(clientData).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200) {
          this.toastService.success("Sucesso", "Cliente cadastrado com sucesso.");
          this.clientSaved.emit();
          this.closeModal();
        }
        this.isLoading = false;
      },
      (error: any) => {
        this.isLoading = false;
      }
    );
  }

  editClient(id: string, clientData: Client): void {
    this.isLoading = true;
    this.clientsService.editClient(id, clientData).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200) {
          this.toastService.success("Sucesso", "Cliente atualizado com sucesso.");
          this.clientSaved.emit();
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

    const zipCodeDigits = (this.clientData.address.zipCode || "").replace(/\D/g, "");
    if (zipCodeDigits.length === 8) {
      this.isConsultingZip = true;
      this.http.get<any>(`https://brasilapi.com.br/api/cep/v2/${this.clientData.address.zipCode}`).subscribe(
        (response) => {
          this.clientData.address.street = response.street;
          this.clientData.address.city = response.city;
          this.clientData.address.state = response.state;
          this.clientData.address.district = response.neighborhood;
          this.isConsultingZip = false;
        },
        (error: any) => {
          this.isConsultingZip = false;
        }
      );
    }
  }

  closeModal(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.value = "";
    }
    this.closeModalEvent.emit();
  }

  onPhotoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.clientData.photo = e.target.result;

        if (this.client && this.client._id) {
          this.isLoading = true;
          this.clientsService.updateClientPhoto(this.client._id, this.clientData.photo || "").subscribe(
            (response: HttpResponse<any>) => {
              if (response.status === 200) {
                this.toastService.success("Sucesso", "Foto do cliente atualizada com sucesso.");
                this.originalClientData.photo = this.clientData.photo;
                this.photoChanged.emit();
              }
              this.isLoading = false;
            },
            (error: any) => {
              this.isLoading = false;
            }
          );
        }
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto(event: Event): void {
    event.stopPropagation();

    if (this.client && this.client._id) {
      this.isLoading = true;
      this.clientsService.removeClientPhoto(this.client._id).subscribe(
        (response: HttpResponse<any>) => {
          if (response.status === 200) {
            this.clientData.photo = "";
            this.toastService.success("Sucesso", "Foto do cliente removida com sucesso.");
            this.originalClientData.photo = "";
            this.photoChanged.emit();
          }
          this.isLoading = false;
        },
        (error: any) => {
          this.isLoading = false;
        }
      );
    } else {
      this.clientData.photo = "";
    }

    if (this.fileInput) {
      this.fileInput.nativeElement.value = "";
    }
  }

  enableEditing(): void {
    this.readonly = false;
  }
}
