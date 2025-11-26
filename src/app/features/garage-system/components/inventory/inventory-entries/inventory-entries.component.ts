import { Component, OnInit, ComponentRef, OnDestroy } from "@angular/core";
import { HttpResponse } from "@angular/common/http";
import { FormsModule } from "@angular/forms";
import { InventoryEntriesService } from "./inventory-entries.service";
import { NgIf, NgFor, DatePipe, CurrencyPipe } from "@angular/common";
import { Subject, takeUntil } from "rxjs";
import { GenericTableComponent, TableColumn } from "@shared/components/generic-table/generic-table.component";
import { PaginationComponent } from "@shared/components/pagination/pagination.component";
import { InventoryEntryModalComponent } from "@shared/modals/inventory-entry-modal/inventory-entry-modal.component";
import { InventoryExitModalComponent } from "@shared/modals/inventory-exit-modal/inventory-exit-modal.component";
import { AlertService } from "@shared/services/alert.service";
import { ModalService } from "@shared/services/modal.service";
import { CurrencyUtils } from "@shared/utils/currency-utils";
import { SupplierModalComponent } from "@shared/modals/supplier-modal/supplier-modal.component";
import { ServiceOrderModalComponent } from "@shared/modals/service-order-modal/service-order-modal.component";
import { PermissionHelperService, PermissionSet } from "@shared/services/permission-helper.service";
import { PermissionGuardComponent } from "@shared/components/permission-guard.component";

import { GarageSystemService } from "@features/garage-system/garage-system.service";
import { ToastService } from "@shared/services/toast.service";
import { ExportService } from "@shared/services/export.service";
import { PartModalComponent } from "@shared/modals/part-modal/part-modal.component";

@Component({
  selector: "app-inventory-entries",
  templateUrl: "./inventory-entries.component.html",
  styleUrls: ["./inventory-entries.component.scss"],
  // prettier-ignore
  imports: [
    FormsModule,
    NgIf,
    NgFor,
    DatePipe,
    CurrencyPipe,
    PaginationComponent,
    GenericTableComponent,
    PermissionGuardComponent
  ],
})
export class InventoryEntriesComponent implements OnInit, OnDestroy {
  entries: any[] = [];
  selectedEntries: any[] = [];
  search: string = "";
  page: number = 1;
  limit: number = 10;
  limitOptions: number[] = [5, 10, 25, 50, 100];
  totalPages: number = 0;
  totalEntries: number = 0;
  totalValue: number = 0;
  isLoading: boolean = false;
  activeEntryModalRef: ComponentRef<InventoryEntryModalComponent> | null = null;
  activeExitModalRef: ComponentRef<InventoryExitModalComponent> | null = null;
  searchTimeout: any;
  Math = Math;
  lastUpdate: Date = new Date();

  movementType: string = "all";
  startDate: string = "";
  endDate: string = "";

  sortOrder: string = "newest";

  private destroy$ = new Subject<void>();

  permissions: PermissionSet = {
    view: false,
    create: false,
    edit: false,
    delete: false,
  };

  entryColumns: TableColumn[] = [
    {
      header: "Data",
      field: "entryDate",
      transform: (value: any) => {
        if (!value) return "-";

        const entryDate = new Date(value);
        const dateOnly = new Date(entryDate.getUTCFullYear(), entryDate.getUTCMonth(), entryDate.getUTCDate());
        return dateOnly.toLocaleDateString("pt-BR");
      },
    },
    {
      header: "Tipo",
      field: "movementType",
      transform: (value: any) => {
        const badge = value === "entry" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
        const text = value === "entry" ? "Entrada" : "Saída";
        return `<span class="px-2 py-1 rounded-full text-xs font-medium ${badge}">${text}</span>`;
      },
      isHtml: true,
    },
    {
      header: "Peça",
      field: "partId.name",
      type: "custom",
      transform: (value: any, item: any) => {
        return item.partId?.name || "N/A";
      },
    },
    {
      header: "Quantidade",
      field: "quantity",
      transform: (value: any, item: any) => {
        const absValue = Math.abs(value);
        const unit = item.partId?.unit || "";
        return `${absValue} ${unit}`.trim();
      },
    },
    {
      header: "Preço de Custo (R$)",
      field: "costPrice",
      transform: (value: any) => CurrencyUtils.formatCurrency(value),
    },
    {
      header: "Preço de Venda (R$)",
      field: "sellingPrice",
      transform: (value: any) => CurrencyUtils.formatCurrency(value),
    },
    {
      header: "Margem de Lucro (%)",
      field: "profitMargin",
      transform: (value: any, item: any) => {
        if (item.movementType === "entry" && value !== undefined && value !== null) {
          return `${value.toFixed(2)}%`.replace(".", ",");
        }
        return "-";
      },
    },
    {
      header: "OS/Fornecedor",
      field: "reference",
      type: "custom",
      transform: (value: any, item: any) => {
        if (item.movementType === "exit" && item.exitType === "service_order") {
          if (item.serviceOrder?.vehicle) {
            const vehicle = item.serviceOrder.vehicle;
            return `${vehicle.brandModel}`;
          }
          return `OS: ${item.reference || "-"}`;
        }
        if (item.movementType === "exit" && (item.exitType === "manual" || item.exitType === "loss" || item.exitType === "transfer")) {
          const typeLabels: any = {
            manual: "Saída Manual",
            loss: "Perda",
            transfer: "Transferência",
          };
          return typeLabels[item.exitType] || "Saída Manual";
        }
        if (item.movementType === "entry" && item.supplierId) {
          return item.supplierId.name;
        }
        return "-";
      },
    },
    { header: "Ações", field: "actions" },
  ];

