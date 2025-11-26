import { Component, OnInit, ComponentRef, OnDestroy } from "@angular/core";
import { HttpResponse } from "@angular/common/http";
import { FormsModule } from "@angular/forms";
import { SuppliersService } from "./suppliers.service";
import { NgIf, NgFor, DatePipe } from "@angular/common";
import { Subject, takeUntil } from "rxjs";
import { GenericTableComponent, TableColumn } from "@shared/components/generic-table/generic-table.component";
import { InputGenericComponent } from "@shared/components/input-generic/input-generic.component";
import { PaginationComponent } from "@shared/components/pagination/pagination.component";
import { SupplierModalComponent } from "@shared/modals/supplier-modal/supplier-modal.component";
import { Supplier } from "@shared/models/models";
import { AlertService } from "@shared/services/alert.service";
import { ModalService } from "@shared/services/modal.service";
import { PermissionHelperService, PermissionSet } from "@shared/services/permission-helper.service";
import { PermissionGuardComponent } from "@shared/components/permission-guard.component";

import { GarageSystemService } from "@features/garage-system/garage-system.service";
import { ToastService } from "@shared/services/toast.service";
import { ExportService } from "@shared/services/export.service";

@Component({
  selector: "app-suppliers",
  templateUrl: "./suppliers.component.html",
  styleUrls: ["./suppliers.component.scss"],
  // prettier-ignore
  imports: [
    FormsModule,
    NgIf,
    NgFor,
    DatePipe,
    PaginationComponent,
    InputGenericComponent,
    GenericTableComponent,
    PermissionGuardComponent,

  ],
})
export class SuppliersComponent implements OnInit, OnDestroy {
  suppliers: Supplier[] = [];
  selectedSuppliers: Supplier[] = [];
  search: string = "";
  page: number = 1;
  limit: number = 10;
  limitOptions: number[] = [5, 10, 25, 50, 100];
  totalPages: number = 0;
  totalSuppliers: number = 0;
  isLoading: boolean = false;
  activeSupplierModalRef: ComponentRef<SupplierModalComponent> | null = null;
  searchTimeout: any;
  Math = Math;
  lastUpdate: Date = new Date();
  private destroy$ = new Subject<void>();

  filterPeriod: string = "all";
  filterState: string = "all";
  sortOrder: string = "name";

  permissions: PermissionSet = {
    view: false,
    create: false,
    edit: false,
    delete: false,
  };

  supplierColumns: TableColumn[] = [
    { header: "Código", field: "code" },
    { header: "Nome", field: "name" },
    { header: "CNPJ", field: "cnpj" },
    { header: "Telefone", field: "phone" },
    { header: "Cadastro", field: "createdAt", isDate: true },
    { header: "Ações", field: "actions" },
  ];

  // prettier-ignore
  constructor(
    private suppliersService: SuppliersService,
    private alertService: AlertService,
    private modalService: ModalService,
    private permissionHelper: PermissionHelperService,
    private garageSystemService: GarageSystemService,
    private toastService: ToastService,
    private exportService: ExportService
  ) { }

