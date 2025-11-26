import { GarageSystemService } from "./../../garage-system.service";
import { Component, OnInit, ComponentRef, OnDestroy } from "@angular/core";
import { HttpResponse } from "@angular/common/http";
import { FormsModule } from "@angular/forms";
import { ClientsService } from "./clients.service";
import { NgIf, NgFor, DatePipe } from "@angular/common";
import { ClientModalComponent } from "@shared/modals/client-modal/client-modal.component";
import { AlertService } from "@shared/services/alert.service";
import { Client } from "@shared/models/models";
import { ModalService } from "@shared/services/modal.service";
import { InputGenericComponent } from "@shared/components/input-generic/input-generic.component";
import { PaginationComponent } from "@shared/components/pagination/pagination.component";
import { GenericTableComponent, TableColumn } from "@shared/components/generic-table/generic-table.component";
import { Subject, takeUntil, debounceTime, distinctUntilChanged, Subscription } from "rxjs";
import { ClientVehiclesModalComponent } from "@shared/modals/client-vehicles-modal/client-vehicles-modal.component";
import { PermissionHelperService, PermissionSet } from "@shared/services/permission-helper.service";
import { PermissionGuardComponent } from "@shared/components/permission-guard.component";
import { ToastService } from "@shared/services/toast.service";
import { ExportService } from "@shared/services/export.service";

