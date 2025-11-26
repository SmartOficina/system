import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { HttpResponse } from "@angular/common/http";
import { Service } from "./../../models/models";
import { ModalService } from "../../services/modal.service";
import { ServicesService } from "@features/garage-system/components/services/services.service";

@Component({
  selector: "app-service-dropdown",
  templateUrl: "./service-dropdown.component.html",
  styleUrls: ["./service-dropdown.component.scss"],
  standalone: true,
  imports: [FormsModule, CommonModule],
})
export class ServiceDropdownComponent implements OnInit, OnChanges {
  @Input() selectedServiceId: any = "";
  @Input() selectedServiceName: string = "";
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Output() serviceSelected = new EventEmitter<any>();

  services: Service[] = [];
  filteredServices: Service[] = [];
  search: string = "";
  isLoading: boolean = false;
  isDropdownOpen: boolean = false;
  hasBeenTouched: boolean = false;
  errorMessage: string = "";

  selectedServicePrice: number = 0;
  activeServiceModalRef: any = null;

  constructor(private servicesService: ServicesService) {}

  ngOnInit(): void {
    this.loadServices();
  }

  ngOnChanges() {
    if (this.selectedServiceName) {
      this.search = this.selectedServiceName;
    }
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.search = target.value;
    this.onSearch();
  }

  loadServices(searchTerm: string = ""): void {
    this.isLoading = true;
    this.servicesService.listServices(searchTerm, 100, 1).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200) {
          this.services = response.body?.result || [];
          this.filteredServices = [...this.services];
          if (this.selectedServiceId && !this.selectedServiceName) {
            const selectedService = this.services.find((s) => s._id === this.selectedServiceId);
            if (selectedService) {
              this.setSelectedServiceDetails(selectedService);
            }
          }
        }
        this.isLoading = false;
      },
      (error: any) => {
        this.isLoading = false;
        this.errorMessage = "Erro ao carregar serviços";
      }
    );
  }

  onSearch(): void {
    this.filteredServices = this.services.filter((service) => {
      const searchLower = this.search.toLowerCase();
      return service.code.toLowerCase().includes(searchLower) || service.name.toLowerCase().includes(searchLower);
    });
  }

  onFocus(): void {
    this.isDropdownOpen = true;
    this.hasBeenTouched = true;
  }

  onBlur(): void {
    setTimeout(() => {
      this.isDropdownOpen = false;
      if (this.required && this.hasBeenTouched && !this.selectedServiceId) {
        this.errorMessage = "Selecione um serviço";
      }
    }, 200);
  }

  selectService(service: Service): void {
    this.selectedServiceId = service._id;
    this.setSelectedServiceDetails(service);
    this.search = service.name;
    this.isDropdownOpen = false;
    this.errorMessage = "";

    this.serviceSelected.emit({
      serviceId: service._id,
      name: service.name,
      code: service.code,
      costPrice: service.costPrice,
      sellingPrice: service.sellingPrice,
      profitMargin: service.profitMargin,
    });
  }

  setSelectedServiceDetails(service: Service): void {
    this.selectedServiceName = service.name;
    this.selectedServicePrice = service.sellingPrice || 0;
  }

  clearSelection(): void {
    if (this.disabled) return;

    this.selectedServiceId = "";
    this.selectedServiceName = "";
    this.selectedServicePrice = 0;
    this.search = "";

    this.serviceSelected.emit({
      serviceId: "",
      name: "",
      code: "",
      costPrice: 0,
      sellingPrice: 0,
      profitMargin: 0,
    });

    if (this.required && this.hasBeenTouched) {
      this.errorMessage = "Selecione um serviço";
    }
  }

  openCreateServiceModal(): void {
    if (this.disabled) return;
  }
}
