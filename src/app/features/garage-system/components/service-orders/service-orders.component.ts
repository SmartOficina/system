import { Component, OnInit, OnDestroy, ComponentRef } from "@angular/core";
import { HttpResponse } from "@angular/common/http";
import { FormsModule } from "@angular/forms";
import { Subject, takeUntil, debounceTime, distinctUntilChanged, Subscription } from "rxjs";
import { CommonModule, NgFor, NgIf, DatePipe, NgClass } from "@angular/common";
import { ServiceOrdersService } from "./service-orders.service";
import { ServiceOrder } from "@shared/models/models";
import { ModalService } from "@shared/services/modal.service";
import { InputGenericComponent } from "@shared/components/input-generic/input-generic.component";
import { ServiceOrderModalComponent } from "@shared/modals/service-order-modal/service-order-modal.component";
import { GenericTableComponent, TableColumn } from "@shared/components/generic-table/generic-table.component";
import { PaginationComponent } from "@shared/components/pagination/pagination.component";
import { AlertService } from "@shared/services/alert.service";
import { ClientModalComponent } from "@shared/modals/client-modal/client-modal.component";
import { ServiceOrderHistoryModalComponent } from "@shared/modals/service-order-history-modal/service-order-history-modal.component";
import { VehicleModalComponent } from "@shared/modals/vehicle-modal/vehicle-modal.component";
import { ServiceOrderStatusUtils } from "@shared/utils/service-order-status.utils";

import { PermissionHelperService, PermissionSet } from "@shared/services/permission-helper.service";
import { PermissionGuardComponent } from "@shared/components/permission-guard.component";
import { ToastService } from "@shared/services/toast.service";
import { ExportService } from "@shared/services/export.service";
import { PrintService } from "@shared/services/print.service";

@Component({
  selector: "app-service-orders",
  templateUrl: "./service-orders.component.html",
  styleUrls: ["./service-orders.component.scss"],
  standalone: true,
  // prettier-ignore
  imports: [
    CommonModule,
    FormsModule,
    NgIf,
    NgFor,
    NgClass,
    DatePipe,
    PaginationComponent,
    InputGenericComponent,
    GenericTableComponent,
    PermissionGuardComponent
  ],
})
export class ServiceOrdersComponent implements OnInit, OnDestroy {
  serviceOrders: ServiceOrder[] = [];
  selectedServiceOrders: ServiceOrder[] = [];
  search: string = "";
  page: number = 1;
  limit: number = 10;
  limitOptions: number[] = [5, 10, 25, 50, 100];
  totalPages: number = 0;
  totalServiceOrders: number = 0;
  isLoading: boolean = false;
  activeServiceOrderModalRef: ComponentRef<ServiceOrderModalComponent> | null = null;
  activeClientModalRef: ComponentRef<ClientModalComponent> | null = null;
  activeHistoryModalRef: ComponentRef<ServiceOrderHistoryModalComponent> | null = null;
  activeVehicleModalRef: ComponentRef<VehicleModalComponent> | null = null;
  Math = Math;
  searchTimeout: any;
  lastUpdate: Date = new Date();

  filterPeriod: string = "all";
  filterStatus: string = "all";
  sortOrder: string = "newest";

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  private subscriptions = new Subscription();
  private updateListTrigger$ = new Subject<void>();

  permissions: PermissionSet = {
    view: false,
    create: false,
    edit: false,
    delete: false,
  };

  statusOptions = ServiceOrderStatusUtils.statusOptions;

  serviceOrderColumns: TableColumn[] = [
    {
      header: "Nº OS",
      field: "orderNumber",
    },
    {
      header: "Abertura",
      field: "openingDate",
      isDate: true,
    },
    {
      header: "Status",
      field: "status",
      transform: (value: string) => {
        return ServiceOrderStatusUtils.getStatusLabel(value);
      },
    },
    {
      header: "Veículo",
      field: "vehicle",
      type: "vehicle-button",
      transform: (value: any, item: any) => {
        const plate = value?.licensePlate || "N/A";
        const brandModel = value?.brandModel || "N/A";
        return `${plate} - ${brandModel}`;
      },
    },
    {
      header: "Cliente",
      field: "client.fullName",
      type: "client-button",
      transform: (value: string, item: any) => {
        if (value) return value;
        if (item.vehicle && item.vehicle.client && item.vehicle.client.fullName) {
          return item.vehicle.client.fullName;
        }
        return "Cliente não associado";
      },
    },
    {
      header: "Histórico",
      field: "history",
      type: "history-button",
    },
    {
      header: "Ações",
      field: "actions",
      type: "print-actions",
    },
  ];

  // prettier-ignore
  constructor(
    private serviceOrdersService: ServiceOrdersService,
    private alertService: AlertService,
    private modalService: ModalService,
    private permissionHelper: PermissionHelperService,
    private toastService: ToastService,
    private exportService: ExportService,
    private printService: PrintService
  ) { }

