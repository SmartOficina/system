import { Component, OnInit, ComponentRef, OnDestroy } from "@angular/core";
import { HttpResponse } from "@angular/common/http";
import { FormsModule } from "@angular/forms";
import { NgIf, NgFor, DatePipe } from "@angular/common";
import { Subject, takeUntil, debounceTime, distinctUntilChanged, Subscription } from "rxjs";
import { ServicesService } from "./services.service";

import { ServiceModalComponent } from "@shared/modals/service-modal/service-modal.component";
import { AlertService } from "@shared/services/alert.service";
import { Service } from "@shared/models/models";
import { ModalService } from "@shared/services/modal.service";
import { InputGenericComponent } from "@shared/components/input-generic/input-generic.component";
import { PaginationComponent } from "@shared/components/pagination/pagination.component";
import { GenericTableComponent, TableColumn } from "@shared/components/generic-table/generic-table.component";
import { PermissionHelperService, PermissionSet } from "@shared/services/permission-helper.service";
import { GarageSystemService } from "@features/garage-system/garage-system.service";
import { PermissionGuardComponent } from "@shared/components/permission-guard.component";
import { ToastService } from "@shared/services/toast.service";
import { ExportService } from "@shared/services/export.service";

@Component({
  selector: "app-services",
  templateUrl: "./services.component.html",
  styleUrls: ["./services.component.scss"],
  // prettier-ignore
  imports: [
    FormsModule,
    NgIf,
    NgFor,
    DatePipe,
    PaginationComponent,
    InputGenericComponent,
    GenericTableComponent,
    PermissionGuardComponent
  ],
  standalone: true,
})
export class ServicesComponent implements OnInit, OnDestroy {
  services: Service[] = [];
  selectedServices: Service[] = [];
  search: string = "";
  page: number = 1;
  limit: number = 10;
  limitOptions: number[] = [5, 10, 25, 50, 100];
  totalPages: number = 0;
  totalServices: number = 0;
  isLoading: boolean = false;
  activeServiceModalRef: ComponentRef<ServiceModalComponent> | null = null;
  lastUpdate: Date = new Date();
  Math = Math;

  filterPeriod: string = "all";
  filterPriceRange: string = "all";
  sortOrder: string = "newest";

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  private subscriptions = new Subscription();

  permissions: PermissionSet = {
    view: false,
    create: false,
    edit: false,
    delete: false,
  };

  serviceColumns: TableColumn[] = [
    { header: "Código", field: "code" },
    { header: "Nome", field: "name" },
    {
      header: "Preço de Venda",
      field: "sellingPrice",
      transform: (value) => {
        const roundedValue = Math.round(Number(value) * 100) / 100;
        return `R$ ${roundedValue.toFixed(2).replace(".", ",")}`;
      },
    },
    { header: "Margem de Lucro", field: "profitMargin", transform: (value) => `${value}%` },
    {
      header: "Preço de Custo",
      field: "costPrice",
      transform: (value) => {
        const roundedValue = Math.round(Number(value) * 100) / 100;
        return `R$ ${roundedValue.toFixed(2).replace(".", ",")}`;
      },
    },
    { header: "Ações", field: "actions" },
  ];

  // prettier-ignore
  constructor(
    private servicesService: ServicesService,
    private alertService: AlertService,
    private modalService: ModalService,
    private toastService: ToastService,
    private garageSystemService: GarageSystemService,
    private permissionHelper: PermissionHelperService,
    private exportService: ExportService
  ) { }

  ngOnInit(): void {
    this.loadPermissions();

    this.subscriptions.add(
      this.searchSubject.pipe(debounceTime(500), distinctUntilChanged()).subscribe(() => {
        this.page = 1;
        this.listServices();
      })
    );

    this.listServices();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.unsubscribe();
  }

  loadPermissions(): void {
    this.permissionHelper
      .getEntityPermissions("service")
      .pipe(takeUntil(this.destroy$))
      .subscribe((permissions) => {
        this.permissions = permissions;
      });
  }

