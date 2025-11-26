import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { HttpResponse } from "@angular/common/http";
import { VehiclesService } from "@features/garage-system/components/vehicles/vehicles.service";
import { ToastService } from "@shared/services/toast.service";
import { ClientDropdownComponent } from "@shared/components/client-dropdown/client-dropdown.component";
import { InputGenericComponent } from "@shared/components/input-generic/input-generic.component";
import { Vehicle } from "@shared/models/models";

@Component({
  selector: "app-vehicle-modal",
  templateUrl: "./vehicle-modal.component.html",
  styleUrls: ["./vehicle-modal.component.scss"],
  // prettier-ignore
  imports: [
    FormsModule,
    CommonModule,
    InputGenericComponent,
    ClientDropdownComponent
  ],
})
export class VehicleModalComponent implements OnInit, OnChanges {
  @Input() vehicle: Vehicle | null = null;
  @Input() readonly: boolean = false;
  @Output() closeModalEvent: EventEmitter<void> = new EventEmitter<void>();
  @Output() vehicleSaved: EventEmitter<void> = new EventEmitter<void>();

  vehicleData: Vehicle = {
    clientId: "",
    licensePlate: "",
    brandModel: "",
    yearOfManufacture: 0,
    color: "",
    chassisNumber: "",
  };

  originalVehicleData: Vehicle = {
    clientId: "",
    licensePlate: "",
    brandModel: "",
    yearOfManufacture: 0,
    color: "",
    chassisNumber: "",
  };

  selectedClientName: string = "";
  isLoading: boolean = false;
  isAutoFilling: boolean = false;

  @ViewChild("licensePlateInput") licensePlateInput!: InputGenericComponent;
  @ViewChild("clientDropdown") clientDropdown!: ClientDropdownComponent;

  // prettier-ignore
  constructor(
    private vehiclesService: VehiclesService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    if (this.vehicle) {
      this.loadVehicleData();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["vehicle"] && changes["vehicle"].currentValue) {
      this.loadVehicleData();
    } else if (changes["vehicle"] && !changes["vehicle"].currentValue) {
      this.resetVehicleData();
    }
  }

  loadVehicleData(): void {
    this.vehicleData = { ...this.vehicle } as Vehicle;
    if (this.vehicle && this.vehicle.client && this.vehicle.client.fullName) {
      this.vehicleData.clientId = this.vehicle.client?._id || "";
      this.selectedClientName = this.vehicle.client.fullName;
    }

    this.originalVehicleData = JSON.parse(JSON.stringify(this.vehicleData));
  }

  resetVehicleData(): void {
    this.vehicleData = {
      clientId: "",
      licensePlate: "",
      brandModel: "",
      yearOfManufacture: 0,
      color: "",
      chassisNumber: "",
    };
    this.selectedClientName = "";
  }

  onLicensePlateChange(value: string): void {
    if (this.readonly) return;

    this.vehicleData.licensePlate = value.toUpperCase();
  }

  onLicensePlateBlur(): void {
    if (this.readonly) return;

    if (this.vehicleData.licensePlate && this.vehicleData.licensePlate.length >= 7) {
      this.isAutoFilling = true;
      this.vehiclesService.getVehicleInfoByPlate(this.vehicleData.licensePlate).subscribe(
        (response: HttpResponse<any>) => {
          if (response.status === 200 && response.body?.result) {
            const result = response.body.result;
            this.vehicleData.brandModel = result.brandModel || "";
            this.vehicleData.yearOfManufacture = Number(result.year) || 0;
            this.vehicleData.color = result.color || "";
            this.vehicleData.chassisNumber = result.chassi || "";
          }
          this.isAutoFilling = false;
        },
        (error: any) => {
          this.isAutoFilling = false;
        }
      );
    }
  }

  onClientSelected(clientData: any): void {
    if (this.readonly) return;

    this.vehicleData.clientId = clientData.clientId;
  }

  saveVehicle(): void {
    if (this.readonly) return;

    if (this.licensePlateInput) {
      this.licensePlateInput.inputTouched = true;
    }

    if (this.clientDropdown) {
      this.clientDropdown.hasBeenTouched = true;
    }

    if (!this.vehicleData.clientId || !this.vehicleData.licensePlate) {
      return;
    }

    this.isLoading = true;

    if (this.vehicle && this.vehicle._id) {
      this.editVehicle(this.vehicle._id, this.vehicleData);
    } else {
      this.createVehicle(this.vehicleData);
    }
  }

  createVehicle(vehicleData: Vehicle): void {
    this.vehiclesService.createVehicle(vehicleData).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200) {
          this.toastService.success("Sucesso", "Veículo cadastrado com sucesso.");
          this.vehicleSaved.emit();
          this.closeModal();
        }
        this.isLoading = false;
      },
      (error: any) => {
        this.isLoading = false;
      }
    );
  }

  editVehicle(id: string, vehicleData: Vehicle): void {
    this.vehiclesService.editVehicle(id, vehicleData).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200) {
          this.toastService.success("Sucesso", "Veículo atualizado com sucesso.");
          this.vehicleSaved.emit();
          this.closeModal();
        }
        this.isLoading = false;
      },
      (error: any) => {
        this.isLoading = false;
      }
    );
  }

  closeModal(): void {
    this.closeModalEvent.emit();
  }

  enableEditing(): void {
    this.readonly = false;
  }

  get hasDataChanged(): boolean {
    if (!this.vehicle || !this.vehicle._id) {
      return true;
    }

    return JSON.stringify(this.vehicleData) !== JSON.stringify(this.originalVehicleData);
  }
}
