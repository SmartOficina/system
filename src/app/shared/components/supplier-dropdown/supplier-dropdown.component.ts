import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { Supplier } from './../../models/models';
import { SuppliersService } from '@features/garage-system/components/inventory/suppliers/suppliers.service';
import { ModalService } from '../../services/modal.service';
import { SupplierModalComponent } from '../../modals/supplier-modal/supplier-modal.component';

@Component({
  selector: 'app-supplier-dropdown',
  templateUrl: './supplier-dropdown.component.html',
  styleUrls: ['./supplier-dropdown.component.scss'],
  imports: [FormsModule, CommonModule]
})
export class SupplierDropdownComponent implements OnInit {
  @Input() selectedSupplierId: any = '';
  @Input() selectedSupplierName: string = '';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Output() supplierSelected = new EventEmitter<any>();

  suppliers: Supplier[] = [];
  filteredSuppliers: Supplier[] = [];
  search: string = '';
  isLoading: boolean = false;
  isDropdownOpen: boolean = false;
  hasBeenTouched: boolean = false;
  errorMessage: string = '';
  activeSupplierModalRef: any = null;

  selectedSupplierCNPJ: string = '';
  selectedSupplierPhone: string = '';

  constructor(
    private suppliersService: SuppliersService,
    private modalService: ModalService
  ) { }

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(searchTerm: string = ''): void {
    this.isLoading = true;
    this.suppliersService.listSuppliers(searchTerm, 100, 1).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200) {
          this.suppliers = response.body?.result || [];
          this.filteredSuppliers = [...this.suppliers];
          if (this.selectedSupplierId && !this.selectedSupplierName) {
            const selectedSupplier = this.suppliers.find(s => s._id === this.selectedSupplierId);
            if (selectedSupplier) {
              this.setSelectedSupplierDetails(selectedSupplier);
            }
          }
        }
        this.isLoading = false;
      },
      (error: any) => {
        this.isLoading = false;
        this.errorMessage = 'Erro ao carregar fornecedores';
      }
    );
  }

  onSearch(): void {
    this.filteredSuppliers = this.suppliers.filter(supplier => {
      const searchLower = this.search.toLowerCase();
      return (
        supplier.code.toLowerCase().includes(searchLower) ||
        supplier.name.toLowerCase().includes(searchLower) ||
        (supplier.cnpj && supplier.cnpj.toLowerCase().includes(searchLower))
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
      if (this.required && this.hasBeenTouched && !this.selectedSupplierId) {
        this.errorMessage = 'Selecione um fornecedor';
      }
    }, 200);
  }

  selectSupplier(supplier: Supplier): void {
    this.selectedSupplierId = supplier._id;
    this.setSelectedSupplierDetails(supplier);
    this.search = '';
    this.isDropdownOpen = false;
    this.errorMessage = '';

    this.supplierSelected.emit({
      supplierId: supplier._id,
      name: supplier.name,
      code: supplier.code,
      cnpj: supplier.cnpj,
      phone: supplier.phone
    });
  }

  setSelectedSupplierDetails(supplier: Supplier): void {
    this.selectedSupplierName = supplier.name;
    this.selectedSupplierCNPJ = supplier.cnpj || '';
    this.selectedSupplierPhone = supplier.phone || '';
  }

  clearSelection(): void {
    if (this.disabled) return;
    this.selectedSupplierId = '';
    this.selectedSupplierName = '';
    this.selectedSupplierCNPJ = '';
    this.selectedSupplierPhone = '';

    this.supplierSelected.emit({
      supplierId: '',
      name: '',
      code: '',
      cnpj: '',
      phone: ''
    });

    if (this.required && this.hasBeenTouched) {
      this.errorMessage = 'Selecione um fornecedor';
    }
  }

  openCreateSupplierModal(): void {
    if (this.disabled) return;

    this.activeSupplierModalRef = this.modalService.open(SupplierModalComponent, {
      data: {
        supplier: null
      },
      onClose: () => {
        this.activeSupplierModalRef = null;
      }
    });

    this.activeSupplierModalRef.instance.supplierSaved.subscribe(() => {
      this.loadSuppliers(this.search);
      setTimeout(() => {
        if (this.filteredSuppliers.length > 0) {
          this.selectSupplier(this.filteredSuppliers[0]);
        }
      }, 500);
      this.modalService.close(this.activeSupplierModalRef);
      this.activeSupplierModalRef = null;
    });
  }
}