  ngOnInit(): void {
    this.loadPermissions();
    this.listSuppliers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPermissions(): void {
    this.permissionHelper
      .getEntityPermissions("supplier")
      .pipe(takeUntil(this.destroy$))
      .subscribe((permissions) => {
        this.permissions = permissions;
      });
  }

  listSuppliers(): void {
    this.isLoading = true;
    this.suppliersService.listSuppliers(this.search, this.limit, this.page, this.filterPeriod, this.filterState, this.sortOrder).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200) {
          this.suppliers = response.body?.result || [];
          this.totalPages = response.body?.totalPages || 0;
          this.totalSuppliers = response.body?.totalItems || 0;
          this.lastUpdate = new Date();
        }
        this.isLoading = false;
      },
      (error: any) => {
        this.isLoading = false;
      }
    );
  }

  onSearchKeyup(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.listSuppliers();
    }, 500);
  }

  removeSupplier(id: string): void {
    if (!this.permissionHelper.checkPermission(this.permissions.delete, "excluir fornecedores")) {
      return;
    }

    this.alertService.showAlert("Confirmação", "Tem certeza que deseja excluir este fornecedor? Esta ação não poderá ser desfeita.", "warning", "Excluir", "Cancelar").then((confirmed: boolean) => {
      if (confirmed) {
        this.isLoading = true;
        this.suppliersService.removeSupplier(id).subscribe(
          (response: HttpResponse<any>) => {
            if (response.status === 200) {
              this.toastService.success("Sucesso", "Fornecedor removido com sucesso.");
              this.listSuppliers();
              this.selectedSuppliers = [];
            }
            this.isLoading = false;
          },
          (error: any) => {
            this.isLoading = false;
          }
        );
      }
    });
  }

  changePage(page: number): void {
    this.page = page;
    this.listSuppliers();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  changeLimit(): void {
    this.page = 1;
    this.listSuppliers();
  }

  refreshData(): void {
    this.selectedSuppliers = [];
    this.listSuppliers();
  }

  applyFilters(): void {
    this.page = 1;
    this.listSuppliers();
  }

  clearFilters(): void {
    this.filterPeriod = "all";
    this.filterState = "all";
    this.search = "";
    this.page = 1;
    this.listSuppliers();
  }

  changeSortOrder(): void {
    this.page = 1;
    this.listSuppliers();
  }

  openCreateModal(): void {
    if (!this.permissionHelper.checkPermission(this.permissions.create, "cadastrar fornecedores")) {
      return;
    }

    this.activeSupplierModalRef = this.modalService.open(SupplierModalComponent, {
      data: {
        supplier: null,
      },
      onClose: () => {
        this.activeSupplierModalRef = null;
      },
    });

    this.activeSupplierModalRef.instance.supplierSaved.subscribe(() => {
      this.listSuppliers();
      this.modalService.close(this.activeSupplierModalRef!);
      this.activeSupplierModalRef = null;
    });
  }

  openEditModal(supplier: Supplier): void {
    if (!this.permissionHelper.checkPermission(this.permissions.edit, "editar fornecedores")) {
      return;
    }

    this.activeSupplierModalRef = this.modalService.open(SupplierModalComponent, {
      data: {
        supplier: { ...supplier },
      },
      onClose: () => {
        this.activeSupplierModalRef = null;
      },
    });

    this.activeSupplierModalRef.instance.supplierSaved.subscribe(() => {
      this.listSuppliers();
      this.modalService.close(this.activeSupplierModalRef!);
      this.activeSupplierModalRef = null;
    });
  }

  openViewModal(supplier: Supplier): void {
    this.activeSupplierModalRef = this.modalService.open(SupplierModalComponent, {
      data: {
        supplier: { ...supplier },
        readonly: true,
      },
      onClose: () => {
        this.activeSupplierModalRef = null;
      },
    });
  }

  clearSelection(): void {
    this.selectedSuppliers = [];
  }

  removeSelectedSuppliers(): void {
    if (!this.permissionHelper.checkPermission(this.permissions.delete, "excluir fornecedores")) {
      return;
    }

    if (this.selectedSuppliers.length === 0) return;

    this.alertService.showAlert("Confirmação", `Tem certeza que deseja excluir ${this.selectedSuppliers.length} fornecedor(es) selecionado(s)? Esta ação não poderá ser desfeita.`, "warning", "Excluir", "Cancelar").then((confirmed: boolean) => {
      if (confirmed) {
        this.isLoading = true;
        const deletePromises = this.selectedSuppliers.map((supplier) => this.suppliersService.removeSupplier(supplier._id!).toPromise());

        Promise.all(deletePromises)
          .then(() => {
            this.toastService.success("Sucesso", `${this.selectedSuppliers.length} fornecedor(es) removido(s) com sucesso.`);
            this.selectedSuppliers = [];
            this.listSuppliers();
            this.isLoading = false;
          })
          .catch((error) => {
            this.isLoading = false;
          });
      }
    });
  }

  exportSelectedSuppliers(): void {
    if (this.selectedSuppliers.length === 0) return;

    const headers = ["Código", "Nome", "CNPJ", "Telefone", "Email", "Data de Cadastro"];

    this.exportService.exportToCsv(this.selectedSuppliers, headers, "fornecedores_exportados", (supplier) => [supplier.code || "", supplier.name || "", supplier.cnpj || "", supplier.phone || "", supplier.email || "", supplier.createdAt ? new Date(supplier.createdAt).toLocaleDateString("pt-BR") : ""]);

    this.toastService.success("Sucesso", `${this.selectedSuppliers.length} fornecedor(es) exportado(s) com sucesso.`);
  }

  getFilterPeriodLabel(): string {
    switch (this.filterPeriod) {
      case "today":
        return "Hoje";
      case "week":
        return "Últimos 7 dias";
      case "month":
        return "Últimos 30 dias";
      case "semester":
        return "Últimos 6 meses";
      case "year":
        return "Este ano";
      default:
        return "Todos os períodos";
    }
  }

  handleMoreInfo() {
    this.garageSystemService.handleMoreInfo();
  }

  handleUpgradePlan() {
    this.garageSystemService.handleUpgradePlan();
  }

  // Método para seleção individual em mobile
  toggleSupplierSelection(supplier: Supplier): void {
    const index = this.selectedSuppliers.findIndex(s => s._id === supplier._id);
    if (index > -1) {
      this.selectedSuppliers.splice(index, 1);
    } else {
      this.selectedSuppliers.push(supplier);
    }
  }
}
