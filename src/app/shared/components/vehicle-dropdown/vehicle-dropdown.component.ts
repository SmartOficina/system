import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { Vehicle } from './../../models/models';
import { VehiclesService } from '@features/garage-system/components/vehicles/vehicles.service';

@Component({
  selector: 'app-vehicle-dropdown',
  templateUrl: './vehicle-dropdown.component.html',
  styleUrls: ['./vehicle-dropdown.component.scss'],
  imports: [FormsModule, CommonModule]
})
export class VehicleDropdownComponent implements OnInit {
  @Input() selectedVehicleId: any = '';
  @Input() selectedVehiclePlate: string = '';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Output() vehicleSelected = new EventEmitter<any>();

  vehicles: Vehicle[] = [];
  filteredVehicles: Vehicle[] = [];
  search: string = '';
  isLoading: boolean = false;
  isDropdownOpen: boolean = false;
  hasBeenTouched: boolean = false;
  errorMessage: string = '';
  selectedClientName: string = '';

  constructor(private vehiclesService: VehiclesService) { }

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadClientDetails(clientId: string): void {
    if (!clientId) {
      this.selectedClientName = 'Cliente não associado';
      return;
    }

    const vehicleWithClient = this.vehicles.find(v => v.client &&
      ((typeof v.client === 'object' && v.client._id === clientId) ||
        (typeof v.client === 'string' && v.client === clientId))
    );

    if (vehicleWithClient && typeof vehicleWithClient.client === 'object') {
      this.selectedClientName = vehicleWithClient.client.fullName || 'Cliente não associado';
    } else {
      this.selectedClientName = 'Cliente não associado';
    }
  }

  loadVehicles(searchTerm: string = ''): void {
    this.isLoading = true;
    this.vehiclesService.listVehicles(searchTerm, 100, 1).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200) {
          this.vehicles = response.body?.result || [];
          this.filteredVehicles = [...this.vehicles];
          if (this.selectedVehicleId && (!this.selectedVehiclePlate || !this.selectedClientName)) {
            const selectedVehicle = this.vehicles.find(v => v._id === this.selectedVehicleId);
            if (selectedVehicle) {
              this.selectedVehiclePlate = selectedVehicle.licensePlate;
              if (selectedVehicle.client) {
                if (typeof selectedVehicle.client === 'object') {
                  this.selectedClientName = selectedVehicle.client.fullName || 'Cliente não associado';
                } else if (typeof selectedVehicle.client === 'string') {
                  this.loadClientDetails(selectedVehicle.client);
                }
              } else if (selectedVehicle.clientId) {
                this.loadClientDetails(selectedVehicle.clientId);
              } else {
                this.selectedClientName = 'Cliente não associado';
              }
            } else {
            }
          }
        }
        this.isLoading = false;
      },
      (error: any) => {
        this.isLoading = false;
        this.errorMessage = 'Erro ao carregar veículos';
      }
    );
  }

  onSearch(): void {
    this.filteredVehicles = this.vehicles.filter(vehicle => {
      const searchLower = this.search.toLowerCase();
      return (
        vehicle.licensePlate.toLowerCase().includes(searchLower) ||
        (vehicle.brandModel && vehicle.brandModel.toLowerCase().includes(searchLower)) ||
        (vehicle.client && typeof vehicle.client === 'object' && vehicle.client.fullName &&
          vehicle.client.fullName.toLowerCase().includes(searchLower))
      );
    });
  }

  onFocus(): void {
    this.isDropdownOpen = true;
    this.hasBeenTouched = true;
  }

  onBlur(): void {
    setTimeout(() => {
      this.isDropdownOpen = false;
      if (this.required && this.hasBeenTouched && !this.selectedVehicleId) {
        this.errorMessage = 'Selecione um veículo';
      }
    }, 200);
  }

  selectVehicle(vehicle: Vehicle): void {
    this.selectedVehicleId = vehicle._id;
    this.selectedVehiclePlate = vehicle.licensePlate;
    if (vehicle.client) {
      if (typeof vehicle.client === 'object') {
        this.selectedClientName = vehicle.client.fullName || 'Cliente não associado';
      } else if (typeof vehicle.client === 'string') {
        this.loadClientDetails(vehicle.client);
      }
    } else if (vehicle.clientId) {
      this.loadClientDetails(vehicle.clientId);
    } else {
      this.selectedClientName = 'Cliente não associado';
    }

    this.search = '';
    this.isDropdownOpen = false;
    this.errorMessage = '';

    this.vehicleSelected.emit({
      vehicleId: vehicle._id,
      licensePlate: vehicle.licensePlate,
      brandModel: vehicle.brandModel,
      clientId: vehicle.client && typeof vehicle.client === 'object' ? vehicle.client._id :
        (typeof vehicle.client === 'string' ? vehicle.client : vehicle.clientId || ''),
      clientName: this.selectedClientName
    });
  }

  clearSelection(): void {
    if (this.disabled) return;
    this.selectedVehicleId = '';
    this.selectedVehiclePlate = '';
    this.selectedClientName = '';
    this.vehicleSelected.emit({ vehicleId: '', licensePlate: '', clientId: '', clientName: '' });
    if (this.required && this.hasBeenTouched) {
      this.errorMessage = 'Selecione um veículo';
    }
  }
}