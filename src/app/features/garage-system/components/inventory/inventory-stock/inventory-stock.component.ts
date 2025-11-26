import { Component, OnInit, OnDestroy, ComponentRef } from "@angular/core";
import { HttpResponse } from "@angular/common/http";
import { FormsModule } from "@angular/forms";
import { NgIf, NgFor, DatePipe } from "@angular/common";
import { Subject, takeUntil } from "rxjs";
import { GenericTableComponent, TableColumn } from "@shared/components/generic-table/generic-table.component";
import { InputGenericComponent } from "@shared/components/input-generic/input-generic.component";
import { PaginationComponent } from "@shared/components/pagination/pagination.component";
import { AlertService } from "@shared/services/alert.service";
import { CurrencyUtils } from "@shared/utils/currency-utils";
import { PermissionHelperService, PermissionSet } from "@shared/services/permission-helper.service";
import { PermissionGuardComponent } from "@shared/components/permission-guard.component";

import { GarageSystemService } from "@features/garage-system/garage-system.service";
import { PartsService } from "../parts/parts.service";
import { ModalService } from "@shared/services/modal.service";
import { PartModalComponent } from "@shared/modals/part-modal/part-modal.component";
import { SupplierModalComponent } from "@shared/modals/supplier-modal/supplier-modal.component";
import { InventoryEntryModalComponent } from "@shared/modals/inventory-entry-modal/inventory-entry-modal.component";
import { InventoryExitModalComponent } from "@shared/modals/inventory-exit-modal/inventory-exit-modal.component";

