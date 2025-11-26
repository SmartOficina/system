import { Component, OnInit, OnDestroy } from "@angular/core";
import { HttpResponse } from "@angular/common/http";
import { FormsModule } from "@angular/forms";
import { VehiclesService } from "./vehicles.service";
import { NgFor, NgIf, DatePipe } from "@angular/common";
import { ComponentRef } from "@angular/core";
import { Vehicle } from "@shared/models/models";
import { ModalService } from "@shared/services/modal.service";
import { InputGenericComponent } from "@shared/components/input-generic/input-generic.component";
import { VehicleModalComponent } from "@shared/modals/vehicle-modal/vehicle-modal.component";
import { GenericTableComponent, TableColumn } from "@shared/components/generic-table/generic-table.component";
import { PaginationComponent } from "@shared/components/pagination/pagination.component";
import { AlertService } from "@shared/services/alert.service";
import { Subject, takeUntil, debounceTime, distinctUntilChanged, Subscription } from "rxjs";
import { ClientModalComponent } from "@shared/modals/client-modal/client-modal.component";
import { VehicleHistoryModalComponent } from "@shared/modals/vehicle-history-modal/vehicle-history-modal.component";
import { PermissionHelperService, PermissionSet } from "@shared/services/permission-helper.service";
import { PermissionGuardComponent } from "@shared/components/permission-guard.component";
import { ToastService } from "@shared/services/toast.service";
import { ExportService } from "@shared/services/export.service";

@Component({
  selector: "app-vehicles",
  templateUrl: "./vehicles.component.html",
  styleUrls: ["./vehicles.component.scss"],
  // prettier-ignore
  imports: [
    FormsModule,
    NgIf,
    NgFor,
    DatePipe,
    PaginationComponent,
    InputGenericComponent,
    PermissionGuardComponent,
    GenericTableComponent
  ],
  standalone: true,
})
export class VehiclesComponent implements OnInit, OnDestroy {
  vehicles: Vehicle[] = [];
  selectedVehicles: Vehicle[] = [];
  search: string = "";
  page: number = 1;
  limit: number = 10;
  limitOptions: number[] = [5, 10, 25, 50, 100];
  totalPages: number = 0;
  totalVehicles: number = 0;
  isLoading: boolean = false;
  activeVehicleModalRef: ComponentRef<VehicleModalComponent> | null = null;
  activeClientModalRef: ComponentRef<ClientModalComponent> | null = null;
  activeHistoryModalRef: ComponentRef<VehicleHistoryModalComponent> | null = null;
  lastUpdate: Date = new Date();
  sortOrder: string = "newest";

  filterPeriod: string = "all";
  inGarage: boolean = false;
  inGarageFilter: string = "false";

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  private subscriptions = new Subscription();

  permissions: PermissionSet = {
    view: false,
    create: false,
    edit: false,
    delete: false,
  };

  vehicleColumns: TableColumn[] = [
    { header: "Placa", field: "licensePlate" },
    { header: "Marca/Modelo", field: "brandModel" },
    {
      header: "Cliente",
      field: "client.fullName",
      type: "client-button",
      transform: (value: any, item: any) => {
        return value || "Cliente não associado";
      },
    },
    { header: "Celular", field: "client.phone", type: "whatsapp-phone" },
    {
      header: "Histórico",
      field: "history",
      type: "history-button",
    },
    { header: "Ações", field: "actions" },
  ];

  // prettier-ignore
  constructor(
    private vehiclesService: VehiclesService,
    private alertService: AlertService,
    private modalService: ModalService,
    private permissionHelper: PermissionHelperService,
    private toastService: ToastService,
    private exportService: ExportService
  ) { }

  ngOnInit(): void {
    this.loadPermissions();

    this.subscriptions.add(
      this.searchSubject.pipe(debounceTime(500), distinctUntilChanged()).subscribe(() => {
        this.page = 1;
        this.listVehicles();
      })
    );

    this.listVehicles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.unsubscribe();
  }