  ngOnInit(): void {
    this.loadPermissions();

    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe(() => {
      this.page = 1;
      this.listServiceOrders();
    });

    this.updateListTrigger$.pipe(debounceTime(50), takeUntil(this.destroy$)).subscribe(() => {
      this.listServiceOrders();
    });

    this.listServiceOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.unsubscribe();
    this.listServiceOrders();
  }

  loadPermissions(): void {
    this.permissionHelper
      .getEntityPermissions("service-order")
      .pipe(takeUntil(this.destroy$))
      .subscribe((permissions) => {
        this.permissions = permissions;
      });
  }

  listServiceOrders(): void {
    this.isLoading = true;
    const numericLimit = Number(this.limit);
    const numericPage = Number(this.page);

    this.serviceOrdersService.listServiceOrders(this.search, numericLimit, numericPage, this.filterStatus, this.sortOrder, this.filterPeriod).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200) {
          this.serviceOrders = response.body?.result || [];
          this.totalPages = response.body?.totalPages || 0;
          this.totalServiceOrders = response.body?.totalItems || 0;
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
    this.searchSubject.next(this.search);
  }

  removeServiceOrder(id: string): void {
    if (!this.permissionHelper.checkPermission(this.permissions.delete, "excluir ordens de serviço")) {
      return;
    }

    this.alertService.showAlert("Confirmação", "Tem certeza que deseja excluir esta ordem de serviço?", "warning", "Excluir", "Cancelar").then((confirmed: boolean) => {
      if (confirmed) {
        this.isLoading = true;
        this.serviceOrdersService.removeServiceOrder(id).subscribe(
          (response: HttpResponse<any>) => {
            if (response.status === 200) {
              this.toastService.success("Sucesso", "Ordem de serviço removida com sucesso.");
              this.listServiceOrders();
              this.selectedServiceOrders = this.selectedServiceOrders.filter((order) => order._id !== id);
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

  changeLimit(): void {
    this.page = 1;
    this.listServiceOrders();
  }

  changeSortOrder(): void {
    this.page = 1;
    this.listServiceOrders();
  }

  refreshData(): void {
    this.selectedServiceOrders = [];
    this.listServiceOrders();
  }

  changePage(page: number): void {
    this.page = page;
    this.listServiceOrders();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  private openServiceOrderModal(data: any): void {
    this.activeServiceOrderModalRef = this.modalService.open(ServiceOrderModalComponent, {
      data,
      onClose: () => {
        this.activeServiceOrderModalRef = null;
        this.updateListTrigger$.next();
      },
    });

    this.activeServiceOrderModalRef.instance.serviceOrderUpdated.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateListTrigger$.next();
    });

    this.activeServiceOrderModalRef.instance.serviceOrderSaved.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.activeServiceOrderModalRef) {
        this.modalService.close(this.activeServiceOrderModalRef);
        this.activeServiceOrderModalRef = null;
      }
    });
  }

  openCreateModal(): void {
    if (!this.permissionHelper.checkPermission(this.permissions.create, "cadastrar ordens de serviço")) {
      return;
    }
    this.openServiceOrderModal({ serviceOrder: null, readonly: false });
  }

  openEditModal(serviceOrder: ServiceOrder): void {
    if (!this.permissionHelper.checkPermission(this.permissions.edit, "editar ordens de serviço")) {
      return;
    }
    this.openServiceOrderModal({ serviceOrder: { ...serviceOrder }, readonly: false });
  }

  openViewModal(serviceOrder: ServiceOrder): void {
    this.openServiceOrderModal({ serviceOrder: { ...serviceOrder }, readonly: true });
  }

  viewClient(serviceOrder: ServiceOrder): void {
    if (serviceOrder.client) {
      this.activeClientModalRef = this.modalService.open(ClientModalComponent, {
        data: {
          client: { ...serviceOrder.client },
          readonly: true,
        },
        onClose: () => {
          this.activeClientModalRef = null;
        },
      });
    } else if (serviceOrder.vehicle && serviceOrder.vehicle.client) {
      this.activeClientModalRef = this.modalService.open(ClientModalComponent, {
        data: {
          client: { ...serviceOrder.vehicle.client },
          readonly: true,
        },
        onClose: () => {
          this.activeClientModalRef = null;
        },
      });
    } else {
      this.alertService.showAlert("Informação", "Não há cliente associado a esta ordem de serviço.", "info", "Fechar");
    }
  }

  showServiceOrderHistory(serviceOrder: ServiceOrder): void {
    if (!serviceOrder.statusHistory || serviceOrder.statusHistory.length === 0) {
      this.alertService.showAlert("Informação", "Esta ordem de serviço não possui histórico.", "info", "Fechar");
      return;
    }

    const serviceOrderInfo = {
      orderNumber: serviceOrder.orderNumber,
      vehicle: serviceOrder.vehicle,
    };

    this.activeHistoryModalRef = this.modalService.open(ServiceOrderHistoryModalComponent, {
      data: {
        serviceOrderHistory: serviceOrder.statusHistory,
        serviceOrderInfo: serviceOrderInfo,
        isLoading: false,
      },
      onClose: () => {
        this.activeHistoryModalRef = null;
      },
    });

    this.activeHistoryModalRef.instance.closeModalEvent.subscribe(() => {
      this.modalService.close(this.activeHistoryModalRef!);
      this.activeHistoryModalRef = null;
    });
  }

  viewVehicle(serviceOrder: ServiceOrder): void {
    const vehicleWithClient = {
      ...serviceOrder.vehicle,
      client: serviceOrder.client,
    };

    this.activeVehicleModalRef = this.modalService.open(VehicleModalComponent, {
      data: {
        vehicle: vehicleWithClient,
        readonly: true,
      },
      onClose: () => {
        this.activeVehicleModalRef = null;
      },
    });

    this.activeVehicleModalRef.instance.vehicleSaved.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.listServiceOrders();
      this.modalService.close(this.activeVehicleModalRef!);
      this.activeVehicleModalRef = null;
    });

    this.activeVehicleModalRef.instance.closeModalEvent.subscribe(() => {
      this.modalService.close(this.activeVehicleModalRef!);
      this.activeVehicleModalRef = null;
    });
  }

  applyFilters(): void {
    this.page = 1;
    this.listServiceOrders();
  }

  clearFilters(): void {
    this.filterPeriod = "all";
    this.filterStatus = "all";
    this.search = "";
    this.page = 1;
    this.listServiceOrders();
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

  getStatusLabel(status: string): string {
    return ServiceOrderStatusUtils.getStatusLabel(status);
  }

  clearSelection(): void {
    this.selectedServiceOrders = [];
  }

  removeSelectedOrders(): void {
    if (!this.permissionHelper.checkPermission(this.permissions.delete, "excluir ordens de serviço")) {
      return;
    }

    if (this.selectedServiceOrders.length === 0) {
      return;
    }

    this.alertService.showAlert("Confirmação", `Tem certeza que deseja excluir ${this.selectedServiceOrders.length} ordem(ns) de serviço selecionada(s)?`, "warning", "Excluir", "Cancelar").then((confirmed: boolean) => {
      if (confirmed) {
        this.isLoading = true;

        const deletePromises = this.selectedServiceOrders.map((order: any) => {
          return new Promise<void>((resolve, reject) => {
            this.serviceOrdersService
              .removeServiceOrder(order._id)
              .pipe(takeUntil(this.destroy$))
              .subscribe(
                () => resolve(),
                (error) => reject(error)
              );
          });
        });

        Promise.all(deletePromises)
          .then(() => {
            this.toastService.success("Sucesso", `${this.selectedServiceOrders.length} ordem(ns) de serviço removida(s) com sucesso.`);
            this.selectedServiceOrders = [];
            this.listServiceOrders();
          })
          .catch(() => {
            this.listServiceOrders();
          })
          .finally(() => {
            this.isLoading = false;
          });
      }
    });
  }

  exportSelectedOrders(): void {
    if (this.selectedServiceOrders.length === 0) {
      return;
    }

    const headers = ["Nº OS", "Status", "Placa", "Cliente", "Veículo", "Data de Abertura"];

    this.exportService.exportToCsv(this.selectedServiceOrders, headers, "ordens_servico_exportadas", (order) => [order.orderNumber || "", this.getStatusLabel(order.status) || "", order.vehicle?.licensePlate || "", order.client?.fullName || order.vehicle?.client?.fullName || "", order.vehicle?.brandModel || "", order.openingDate ? new Date(order.openingDate).toLocaleDateString() : ""]);
  }

  printServiceOrder(serviceOrder: ServiceOrder): void {
    this.printService.printServiceOrder(serviceOrder);
  }

  printSelectedOrders(): void {
    if (this.selectedServiceOrders.length === 0) {
      this.alertService.showAlert("Aviso", "Selecione pelo menos uma ordem de serviço para imprimir.", "warning", "OK");
      return;
    }

    this.printService.printMultipleServiceOrders(this.selectedServiceOrders);
  }

  toggleServiceOrderSelection(serviceOrder: ServiceOrder): void {
    const index = this.selectedServiceOrders.findIndex(so => so._id === serviceOrder._id);
    if (index > -1) {
      this.selectedServiceOrders.splice(index, 1);
    } else {
      this.selectedServiceOrders.push(serviceOrder);
    }
  }

  getWhatsAppLink(phone: string | undefined): string {
    if (!phone) return '#';
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/55${cleanPhone}`;
  }
}