@Component({
  selector: "app-inventory-stock",
  templateUrl: "./inventory-stock.component.html",
  styleUrls: ["./inventory-stock.component.scss"],
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
export class InventoryStockComponent implements OnInit, OnDestroy {
  parts: any[] = [];
  search: string = "";
  page: number = 1;
  limit: number = 10;
  limitOptions: number[] = [5, 10, 25, 50, 100];
  totalPages: number = 0;
  totalParts: number = 0;
  isLoading: boolean = false;
  searchTimeout: any;
  Math = Math;
  lastUpdate: Date = new Date();

  filterStockStatus: string = "all";
  sortOrder: string = "name";

  activePartModalRef: ComponentRef<PartModalComponent> | null = null;
  activeSupplierModalRef: ComponentRef<SupplierModalComponent> | null = null;
  activeEntryModalRef: ComponentRef<InventoryEntryModalComponent> | null = null;
  activeExitModalRef: ComponentRef<InventoryExitModalComponent> | null = null;

  private destroy$ = new Subject<void>();

  permissions: PermissionSet = {
    view: false,
    create: false,
    edit: false,
    delete: false,
  };

  stockColumns: TableColumn[] = [
    { header: "Código", field: "code" },
    { header: "Nome", field: "name" },
    {
      header: "Estoque Atual",
      field: "currentStock",
      transform: (value: any) => (value !== undefined ? value.toString() : "0"),
      customClasses: (value: any, item: any) => {
        return value < (item.minimumStock || 0) ? "text-red-500 font-bold" : "";
      },
    },
    {
      header: "Estoque Mínimo",
      field: "minimumStock",
      transform: (value: any) => (value !== undefined ? value.toString() : "0"),
    },
    {
      header: "Status",
      field: "currentStock",
      isHtml: true,
      transform: (value: any, item: any) => {
        if (value < (item.minimumStock || 0)) {
          return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Estoque Baixo</span>';
        }
        return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Normal</span>';
      },
    },
    { header: "Unidade", field: "unit" },
    {
      header: "Custo Médio",
      field: "averageCost",
      transform: (value: any) => CurrencyUtils.formatCurrency(value),
    },
    {
      header: "Valor em Estoque",
      field: "stockValue",
      transform: (value: any) => CurrencyUtils.formatCurrency(value),
    },
  ];

  constructor(
    private partsService: PartsService,
    private alertService: AlertService,
    private permissionHelper: PermissionHelperService,
    private garageSystemService: GarageSystemService,
    private modalService: ModalService
  ) { }

  ngOnInit(): void {
    this.loadPermissions();
    this.listStockItems();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPermissions(): void {
    this.permissionHelper
      .getEntityPermissions("inventory")
      .pipe(takeUntil(this.destroy$))
      .subscribe((permissions) => {
        this.permissions = permissions;
      });
  }

  listStockItems(): void {
    this.isLoading = true;
    this.partsService.listParts(this.search, this.limit, this.page, this.filterStockStatus, "all", this.sortOrder).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200) {
          this.parts = response.body?.result || [];

          this.parts.forEach((part) => {
            part.stockValue = (part.currentStock || 0) * (part.averageCost || 0);
          });

          this.totalPages = response.body?.totalPages || 0;
          this.totalParts = response.body?.totalItems || 0;
          this.lastUpdate = new Date();
        }
        this.isLoading = false;
      },
      (error: any) => {
        this.isLoading = false;
        this.alertService.showAlert("Erro!", error.error?.msg || "Não foi possível carregar os itens de estoque.", "error", "Fechar");
      }
    );
  }

  onSearchKeyup(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.listStockItems();
    }, 500);
  }

  changePage(page: number): void {
    this.page = page;
    this.listStockItems();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  changeLimit(): void {
    this.page = 1;
    this.listStockItems();
  }

  refreshData(): void {
    this.listStockItems();
  }

  applyFilters(): void {
    this.page = 1;
    this.listStockItems();
  }

  clearFilters(): void {
    this.filterStockStatus = "all";
    this.search = "";
    this.page = 1;
    this.listStockItems();
  }

  changeSortOrder(): void {
    this.page = 1;
    this.listStockItems();
  }

  getTotalStockValue(): number {
    return this.parts.reduce((total, part) => total + (part.stockValue || 0), 0);
  }

  formatCurrency(value: number): string {
    return CurrencyUtils.formatCurrency(value);
  }

  getLowStockCount(): number {
    return this.parts.filter((part) => (part.currentStock || 0) < (part.minimumStock || 0)).length;
  }

  getFilterStockStatusLabel(): string {
    switch (this.filterStockStatus) {
      case "available":
        return "Com estoque";
      case "low":
        return "Estoque baixo";
      case "out":
        return "Sem estoque";
      default:
        return "Todos os itens";
    }
  }

  getStockTurnover(): number {
    return Math.round(Math.random() * 10 + 5);
  }

  openCreatePartModal(): void {
    this.permissionHelper
      .getEntityPermissions("part")
      .pipe(takeUntil(this.destroy$))
      .subscribe((partPermissions) => {
        if (!this.permissionHelper.checkPermission(partPermissions.create, "cadastrar peças")) {
          return;
        }
        this.performOpenCreatePartModal();
      });
  }

  private performOpenCreatePartModal(): void {
    this.activePartModalRef = this.modalService.open(PartModalComponent, {
      data: {
        part: null,
      },
      onClose: () => {
        this.activePartModalRef = null;
      },
    });

    this.activePartModalRef.instance.partSaved.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.listStockItems();
      this.modalService.close(this.activePartModalRef!);
      this.activePartModalRef = null;
    });
  }

  openCreateSupplierModal(): void {
    this.permissionHelper
      .getEntityPermissions("supplier")
      .pipe(takeUntil(this.destroy$))
      .subscribe((supplierPermissions) => {
        if (!this.permissionHelper.checkPermission(supplierPermissions.create, "cadastrar fornecedores")) {
          return;
        }
        this.performOpenCreateSupplierModal();
      });
  }

  private performOpenCreateSupplierModal(): void {
    this.activeSupplierModalRef = this.modalService.open(SupplierModalComponent, {
      data: {
        supplier: null,
      },
      onClose: () => {
        this.activeSupplierModalRef = null;
      },
    });

    this.activeSupplierModalRef.instance.supplierSaved.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.modalService.close(this.activeSupplierModalRef!);
      this.activeSupplierModalRef = null;
    });
  }

  openCreateEntryModal(): void {
    this.permissionHelper
      .getEntityPermissions("inventory-entry")
      .pipe(takeUntil(this.destroy$))
      .subscribe((entryPermissions) => {
        if (!this.permissionHelper.checkPermission(entryPermissions.create, "registrar entradas")) {
          return;
        }
        this.performOpenCreateEntryModal();
      });
  }

  private performOpenCreateEntryModal(): void {
    this.activeEntryModalRef = this.modalService.open(InventoryEntryModalComponent, {
      data: {
        entry: null,
      },
      onClose: () => {
        this.activeEntryModalRef = null;
      },
    });

    this.activeEntryModalRef.instance.entrySaved.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.listStockItems();
      this.modalService.close(this.activeEntryModalRef!);
      this.activeEntryModalRef = null;
    });
  }

  openCreateExitModal(): void {
    this.permissionHelper
      .getEntityPermissions("inventory-entry")
      .pipe(takeUntil(this.destroy$))
      .subscribe((entryPermissions) => {
        if (!this.permissionHelper.checkPermission(entryPermissions.create, "registrar saídas")) {
          return;
        }
        this.performOpenCreateExitModal();
      });
  }

  private performOpenCreateExitModal(): void {
    this.activeExitModalRef = this.modalService.open(InventoryExitModalComponent, {
      data: {
        entry: null,
      },
      onClose: () => {
        this.activeExitModalRef = null;
      },
    });

    this.activeExitModalRef.instance.exitSaved.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.listStockItems();
      this.modalService.close(this.activeExitModalRef!);
      this.activeExitModalRef = null;
    });
  }

  handleMoreInfo() {
    this.garageSystemService.handleMoreInfo();
  }

  handleUpgradePlan() {
    this.garageSystemService.handleUpgradePlan();
  }
}
