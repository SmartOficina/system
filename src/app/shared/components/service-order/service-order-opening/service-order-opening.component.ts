import { Component, Input, Output, EventEmitter, ViewChild, AfterViewInit, ElementRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ServiceOrder, ChecklistItem } from "./../../../models/models";
import { InputGenericComponent } from "../../../components/input-generic/input-generic.component";
import { VehicleDropdownComponent } from "../../../components/vehicle-dropdown/vehicle-dropdown.component";

@Component({
  selector: "app-service-order-opening",
  templateUrl: "./service-order-opening.component.html",
  styleUrls: ["./service-order-opening.component.scss"],
  imports: [CommonModule, FormsModule, InputGenericComponent, VehicleDropdownComponent],
})
export class ServiceOrderOpeningComponent implements AfterViewInit {
  @Input() serviceOrderData!: ServiceOrder;
  @Input() selectedVehiclePlate: string = "";
  @Input() readonly: boolean = false;
  @Input() selectedClientName: string = "";
  @Output() vehicleSelected = new EventEmitter<any>();

  @ViewChild("newDamageInput") newDamageInput: ElementRef | null = null;

  @ViewChild("reportedProblemInput") reportedProblemInput!: InputGenericComponent;
  @ViewChild("currentMileageInput") currentMileageInput!: InputGenericComponent;
  @ViewChild("vehicleDropdown") vehicleDropdown!: VehicleDropdownComponent;

  formattedMileage: string = "";

  defaultEntryChecklist: ChecklistItem[] = [
    { description: "Faróis", checked: false },
    { description: "Lanternas", checked: false },
    { description: "Para-brisa", checked: false },
    { description: "Vidros", checked: false },
    { description: "Retrovisores", checked: false },
    { description: "Pintura", checked: false },
    { description: "Pneus", checked: false },
    { description: "Interior", checked: false },
    { description: "Bancos", checked: false },
    { description: "Painel", checked: false },
    { description: "Estepe", checked: false },
    { description: "Ferramentas", checked: false },
  ];

  constructor() {}

  ngAfterViewInit() {
    setTimeout(() => {
      if (!this.serviceOrderData.entryChecklist || this.serviceOrderData.entryChecklist.length === 0) {
        this.serviceOrderData.entryChecklist = [...this.defaultEntryChecklist];
      }

      if (this.serviceOrderData.currentMileage) {
        this.formattedMileage = this.formatMileageValue(this.serviceOrderData.currentMileage.toString());
      }
    });
  }

  onVehicleSelected(vehicleData: any): void {
    if (this.readonly) return;
    this.vehicleSelected.emit(vehicleData);
  }

  addVisibleDamage(): void {
    if (!this.serviceOrderData.visibleDamages) {
      this.serviceOrderData.visibleDamages = [];
    }

    this.serviceOrderData.visibleDamages.push("");
  }

  removeVisibleDamage(index: number): void {
    if (this.serviceOrderData.visibleDamages) {
      this.serviceOrderData.visibleDamages.splice(index, 1);
    }
  }

  onDamageInputChange(index: number, value: string): void {
    if (this.serviceOrderData.visibleDamages) {
      this.serviceOrderData.visibleDamages[index] = value;
    }
  }

  onMileageInput(event: any): void {
    const inputValue = event.target?.value || event;

    const numericValue = inputValue.replace(/\D/g, "");

    this.serviceOrderData.currentMileage = numericValue ? Number(numericValue) : 0;

    this.formattedMileage = numericValue ? this.formatMileageValue(numericValue) : "";
  }

  private formatMileageValue(value: string): string {
    value = value.replace(/\D/g, "");
    const numericValue = Number(value);
    return numericValue.toLocaleString("pt-BR");
  }

  validateForm(): boolean {
    if (!this.serviceOrderData.vehicleId) {
      if (this.vehicleDropdown) {
        this.vehicleDropdown.hasBeenTouched = true;
        this.vehicleDropdown.errorMessage = "Selecione um veículo";
      }
      return false;
    }

    if (!this.serviceOrderData.reportedProblem || this.serviceOrderData.reportedProblem.trim() === "") {
      if (this.reportedProblemInput) {
        this.reportedProblemInput.inputTouched = true;
      }
      return false;
    }

    return true;
  }
}