  // prettier-ignore
  constructor(
    private inventoryEntriesService: InventoryEntriesService,
    private alertService: AlertService,
    private modalService: ModalService,
    private permissionHelper: PermissionHelperService,
    private garageSystemService: GarageSystemService,
    private toastService: ToastService,
    private exportService: ExportService
  ) { }

  ngOnInit(): void {
    this.loadPermissions();
    this.listEntries();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onViewServiceOrder(item: any): void {
    if (item.serviceOrder) {
      this.modalService.open(ServiceOrderModalComponent, {
        data: {
          serviceOrder: item.serviceOrder,
          readonly: true,
        },
      });
    }
  }

  onViewSupplier(item: any): void {
    if (item.supplierId?._id) {
      this.modalService.open(SupplierModalComponent, {
        data: {
          supplier: item.supplierId,
          readonly: true,
        },
      });
    }
  }

  onViewPart(item: any): void {
    if (item.partId?._id) {
      this.modalService.open(PartModalComponent, {
        data: {
          part: item.partId,
          readonly: true,
        },
      });
    }
  }

  loadPermissions(): void {
    this.permissionHelper
      .getEntityPermissions("inventory-entry")
      .pipe(takeUntil(this.destroy$))
      .subscribe((permissions) => {
        this.permissions = permissions;
      });
  }

  listEntries(): void {
    this.isLoading = true;

    const params = {
      search: this.search,
      limit: this.limit,
      page: this.page,
      movementType: this.movementType,
      startDate: this.startDate,
      endDate: this.endDate,
    };

    this.inventoryEntriesService.listEntries(params).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200) {
          this.entries = response.body?.result || [];
          this.totalPages = response.body?.totalPages || 0;
          this.totalEntries = response.body?.totalItems || 0;
          this.lastUpdate = new Date();
        }
        this.isLoading = false;
      },
      (error: any) => {
        this.isLoading = false;
        this.alertService.showAlert("Erro!", error.error?.msg || "Não foi possível carregar as movimentações.", "error", "Fechar");
      }
    );
  }

  onSearchKeyup(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.listEntries();
    }, 500);
  }

  onFilterChange(): void {
    this.page = 1;
    this.listEntries();
  }

  clearFilters(): void {
    this.search = "";
    this.movementType = "all";
    this.startDate = "";
    this.endDate = "";
    this.page = 1;
    this.listEntries();
  }

  hasFiltersApplied(): boolean {
    return !!(this.search || this.movementType !== "all" || this.startDate || this.endDate);
  }

  getEntriesCount(): number {
    return this.entries.filter((entry) => entry.movementType === "entry").length;
  }

  getExitsCount(): number {
    return this.entries.filter((entry) => entry.movementType === "exit").length;
  }

  getTotalValue(): string {
    const total = this.entries.reduce((sum, entry) => {
      const entryValue = Math.abs(entry.quantity) * (entry.sellingPrice || 0);
      return sum + entryValue;
    }, 0);
    return CurrencyUtils.formatCurrency(total);
  }

  openCreateModal(): void {
    if (!this.permissionHelper.checkPermission(this.permissions.create, "cadastrar entradas de estoque")) {
      return;
    }

    this.activeEntryModalRef = this.modalService.open(InventoryEntryModalComponent, {
      data: {
        entry: null,
        readonly: false,
      },
    });

    if (this.activeEntryModalRef.instance.entrySaved) {
      this.activeEntryModalRef.instance.entrySaved.subscribe(() => {
        this.listEntries();
        if (this.activeEntryModalRef) {
          this.modalService.close(this.activeEntryModalRef);
        }
      });
    }

    if (this.activeEntryModalRef.instance.closeModalEvent) {
      this.activeEntryModalRef.instance.closeModalEvent.subscribe(() => {
        if (this.activeEntryModalRef) {
          if (this.activeEntryModalRef) {
            this.modalService.close(this.activeEntryModalRef);
          }
        }
      });
    }
  }

  openCreateExitModal(): void {
    if (!this.permissionHelper.checkPermission(this.permissions.create, "cadastrar saídas de estoque")) {
      return;
    }

    const exitModalRef = this.modalService.open(InventoryExitModalComponent, {
      data: {
        readonly: false,
      },
    });

    if (exitModalRef.instance.exitSaved) {
      exitModalRef.instance.exitSaved.subscribe(() => {
        this.listEntries();
        this.modalService.close(exitModalRef);
      });
    }

    if (exitModalRef.instance.closeModalEvent) {
      exitModalRef.instance.closeModalEvent.subscribe(() => {
        this.modalService.close(exitModalRef);
      });
    }
  }

  openEditModal(entry: any): void {
    if (!this.permissionHelper.checkPermission(this.permissions.edit, "editar movimentações de estoque")) {
      return;
    }

    this.activeEntryModalRef = this.modalService.open(InventoryEntryModalComponent, {
      data: {
        entry: entry,
        readonly: false,
      },
    });

    if (this.activeEntryModalRef.instance.entrySaved) {
      this.activeEntryModalRef.instance.entrySaved.subscribe(() => {
        this.listEntries();
        if (this.activeEntryModalRef) {
          this.modalService.close(this.activeEntryModalRef);
        }
      });
    }

    if (this.activeEntryModalRef.instance.closeModalEvent) {
      this.activeEntryModalRef.instance.closeModalEvent.subscribe(() => {
        if (this.activeEntryModalRef) {
          this.modalService.close(this.activeEntryModalRef);
        }
      });
    }
  }

  openViewModal(entry: any): void {
    this.activeEntryModalRef = this.modalService.open(InventoryEntryModalComponent, {
      data: {
        entry: entry,
        readonly: true,
      },
    });

    if (this.activeEntryModalRef.instance.closeModalEvent) {
      this.activeEntryModalRef.instance.closeModalEvent.subscribe(() => {
        if (this.activeEntryModalRef) {
          this.modalService.close(this.activeEntryModalRef);
        }
      });
    }
  }

  removeEntry(id: string): void {
    if (!this.permissionHelper.checkPermission(this.permissions.delete, "excluir movimentações de estoque")) {
      return;
    }

    this.alertService.showAlert("Confirmação", "Tem certeza que deseja excluir esta movimentação? Esta ação não poderá ser desfeita e afetará o estoque atual.", "warning", "Excluir", "Cancelar").then((confirmed: boolean) => {
      if (confirmed) {
        this.isLoading = true;
        this.inventoryEntriesService.removeEntry(id).subscribe(
          (response: HttpResponse<any>) => {
            if (response.status === 200) {
              this.toastService.success("Sucesso!", "Movimentação removida com sucesso.");
              this.listEntries();
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
    this.listEntries();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  changeLimit(): void {
    this.page = 1;
    this.listEntries();
  }

  refreshData(): void {
    this.listEntries();
  }

  handleMoreInfo() {
    this.garageSystemService.handleMoreInfo();
  }

  handleUpgradePlan() {
    this.garageSystemService.handleUpgradePlan();
  }

  clearSelection(): void {
    this.selectedEntries = [];
  }

  changeSortOrder(): void {
    this.page = 1;
    this.listEntries();
  }

  removeSelectedEntries(): void {
    if (!this.permissionHelper.checkPermission(this.permissions.delete, "excluir movimentações")) {
      return;
    }

    if (this.selectedEntries.length === 0) return;

    this.alertService.showAlert("Confirmação", `Tem certeza que deseja excluir ${this.selectedEntries.length} movimentação(ões) selecionada(s)? Esta ação não poderá ser desfeita.`, "warning", "Excluir", "Cancelar").then((confirmed: boolean) => {
      if (confirmed) {
        this.isLoading = true;
        const deletePromises = this.selectedEntries.map((entry) => this.inventoryEntriesService.removeEntry(entry._id!).toPromise());

        Promise.all(deletePromises)
          .then(() => {
            this.toastService.success("Sucesso", `${this.selectedEntries.length} movimentação(ões) removida(s) com sucesso.`);
            this.selectedEntries = [];
            this.listEntries();
            this.isLoading = false;
          })
          .catch((error) => {
            this.isLoading = false;
          });
      }
    });
  }

  exportSelectedEntries(): void {
    if (this.selectedEntries.length === 0) return;

    const headers = ["Código", "Tipo", "Peça", "Quantidade", "Valor", "Data"];

    this.exportService.exportToCsv(this.selectedEntries, headers, "movimentacoes_exportadas", (entry) => [entry.partId?.code || "", entry.movementType === "entry" ? "Entrada" : "Saída", entry.partId?.name || "", entry.quantity?.toString() || "", entry.sellingPrice ? CurrencyUtils.formatCurrency(entry.sellingPrice) : "", entry.entryDate ? new Date(entry.entryDate).toLocaleDateString("pt-BR") : ""]);

    this.toastService.success("Sucesso", `${this.selectedEntries.length} movimentação(ões) exportada(s) com sucesso.`);
  }

  getMovementTypeLabel(): string {
    switch (this.movementType) {
      case "entry":
        return "Apenas entradas";
      case "exit":
        return "Apenas saídas";
      default:
        return "Todos os tipos";
    }
  }

  // Método para seleção individual em mobile
  toggleEntrySelection(entry: any): void {
    const index = this.selectedEntries.findIndex(e => e._id === entry._id);
    if (index > -1) {
      this.selectedEntries.splice(index, 1);
    } else {
      this.selectedEntries.push(entry);
    }
  }
}
