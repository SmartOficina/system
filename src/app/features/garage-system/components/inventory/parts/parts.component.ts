import { Component, OnInit, ComponentRef, OnDestroy } from "@angular/core";
import { HttpResponse } from "@angular/common/http";
import { FormsModule } from "@angular/forms";
import { PartsService } from "./parts.service";
import { NgIf, NgFor, DatePipe, CurrencyPipe } from "@angular/common";
import { Subject, takeUntil } from "rxjs";
import { GenericTableComponent, TableColumn } from "@shared/components/generic-table/generic-table.component";
import { InputGenericComponent } from "@shared/components/input-generic/input-generic.component";
import { PaginationComponent } from "@shared/components/pagination/pagination.component";
import { PartModalComponent } from "@shared/modals/part-modal/part-modal.component";
import { Part } from "@shared/models/models";
import { AlertService } from "@shared/services/alert.service";
import { ModalService } from "@shared/services/modal.service";
import { CurrencyUtils } from "@shared/utils/currency-utils";
import { PermissionHelperService, PermissionSet } from "@shared/services/permission-helper.service";

import { PermissionGuardComponent } from "@shared/components/permission-guard.component";
import { GarageSystemService } from "@features/garage-system/garage-system.service";
import { ToastService } from "@shared/services/toast.service";
import { ExportService } from "@shared/services/export.service";

@Component({
  selector: "app-parts",
  templateUrl: "./parts.component.html",
  styleUrls: ["./parts.component.scss"],
  // prettier-ignore
  imports: [
    FormsModule,
    NgIf,
    NgFor,
    DatePipe,
    CurrencyPipe,
    PaginationComponent,
    InputGenericComponent,
    GenericTableComponent,
    PermissionGuardComponent
  ],
})
export class PartsComponent implements OnInit, OnDestroy {
  parts: Part[] = [];
  selectedParts: Part[] = [];
  search: string = "";
  page: number = 1;
  limit: number = 10;
  limitOptions: number[] = [5, 10, 25, 50, 100];
  totalPages: number = 0;
  totalParts: number = 0;
  isLoading: boolean = false;
  activePartModalRef: ComponentRef<PartModalComponent> | null = null;
  searchTimeout: any;
  Math = Math;
  lastUpdate: Date = new Date();
  private destroy$ = new Subject<void>();

  filterStockStatus: string = "all";
  sortOrder: string = "code";

  permissions: PermissionSet = {
    view: false,
    create: false,
    edit: false,
    delete: false,
  };

  partColumns: TableColumn[] = [
    { header: "Código", field: "code" },
    { header: "Nome", field: "name" },
    {
      header: "Estoque Mínimo",
      field: "minimumStock",
      transform: (value: any) => (value !== undefined ? value.toString() : "0"),
    },
    {
      header: "Preço de Venda",
      field: "sellingPrice",
      transform: (value: any) => CurrencyUtils.formatCurrency(value),
    },
    {
      header: "Custo Médio",
      field: "averageCost",
      transform: (value: any) => CurrencyUtils.formatCurrency(value),
    },
    { header: "Unidade", field: "unit" },
    { header: "Ações", field: "actions" },
  ];

  // prettier-ignore
  constructor(
    private partsService: PartsService,
    private alertService: AlertService,
    private modalService: ModalService,
    private permissionHelper: PermissionHelperService,
    private garageSystemService: GarageSystemService,
    private toastService: ToastService,
    private exportService: ExportService
  ) { }