@Component({
  selector: "app-clients",
  templateUrl: "./clients.component.html",
  styleUrls: ["./clients.component.scss"],
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
export class ClientsComponent implements OnInit, OnDestroy {
  clients: Client[] = [];
  selectedClients: Client[] = [];
  search: string = "";
  page: number = 1;
  limit: number = 10;
  limitOptions: number[] = [5, 10, 25, 50, 100];
  totalPages: number = 0;
  totalClients: number = 0;
  isLoading: boolean = false;
  activeClientModalRef: ComponentRef<ClientModalComponent> | null = null;
  activeVehiclesModalRef: ComponentRef<ClientVehiclesModalComponent> | null = null;
  lastUpdate: Date = new Date();
  sortOrder: string = "newest";

  filterPeriod: string = "all";
  filterVehicleStatus: string = "all";

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  private subscriptions = new Subscription();

  permissions: PermissionSet = {
    view: false,
    create: false,
    edit: false,
    delete: false,
  };

  clientColumns: TableColumn[] = [
    { header: "Nome", field: "fullName" },
    { header: "Celular", field: "phone", type: "whatsapp-phone" },
    { header: "Veículos", field: "vehicles", hasVehicles: true },
    { header: "Cadastro", field: "createdAt", isDate: true },
    { header: "Ações", field: "actions" },
  ];

  // prettier-ignore
  constructor(
    private clientsService: ClientsService,
    private alertService: AlertService,
    private toastService: ToastService,
    private modalService: ModalService,
    private permissionHelper: PermissionHelperService,
    private garageSystemService: GarageSystemService,
    private exportService: ExportService
  ) { }

  ngOnInit(): void {
    this.loadPermissions();
    this.subscriptions.add(
      this.searchSubject.pipe(debounceTime(500), distinctUntilChanged()).subscribe(() => {
        this.page = 1;
        this.listClients();
      })
    );

    this.listClients();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.unsubscribe();
  }

  loadPermissions(): void {
    this.permissionHelper
      .getEntityPermissions("client")
      .pipe(takeUntil(this.destroy$))
      .subscribe((permissions) => {
        this.permissions = permissions;
      });
  }

  listClients(): void {
    this.isLoading = true;
    const numericLimit = Number(this.limit);
    const numericPage = Number(this.page);

    this.clientsService
      .listClients(this.search, numericLimit, numericPage, this.sortOrder, this.filterPeriod, this.filterVehicleStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response: HttpResponse<any>) => {
          if (response.status === 200) {
            this.clients = response.body?.result || [];
            this.totalPages = response.body?.totalPages || 0;
            this.totalClients = response.body?.totalItems || 0;
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

  removeClient(id: string): void {
    if (!this.permissionHelper.checkPermission(this.permissions.delete, "excluir clientes")) {
      return;
    }

    this.alertService.showAlert("Confirmação", "Tem certeza que deseja excluir este cliente?", "warning", "Excluir", "Cancelar").then((confirmed: boolean) => {
      if (confirmed) {
        this.isLoading = true;
        this.clientsService
          .removeClient(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe(
            (response: HttpResponse<any>) => {
              if (response.status === 200) {
                this.toastService.success("Sucesso", "Cliente removido com sucesso.");
                this.listClients();
                this.selectedClients = [];
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
    this.page = Number(page);
    this.listClients();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  changeLimit(): void {
    this.page = 1;
    this.limit = Number(this.limit);
    this.listClients();
  }

  changeSortOrder(): void {
    this.page = 1;
    this.listClients();
  }

  refreshData(): void {
    this.selectedClients = [];
    this.listClients();
  }

  openCreateModal(): void {
    if (!this.permissionHelper.checkPermission(this.permissions.create, "cadastrar clientes")) {
      return;
    }

    this.activeClientModalRef = this.modalService.open(ClientModalComponent, {
      data: {
        client: null,
      },
      onClose: () => {
        this.activeClientModalRef = null;
      },
    });

    this.activeClientModalRef.instance.clientSaved.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.listClients();
      this.modalService.close(this.activeClientModalRef!);
      this.activeClientModalRef = null;
    });

    this.activeClientModalRef.instance.photoChanged.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.listClients();
    });
  }

  openEditModal(client: Client): void {
    if (!this.permissionHelper.checkPermission(this.permissions.edit, "editar clientes")) {
      return;
    }

    this.activeClientModalRef = this.modalService.open(ClientModalComponent, {
      data: {
        client: { ...client },
      },
      onClose: () => {
        this.activeClientModalRef = null;
      },
    });

    this.activeClientModalRef.instance.clientSaved.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.listClients();
      this.modalService.close(this.activeClientModalRef!);
      this.activeClientModalRef = null;
    });

    this.activeClientModalRef.instance.photoChanged.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.listClients();
    });
  }

  openViewModal(client: Client): void {
    this.activeClientModalRef = this.modalService.open(ClientModalComponent, {
      data: {
        client: { ...client },
        readonly: true,
      },
      onClose: () => {
        this.activeClientModalRef = null;
      },
    });

    this.activeClientModalRef.instance.clientSaved.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.listClients();
      this.modalService.close(this.activeClientModalRef!);
      this.activeClientModalRef = null;
    });

    this.activeClientModalRef.instance.photoChanged.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.listClients();
    });
  }

  viewVehicles(client: Client): void {
    if (client.vehicles && client.vehicles.length > 0) {
      this.activeVehiclesModalRef = this.modalService.open(ClientVehiclesModalComponent, {
        data: {
          vehicles: client.vehicles,
          clientName: client.fullName,
        },
        onClose: () => {
          this.activeVehiclesModalRef = null;
        },
      });

      this.activeVehiclesModalRef.instance.closeModalEvent.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.modalService.close(this.activeVehiclesModalRef!);
        this.activeVehiclesModalRef = null;
      });
    }
  }

  handleMoreInfo() {
    this.garageSystemService.handleMoreInfo();
  }

  handleUpgradePlan() {
    this.garageSystemService.handleUpgradePlan();
  }

  applyFilters(): void {
    this.page = 1;
    this.listClients();
  }

  clearFilters(): void {
    this.filterPeriod = "all";
    this.filterVehicleStatus = "all";
    this.search = "";
    this.page = 1;
    this.listClients();
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
    this.selectedClients = [];
  }

  removeSelectedClients(): void {
    if (!this.permissionHelper.checkPermission(this.permissions.delete, "excluir clientes")) {
      return;
    }

    if (this.selectedClients.length === 0) {
      return;
    }

    this.alertService.showAlert("Confirmação", `Tem certeza que deseja excluir ${this.selectedClients.length} cliente(s) selecionado(s)?`, "warning", "Excluir", "Cancelar").then((confirmed: boolean) => {
      if (confirmed) {
        this.isLoading = true;

        const deletePromises = this.selectedClients.map((client: any) => {
          return new Promise<void>((resolve, reject) => {
            this.clientsService
              .removeClient(client._id)
              .pipe(takeUntil(this.destroy$))
              .subscribe(
                () => resolve(),
                (error) => reject(error)
              );
          });
        });

        Promise.all(deletePromises)
          .then(() => {
            this.toastService.success("Sucesso", `${this.selectedClients.length} cliente(s) removido(s) com sucesso.`);
            this.selectedClients = [];
            this.listClients();
          })
          .catch(() => {
            this.listClients();
          })
          .finally(() => {
            this.isLoading = false;
          });
      }
    });
  }

  exportSelectedClients(): void {
    if (this.selectedClients.length === 0) {
      return;
    }

    const headers = ["Nome", "Telefone", "Email", "CPF/CNPJ", "Data de Cadastro", "Veículos"];

    this.exportService.exportToCsv(this.selectedClients, headers, "clientes_exportados", (client) => [client.fullName || "", client.phone || "", client.email || "", client.cpfCnpj || "", client.createdAt ? new Date(client.createdAt).toLocaleDateString() : "", client.vehicles ? client.vehicles.length.toString() : "0"]);
  }

  // Método para seleção individual em mobile
  toggleClientSelection(client: Client): void {
    const index = this.selectedClients.findIndex(c => c._id === client._id);
    if (index > -1) {
      this.selectedClients.splice(index, 1);
    } else {
      this.selectedClients.push(client);
    }
  }

  // Método para gerar link do WhatsApp
  getWhatsAppLink(phone: string | undefined): string {
    if (!phone) return '#';
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/55${cleanPhone}`;
  }
}