  listServices(): void {
    this.isLoading = true;
    const numericLimit = Number(this.limit);
    const numericPage = Number(this.page);

    this.servicesService
      .listServices(this.search, numericLimit, numericPage, this.sortOrder, this.filterPeriod, this.filterPriceRange)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: HttpResponse<any>) => {
          if (response.status === 200) {
            this.services = response.body?.result || [];
            this.totalPages = response.body?.totalPages || 0;
            this.totalServices = response.body?.totalItems || 0;
            this.lastUpdate = new Date();
          }
          this.isLoading = false;
        },
        () => {
          this.isLoading = false;
        }
      );
  }

  onSearchKeyup(): void {
    this.searchSubject.next(this.search);
  }

  removeService(id: string): void {
    if (!this.permissionHelper.checkPermission(this.permissions.delete, "excluir serviços")) {
      return;
    }

    this.alertService.showAlert("Confirmação", "Tem certeza que deseja excluir este serviço?", "warning", "Excluir", "Cancelar").then((confirmed: boolean) => {
      if (confirmed) {
        this.isLoading = true;
        this.servicesService
          .removeService(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe(
            (response: HttpResponse<any>) => {
              if (response.status === 200) {
                this.toastService.success("Sucesso", "Serviço removido com sucesso.");
                this.listServices();
                this.selectedServices = this.selectedServices.filter((service) => service._id !== id);
              }
              this.isLoading = false;
            },
            () => {
              this.isLoading = false;
            }
          );
      }
    });
  }

  changePage(page: number): void {
    this.page = Number(page);
    this.listServices();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  changeLimit(): void {
    this.page = 1;
    this.limit = Number(this.limit);
    this.listServices();
  }

  changeSortOrder(): void {
    this.page = 1;
    this.listServices();
  }

  refreshData(): void {
    this.selectedServices = [];
    this.listServices();
  }

  openCreateModal(): void {
    if (!this.permissionHelper.checkPermission(this.permissions.create, "cadastrar serviços")) {
      return;
    }

    this.activeServiceModalRef = this.modalService.open(ServiceModalComponent, {
      data: {
        service: null,
      },
      onClose: () => {
        this.activeServiceModalRef = null;
      },
    });

    this.activeServiceModalRef.instance.serviceSaved.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.listServices();
      this.modalService.close(this.activeServiceModalRef!);
      this.activeServiceModalRef = null;
    });
  }

  openEditModal(service: Service): void {
    if (!this.permissionHelper.checkPermission(this.permissions.edit, "editar serviços")) {
      return;
    }

    this.activeServiceModalRef = this.modalService.open(ServiceModalComponent, {
      data: {
        service: { ...service },
      },
      onClose: () => {
        this.activeServiceModalRef = null;
      },
    });

    this.activeServiceModalRef.instance.serviceSaved.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.listServices();
      this.modalService.close(this.activeServiceModalRef!);
      this.activeServiceModalRef = null;
    });
  }

  openViewModal(service: Service): void {
    this.activeServiceModalRef = this.modalService.open(ServiceModalComponent, {
      data: {
        service: { ...service },
        readonly: true,
      },
      onClose: () => {
        this.activeServiceModalRef = null;
      },
    });

    this.activeServiceModalRef.instance.serviceSaved.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.listServices();
      this.modalService.close(this.activeServiceModalRef!);
      this.activeServiceModalRef = null;
    });
  }

  clearSelection(): void {
    this.selectedServices = [];
  }

  removeSelectedServices(): void {
    if (!this.permissionHelper.checkPermission(this.permissions.delete, "excluir serviços")) {
      return;
    }

    if (this.selectedServices.length === 0) {
      return;
    }

    this.alertService.showAlert("Confirmação", `Tem certeza que deseja excluir ${this.selectedServices.length} serviço(s) selecionado(s)?`, "warning", "Excluir", "Cancelar").then((confirmed: boolean) => {
      if (confirmed) {
        this.isLoading = true;

        const deletePromises = this.selectedServices.map((service: any) => {
          return new Promise<void>((resolve, reject) => {
            this.servicesService
              .removeService(service._id)
              .pipe(takeUntil(this.destroy$))
              .subscribe(
                () => resolve(),
                (error) => reject(error)
              );
          });
        });

        Promise.all(deletePromises)
          .then(() => {
            this.toastService.success("Sucesso", `${this.selectedServices.length} serviço(s) removido(s) com sucesso.`);
            this.selectedServices = [];
            this.listServices();
          })
          .catch(() => {
            this.listServices();
          })
          .finally(() => {
            this.isLoading = false;
          });
      }
    });
  }

  exportSelectedServices(): void {
    if (this.selectedServices.length === 0) {
      return;
    }

    const headers = ["Código", "Nome", "Preço de Venda", "Margem de Lucro (%)", "Preço de Custo"];

    this.exportService.exportToCsv(this.selectedServices, headers, "servicos_exportados", (service) => [service.code || "", service.name || "", service.sellingPrice ? service.sellingPrice.toString().replace(".", ",") : "0,00", service.profitMargin ? service.profitMargin.toString() : "0", service.costPrice ? service.costPrice.toString().replace(".", ",") : "0,00"]);
  }

  applyFilters(): void {
    this.page = 1;
    this.listServices();
  }

  clearFilters(): void {
    this.filterPeriod = "all";
    this.filterPriceRange = "all";
    this.search = "";
    this.page = 1;
    this.listServices();
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

  getFilterPriceRangeLabel(): string {
    switch (this.filterPriceRange) {
      case "low":
        return "Até R$ 100,00";
      case "medium":
        return "R$ 100,00 a R$ 300,00";
      case "high":
        return "Acima de R$ 300,00";
      default:
        return "Todos os preços";
    }
  }

  handleMoreInfo() {
    this.garageSystemService.handleMoreInfo();
  }

  handleUpgradePlan() {
    this.garageSystemService.handleUpgradePlan();
  }

  toggleServiceSelection(service: Service): void {
    const index = this.selectedServices.findIndex(s => s._id === service._id);
    if (index > -1) {
      this.selectedServices.splice(index, 1);
    } else {
      this.selectedServices.push(service);
    }
  }
}