  ngOnInit(): void {
    this.loadPermissions();
    this.listParts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPermissions(): void {
    this.permissionHelper
      .getEntityPermissions("part")
      .pipe(takeUntil(this.destroy$))
      .subscribe((permissions) => {
        this.permissions = permissions;
      });
  }

  listParts(): void {
    this.isLoading = true;
    this.partsService.listParts(this.search, this.limit, this.page, this.filterStockStatus, "", this.sortOrder).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200) {
          this.parts = response.body?.result || [];
          this.totalPages = response.body?.totalPages || 0;
          this.totalParts = response.body?.totalItems || 0;
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
      this.listParts();
    }, 500);
  }

  removePart(id: string): void {
    if (!this.permissionHelper.checkPermission(this.permissions.delete, "excluir peças")) {
      return;
    }

    this.alertService.showAlert("Confirmação", "Tem certeza que deseja excluir esta peça? Esta ação não poderá ser desfeita.", "warning", "Excluir", "Cancelar").then((confirmed: boolean) => {
      if (confirmed) {
        this.isLoading = true;
        this.partsService.removePart(id).subscribe(
          (response: HttpResponse<any>) => {
            if (response.status === 200) {
              this.toastService.success("Sucesso", "Peça removida com sucesso.");
              this.listParts();
              this.selectedParts = [];
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
    this.listParts();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  changeLimit(): void {
    this.page = 1;
    this.listParts();
  }

  refreshData(): void {
    this.selectedParts = [];
    this.listParts();
  }

  applyFilters(): void {
    this.page = 1;
    this.listParts();
  }

  clearFilters(): void {
    this.filterStockStatus = "all";
    this.search = "";
    this.page = 1;
    this.listParts();
  }

  changeSortOrder(): void {
    this.page = 1;
    this.listParts();
  }

  openCreateModal(): void {
    if (!this.permissionHelper.checkPermission(this.permissions.create, "cadastrar peças")) {
      return;
    }

    this.activePartModalRef = this.modalService.open(PartModalComponent, {
      data: {
        part: null,
      },
      onClose: () => {
        this.activePartModalRef = null;
      },
    });

    this.activePartModalRef.instance.partSaved.subscribe(() => {
      this.listParts();
      this.modalService.close(this.activePartModalRef!);
      this.activePartModalRef = null;
    });
  }

  openEditModal(part: Part): void {
    if (!this.permissionHelper.checkPermission(this.permissions.edit, "editar peças")) {
      return;
    }

    this.activePartModalRef = this.modalService.open(PartModalComponent, {
      data: {
        part: { ...part },
      },
      onClose: () => {
        this.activePartModalRef = null;
      },
    });

    this.activePartModalRef.instance.partSaved.subscribe(() => {
      this.listParts();
      this.modalService.close(this.activePartModalRef!);
      this.activePartModalRef = null;
    });
  }

  openViewModal(part: Part): void {
    this.activePartModalRef = this.modalService.open(PartModalComponent, {
      data: {
        part: { ...part },
        readonly: true,
      },
      onClose: () => {
        this.activePartModalRef = null;
      },
    });
  }

  clearSelection(): void {
    this.selectedParts = [];
  }

  removeSelectedParts(): void {
    if (!this.permissionHelper.checkPermission(this.permissions.delete, "excluir peças")) {
      return;
    }

    if (this.selectedParts.length === 0) return;

    this.alertService.showAlert("Confirmação", `Tem certeza que deseja excluir ${this.selectedParts.length} peça(s) selecionada(s)? Esta ação não poderá ser desfeita.`, "warning", "Excluir", "Cancelar").then((confirmed: boolean) => {
      if (confirmed) {
        this.isLoading = true;
        const deletePromises = this.selectedParts.map((part) => this.partsService.removePart(part._id!).toPromise());

        Promise.all(deletePromises)
          .then(() => {
            this.toastService.success("Sucesso", `${this.selectedParts.length} peça(s) removida(s) com sucesso.`);
            this.selectedParts = [];
            this.listParts();
            this.isLoading = false;
          })
          .catch((error) => {
            this.isLoading = false;
          });
      }
    });
  }

  exportSelectedParts(): void {
    if (this.selectedParts.length === 0) return;

    const headers = ["Código", "Nome", "Estoque Mínimo", "Preço de Venda", "Custo Médio", "Unidade", "Data de Cadastro"];

    this.exportService.exportToCsv(this.selectedParts, headers, "pecas_exportadas", (part) => [part.code || "", part.name || "", (part.minimumStock || 0).toString(), (part.sellingPrice || 0).toString().replace(".", ","), (part.averageCost || 0).toString().replace(".", ","), part.unit || "", part.createdAt ? new Date(part.createdAt).toLocaleDateString("pt-BR") : ""]);

    this.toastService.success("Sucesso", `${this.selectedParts.length} peça(s) exportada(s) com sucesso.`);
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

  getFilterCategoryLabel(): string {
    return "Todas as categorias";
  }

  handleMoreInfo() {
    this.garageSystemService.handleMoreInfo();
  }

  handleUpgradePlan() {
    this.garageSystemService.handleUpgradePlan();
  }

  // Método para seleção individual em mobile
  togglePartSelection(part: Part): void {
    const index = this.selectedParts.findIndex(p => p._id === part._id);
    if (index > -1) {
      this.selectedParts.splice(index, 1);
    } else {
      this.selectedParts.push(part);
    }
  }
}
