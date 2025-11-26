import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { HttpResponse } from "@angular/common/http";
import { Part } from "./../../models/models";
import { PartsService } from "@features/garage-system/components/inventory/parts/parts.service";
import { ModalService } from "../../services/modal.service";
import { PartModalComponent } from "../../modals/part-modal/part-modal.component";

@Component({
  selector: "app-part-dropdown",
  templateUrl: "./part-dropdown.component.html",
  styleUrls: ["./part-dropdown.component.scss"],
  standalone: true,
  imports: [FormsModule, CommonModule],
})
export class PartDropdownComponent implements OnInit, OnChanges {
  @Input() selectedPartId: any = "";
  @Input() selectedPartName: string = "";
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Output() partSelected = new EventEmitter<any>();

  parts: Part[] = [];
  filteredParts: Part[] = [];
  search: string = "";
  isLoading: boolean = false;
  isDropdownOpen: boolean = false;
  hasBeenTouched: boolean = false;
  errorMessage: string = "";

  selectedPartStock: number = 0;
  selectedPartUnit: string = "";
  selectedPartCost: number = 0;
  selectedPartPrice: number = 0;
  activePartModalRef: any = null;

  constructor(private partsService: PartsService, private modalService: ModalService) {}

  ngOnInit(): void {
    this.loadParts();
  }

  ngOnChanges() {
    if (this.selectedPartName) {
      this.search = this.selectedPartName;
    }
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.search = target.value;
    this.onSearch();
  }

  loadParts(searchTerm: string = ""): void {
    this.isLoading = true;
    this.partsService.listParts(searchTerm, 100, 1).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200) {
          this.parts = response.body?.result || [];
          this.filteredParts = [...this.parts];
          if (this.selectedPartId && !this.selectedPartName) {
            const selectedPart = this.parts.find((p) => p._id === this.selectedPartId);
            if (selectedPart) {
              this.setSelectedPartDetails(selectedPart);
            }
          }
        }
        this.isLoading = false;
      },
      (error: any) => {
        this.isLoading = false;
        this.errorMessage = "Erro ao carregar peças";
      }
    );
  }

  onSearch(): void {
    this.filteredParts = this.parts.filter((part) => {
      const searchLower = this.search.toLowerCase();
      return part.code.toLowerCase().includes(searchLower) || part.name.toLowerCase().includes(searchLower);
    });
  }

  onFocus(): void {
    this.isDropdownOpen = true;
    this.hasBeenTouched = true;
  }

  onBlur(): void {
    setTimeout(() => {
      this.isDropdownOpen = false;
      if (this.required && this.hasBeenTouched && !this.selectedPartId) {
        this.errorMessage = "Selecione uma peça";
      }
    }, 200);
  }

  selectPart(part: Part): void {
    this.selectedPartId = part._id;
    this.setSelectedPartDetails(part);
    this.search = part.name;
    this.isDropdownOpen = false;
    this.errorMessage = "";

    this.partSelected.emit({
      partId: part._id,
      name: part.name,
      code: part.code,
      costPrice: part.costPrice,
      sellingPrice: part.sellingPrice,
      profitMargin: part.profitMargin,
      unit: part.unit,
      currentStock: part.currentStock,
      part: part,
    });
  }

  setSelectedPartDetails(part: Part): void {
    this.selectedPartName = part.name;
    this.selectedPartStock = part.currentStock || 0;
    this.selectedPartUnit = part.unit || "";
    this.selectedPartCost = part.costPrice || 0;
    this.selectedPartPrice = part.sellingPrice || 0;
  }

  clearSelection(): void {
    if (this.disabled) return;

    this.selectedPartId = "";
    this.selectedPartName = "";
    this.selectedPartStock = 0;
    this.selectedPartUnit = "";
    this.selectedPartCost = 0;
    this.selectedPartPrice = 0;
    this.search = "";

    this.partSelected.emit({
      partId: "",
      name: "",
      code: "",
      costPrice: 0,
      sellingPrice: 0,
      profitMargin: 0,
      unit: "",
      currentStock: 0,
      part: null,
    });

    if (this.required && this.hasBeenTouched) {
      this.errorMessage = "Selecione uma peça";
    }
  }

  openCreatePartModal(): void {
    if (this.disabled) return;

    this.activePartModalRef = this.modalService.open(PartModalComponent, {
      data: {
        part: null,
      },
      onClose: () => {
        this.activePartModalRef = null;
      },
    });

    this.activePartModalRef.instance.partSaved.subscribe(() => {
      this.loadParts(this.search);
      setTimeout(() => {
        if (this.filteredParts.length > 0) {
          this.selectPart(this.filteredParts[0]);
        }
      }, 500);
      this.modalService.close(this.activePartModalRef);
      this.activePartModalRef = null;
    });
  }
}
