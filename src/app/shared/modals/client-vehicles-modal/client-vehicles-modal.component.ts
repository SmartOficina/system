import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { DatePipe, NgFor, NgIf } from "@angular/common";
import { Vehicle } from "../../models/models";
import { FormsModule } from "@angular/forms";
import { PaginationComponent } from "../../components/pagination/pagination.component";

@Component({
  selector: "app-client-vehicles-modal",
  templateUrl: "./client-vehicles-modal.component.html",
  styleUrls: ["./client-vehicles-modal.component.scss"],
  imports: [NgFor, NgIf, DatePipe, FormsModule, PaginationComponent],
})
export class ClientVehiclesModalComponent implements OnInit {
  @Input() vehicles: Vehicle[] = [];
  @Input() clientName: string = "";
  @Output() closeModalEvent: EventEmitter<void> = new EventEmitter<void>();

  searchQuery: string = "";
  filteredVehicles: Vehicle[] = [];
  page: number = 1;
  pageSize: number = 5;
  totalPages: number = 1;

  constructor() {}

  ngOnInit(): void {
    this.filteredVehicles = [...this.vehicles];
    this.calculateTotalPages();
  }

  closeModal(): void {
    this.closeModalEvent.emit();
  }

  searchVehicles(): void {
    if (!this.searchQuery.trim()) {
      this.filteredVehicles = [...this.vehicles];
    } else {
      const query = this.searchQuery.toLowerCase().trim();
      this.filteredVehicles = this.vehicles.filter((vehicle) => vehicle.licensePlate.toLowerCase().includes(query) || vehicle.brandModel.toLowerCase().includes(query) || (vehicle.color && vehicle.color.toLowerCase().includes(query)) || (vehicle.chassisNumber && vehicle.chassisNumber.toLowerCase().includes(query)));
    }
    this.page = 1;
    this.calculateTotalPages();
  }

  onSearchKeyup(): void {
    this.searchVehicles();
  }

  changePage(page: number): void {
    this.page = page;
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.filteredVehicles.length / this.pageSize);
    if (this.totalPages === 0) this.totalPages = 1;
  }

  get paginatedVehicles(): Vehicle[] {
    const startIndex = (this.page - 1) * this.pageSize;
    return this.filteredVehicles.slice(startIndex, startIndex + this.pageSize);
  }
}