  loadPermissions(): void {
    this.permissionHelper
      .getEntityPermissions("vehicle")
      .pipe(takeUntil(this.destroy$))
      .subscribe((permissions) => {
        this.permissions = permissions;
      });
  }

  listVehicles(): void {
    this.isLoading = true;
    const numericLimit = Number(this.limit);
    const numericPage = Number(this.page);

    this.vehiclesService
      .listVehicles(this.search, numericLimit, numericPage, this.sortOrder, this.filterPeriod, this.inGarage)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: HttpResponse<any>) => {
          if (response.status === 200) {
            this.vehicles = response.body?.result || [];
            this.totalPages = response.body?.totalPages || 0;
            this.totalVehicles = response.body?.totalItems || 0;
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

  removeVehicle(id: string): void {
    if (!this.permissionHelper.checkPermission(this.permissions.delete, "excluir veículos")) {
      return;
    }

    this.alertService.showAlert("Confirmação", "Tem certeza que deseja excluir este veículo?", "warning", "Excluir", "Cancelar").then((confirmed: boolean) => {
      if (confirmed) {
        this.isLoading = true;
        this.vehiclesService
          .removeVehicle(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe(
            (response: HttpResponse<any>) => {
              if (response.status === 200) {
                this.toastService.success("Sucesso", "Veículo removido com sucesso.");
                this.listVehicles();
                this.selectedVehicles = [];
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
    this.limit = Number(this.limit);
    this.listVehicles();
  }

  changeSortOrder(): void {
    this.page = 1;
    this.listVehicles();
  }

  refreshData(): void {
    this.selectedVehicles = [];
    this.listVehicles();
  }

  changePage(page: number): void {
    this.page = Number(page);
    this.listVehicles();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  openCreateModal(): void {
    if (!this.permissionHelper.checkPermission(this.permissions.create, "cadastrar veículos")) {
      return;
    }

    this.activeVehicleModalRef = this.modalService.open(VehicleModalComponent, {
      data: {
        vehicle: null,
      },
      onClose: () => {
        this.activeVehicleModalRef = null;
      },
    });

    this.activeVehicleModalRef.instance.vehicleSaved.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.listVehicles();
      this.modalService.close(this.activeVehicleModalRef!);
      this.activeVehicleModalRef = null;
    });
  }

  openEditModal(vehicle: Vehicle): void {
    if (!this.permissionHelper.checkPermission(this.permissions.edit, "editar veículos")) {
      return;
    }

    this.activeVehicleModalRef = this.modalService.open(VehicleModalComponent, {
      data: {
        vehicle: { ...vehicle },
      },
      onClose: () => {
        this.activeVehicleModalRef = null;
      },
    });

    this.activeVehicleModalRef.instance.vehicleSaved.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.listVehicles();
      this.modalService.close(this.activeVehicleModalRef!);
      this.activeVehicleModalRef = null;
    });
  }

  openViewModal(vehicle: Vehicle): void {
    this.activeVehicleModalRef = this.modalService.open(VehicleModalComponent, {
      data: {
        vehicle: { ...vehicle },
        readonly: true,
      },
      onClose: () => {
        this.activeVehicleModalRef = null;
      },
    });

    this.activeVehicleModalRef.instance.vehicleSaved.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.listVehicles();
      this.modalService.close(this.activeVehicleModalRef!);
      this.activeVehicleModalRef = null;
    });
  }

  viewClient(vehicle: Vehicle): void {
    if (vehicle.client) {
      this.activeClientModalRef = this.modalService.open(ClientModalComponent, {
        data: {
          client: { ...vehicle.client },
          readonly: true,
        },
        onClose: () => {
          this.activeClientModalRef = null;
        },
      });
      this.activeClientModalRef.instance.clientSaved.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.listVehicles();
      });
    }
  }

  showVehicleHistory(vehicle: Vehicle): void {
    if (!vehicle._id) return;

    this.isLoading = true;
    this.vehiclesService
      .getVehicleHistory(vehicle._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: HttpResponse<any>) => {
          this.isLoading = false;
          if (response.status === 200 && response.body?.result) {
            const historyData = response.body.result;

            this.activeHistoryModalRef = this.modalService.open(VehicleHistoryModalComponent, {
              data: {
                vehicleHistory: historyData,
                vehicleInfo: {
                  licensePlate: vehicle.licensePlate,
                  brandModel: vehicle.brandModel,
                },
              },
              onClose: () => {
                this.activeHistoryModalRef = null;
              },
            });

            this.activeHistoryModalRef.instance.closeModalEvent.pipe(takeUntil(this.destroy$)).subscribe(() => {
              this.modalService.close(this.activeHistoryModalRef!);
              this.activeHistoryModalRef = null;
            });
          } else {
            this.alertService.showAlert("Informação", "Este veículo não possui histórico de serviços.", "info", "Fechar");
          }
        },
        (error) => {
          this.isLoading = false;
          this.alertService.showAlert("Erro", "Não foi possível carregar o histórico do veículo.", "error", "Fechar");
        }
      );
  }

  applyFilters(): void {
    this.page = 1;
    this.listVehicles();
  }

  clearFilters(): void {
    this.filterPeriod = "all";
    this.search = "";
    this.inGarage = false;
    this.inGarageFilter = "false";
    this.page = 1;
    this.listVehicles();
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

  clearSelection(): void {
    this.selectedVehicles = [];
  }

  removeSelectedVehicles(): void {
    if (!this.permissionHelper.checkPermission(this.permissions.delete, "excluir veículos")) {
      return;
    }

    if (this.selectedVehicles.length === 0) {
      return;
    }

    this.alertService.showAlert("Confirmação", `Tem certeza que deseja excluir ${this.selectedVehicles.length} veículo(s) selecionado(s)?`, "warning", "Excluir", "Cancelar").then((confirmed: boolean) => {
      if (confirmed) {
        this.isLoading = true;

        const deletePromises = this.selectedVehicles.map((vehicle: any) => {
          return new Promise<void>((resolve, reject) => {
            this.vehiclesService
              .removeVehicle(vehicle._id)
              .pipe(takeUntil(this.destroy$))
              .subscribe(
                () => resolve(),
                (error) => reject(error)
              );
          });
        });

        Promise.all(deletePromises)
          .then(() => {
            this.toastService.success("Sucesso", `${this.selectedVehicles.length} veículo(s) removido(s) com sucesso.`);
            this.selectedVehicles = [];
            this.listVehicles();
          })
          .catch(() => {
            this.listVehicles();
          })
          .finally(() => {
            this.isLoading = false;
          });
      }
    });
  }

  exportSelectedVehicles(): void {
    if (this.selectedVehicles.length === 0) {
      return;
    }

    const headers = ["Placa", "Marca/Modelo", "Ano", "Cor", "Chassi", "Cliente", "Telefone"];

    this.exportService.exportToCsv(this.selectedVehicles, headers, "veiculos_exportados", (vehicle) => [vehicle.licensePlate || "", vehicle.brandModel || "", vehicle.yearOfManufacture?.toString() || "", vehicle.color || "", vehicle.chassisNumber || "", vehicle.client?.fullName || "Sem cliente", vehicle.client?.phone || ""]);
  }

  onInGarageFilterChange(): void {
    this.inGarage = this.inGarageFilter === "true";
    this.applyFilters();
  }

  // Método para seleção individual em mobile
  toggleVehicleSelection(vehicle: Vehicle): void {
    const index = this.selectedVehicles.findIndex(v => v._id === vehicle._id);
    if (index > -1) {
      this.selectedVehicles.splice(index, 1);
    } else {
      this.selectedVehicles.push(vehicle);
    }
  }

  // Método para gerar link do WhatsApp
  getWhatsAppLink(phone: string | undefined): string {
    if (!phone) return '#';
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/55${cleanPhone}`;
  }
}
