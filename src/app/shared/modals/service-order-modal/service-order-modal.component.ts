import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild, ElementRef } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { HttpResponse } from "@angular/common/http";
import { trigger, transition, style, animate } from "@angular/animations";
import { BudgetApprovalService } from "@features/garage-system/components/budget-approval/budget-approval.service";
import { ServiceOrdersService } from "@features/garage-system/components/service-orders/service-orders.service";
import { ToastService } from "@shared/services/toast.service";
import { ServiceOrderCompletionComponent } from "@shared/components/service-order/service-order-completion/service-order-completion.component";
import { ServiceOrderDiagnosisComponent } from "@shared/components/service-order/service-order-diagnosis/service-order-diagnosis.component";
import { ServiceOrderExecutionComponent } from "@shared/components/service-order/service-order-execution/service-order-execution.component";
import { ServiceOrderOpeningComponent } from "@shared/components/service-order/service-order-opening/service-order-opening.component";
import { ServiceOrderStepperComponent } from "@shared/components/service-order/service-order-stepper/service-order-stepper.component";
import { ServiceOrder, ServiceOrderStatus, PaymentMethod, ChecklistItem, PartItem, ServiceItem } from "@shared/models/models";
import { AlertService } from "@shared/services/alert.service";
import { CurrencyUtils } from "@shared/utils/currency-utils";
import { DateUtils } from "@shared/utils/date-utils";
import { ServiceOrderStatusUtils } from "@shared/utils/service-order-status.utils";

@Component({
  selector: "app-service-order-modal",
  templateUrl: "./service-order-modal.component.html",
  styleUrls: ["./service-order-modal.component.scss"],
  // prettier-ignore
  imports: [
    FormsModule,
    CommonModule,
    ServiceOrderOpeningComponent,
    ServiceOrderDiagnosisComponent,
    ServiceOrderExecutionComponent,
    ServiceOrderCompletionComponent,
    ServiceOrderStepperComponent
  ],
  // prettier-ignore
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ opacity: 0, height: '0' }),
        animate('300ms ease-in', style({ opacity: 1, height: '*' }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0, height: '0' }))
      ])
    ])
  ],
})
export class ServiceOrderModalComponent implements OnInit, OnChanges {
  @Input() serviceOrder: ServiceOrder | null = null;
  @Input() readonly: boolean = false;
  @Output() closeModalEvent: EventEmitter<void> = new EventEmitter<void>();
  @Output() serviceOrderSaved: EventEmitter<ServiceOrder> = new EventEmitter<ServiceOrder>();
  @Output() serviceOrderUpdated: EventEmitter<ServiceOrder> = new EventEmitter<ServiceOrder>();

  @ViewChild(ServiceOrderOpeningComponent) openingComponent!: ServiceOrderOpeningComponent;
  @ViewChild(ServiceOrderDiagnosisComponent) diagnosisComponent!: ServiceOrderDiagnosisComponent;
  @ViewChild("modalContainer") modalContainer!: ElementRef;

  ServiceOrderStatus = ServiceOrderStatus;
  PaymentMethod = PaymentMethod;
  formatCurrency = CurrencyUtils.formatCurrency;
  formatCurrencyWithPrefix = CurrencyUtils.formatCurrencyWithPrefix;

  serviceOrderData: ServiceOrder = this.getEmptyServiceOrder();
  selectedVehiclePlate: string = "";
  selectedTab: string = "general";
  isLoading: boolean = false;
  selectedClientName: string = "";
  budgetModified: boolean = false;
  statusOptions = ServiceOrderStatusUtils.statusOptions.filter((option) => option.value !== "");
  approvalLink: string = "";

  // prettier-ignore
  defaultEntryChecklist: ChecklistItem[] = [
    { description: 'Faróis', checked: false },
    { description: 'Lanternas', checked: false },
    { description: 'Para-brisa', checked: false },
    { description: 'Vidros', checked: false },
    { description: 'Retrovisores', checked: false },
    { description: 'Pintura', checked: false },
    { description: 'Pneus', checked: false },
    { description: 'Interior', checked: false },
    { description: 'Bancos', checked: false },
    { description: 'Painel', checked: false },
    { description: 'Estepe', checked: false },
    { description: 'Ferramentas', checked: false }
  ];

  // prettier-ignore
  constructor(
    private serviceOrdersService: ServiceOrdersService,
    private alertService: AlertService,
    private budgetApprovalService: BudgetApprovalService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    if (this.serviceOrder) {
      this.loadServiceOrderData();
    } else {
      this.serviceOrderData.entryChecklist = [...this.defaultEntryChecklist];
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["serviceOrder"] && changes["serviceOrder"].currentValue) {
      this.loadServiceOrderData();
    } else if (changes["serviceOrder"] && !changes["serviceOrder"].currentValue) {
      this.resetServiceOrderData();
    }
  }

  private getEmptyServiceOrder(): ServiceOrder {
    return {
      vehicleId: "",
      openingDate: new Date().toISOString().split("T")[0],
      currentMileage: 0,
      reportedProblem: "",
      entryChecklist: [],
      fuelLevel: 50,
      visibleDamages: [],
      status: ServiceOrderStatus.OPENED,
      requiredParts: [],
      services: [],
      estimatedTotalParts: 0,
      estimatedTotalServices: 0,
      estimatedTotal: 0,
      identifiedProblems: [],
      statusHistory: [],
    };
  }

  private loadServiceOrderData(): void {
    this.serviceOrderData = { ...this.serviceOrder } as ServiceOrder;

    if (this.serviceOrderData.openingDate) {
      this.serviceOrderData.openingDate = DateUtils.toInputFormat(this.serviceOrderData.openingDate);
    }

    if (this.serviceOrderData.estimatedCompletionDate) {
      this.serviceOrderData.estimatedCompletionDate = DateUtils.toInputFormat(this.serviceOrderData.estimatedCompletionDate);
    }

    if (!this.serviceOrderData.entryChecklist) {
      this.serviceOrderData.entryChecklist = [...this.defaultEntryChecklist];
    }
    if (!this.serviceOrderData.requiredParts) {
      this.serviceOrderData.requiredParts = [];
    }
    if (!this.serviceOrderData.services) {
      this.serviceOrderData.services = [];
    }
    if (!this.serviceOrderData.visibleDamages) {
      this.serviceOrderData.visibleDamages = [];
    }
    if (!this.serviceOrderData.statusHistory) {
      this.serviceOrderData.statusHistory = [];
    }

    if (this.serviceOrder) {
      if (this.serviceOrder.vehicle) {
        this.selectedVehiclePlate = this.serviceOrder.vehicle.licensePlate || "";
      }

      if (this.serviceOrder.client && this.serviceOrder.client.fullName) {
        this.selectedClientName = this.serviceOrder.client.fullName;
      } else if (this.serviceOrder.vehicle && this.serviceOrder.vehicle.client && this.serviceOrder.vehicle.client.fullName) {
        this.selectedClientName = this.serviceOrder.vehicle.client.fullName;
      } else if (this.serviceOrder.client && typeof this.serviceOrder.client === "object") {
        const clientObject = this.serviceOrder.client as any;
        if (clientObject._id && clientObject.fullName) {
          this.selectedClientName = clientObject.fullName;
        }
      }
    }

    this.setInitialTab();
    this.budgetModified = false;

    if (this.serviceOrderData.status === ServiceOrderStatus.WAITING_APPROVAL) {
      this.generateApprovalLink();
    } else {
      this.approvalLink = "";
    }
  }

  private setInitialTab(): void {
    if (this.readonly) {
      this.selectedTab = "general";
      return;
    }

    switch (this.serviceOrderData.status) {
      case ServiceOrderStatus.OPENED:
        this.selectedTab = "general";
        break;
      case ServiceOrderStatus.DIAGNOSING:
      case ServiceOrderStatus.WAITING_APPROVAL:
      case ServiceOrderStatus.REJECTED:
        this.selectedTab = "diagnosis";
        break;
      case ServiceOrderStatus.APPROVED:
      case ServiceOrderStatus.IN_PROGRESS:
      case ServiceOrderStatus.WAITING_PARTS:
        this.selectedTab = "execution";
        break;
      case ServiceOrderStatus.COMPLETED:
      case ServiceOrderStatus.DELIVERED:
        this.selectedTab = "completion";
        break;
      default:
        this.selectedTab = "general";
    }
  }

  private resetServiceOrderData(): void {
    this.serviceOrderData = this.getEmptyServiceOrder();
    this.serviceOrderData.entryChecklist = [...this.defaultEntryChecklist];
    this.selectedVehiclePlate = "";
    this.selectedTab = "general";
    this.budgetModified = false;
    this.approvalLink = "";
  }

  scrollToTop(): void {
    setTimeout(() => {
      const modalElement = document.querySelector(".modal-content");
      if (modalElement) {
        modalElement.scrollTop = 0;
      }
      window.scrollTo(0, 0);
    }, 100);
  }

  changeTab(tab: string): void {
    this.selectedTab = tab;
    this.scrollToTop();
  }

  getStatusLabel(status: string): string {
    return ServiceOrderStatusUtils.getStatusLabel(status);
  }

  getStatusColorClass(status: string): string {
    return ServiceOrderStatusUtils.getStatusClass(status);
  }

  onVehicleSelected(vehicleData: any): void {
    if (this.readonly) return;

    this.serviceOrderData.vehicleId = vehicleData.vehicleId;
    this.selectedVehiclePlate = vehicleData.licensePlate;
    this.selectedClientName = vehicleData.clientName || "";
  }

  onBudgetModified(): void {
    this.budgetModified = true;
  }

  onShareMethodSelected(event: { method: string; recipient: string }): void {
  }

  shouldShowGenerateBudgetButton(): boolean {
    return this.serviceOrderData.status === ServiceOrderStatus.DIAGNOSING || this.serviceOrderData.status === ServiceOrderStatus.REJECTED || this.budgetModified;
  }

  updateStatus(event: { status: string; notes: string }): void {
    if (this.readonly || !this.serviceOrderData._id) return;

    this.isLoading = true;
    this.serviceOrdersService.updateServiceOrderStatus(this.serviceOrderData._id, event.status, event.notes).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200) {
          this.serviceOrderData = response.body?.result;
          this.setInitialTab();
          this.serviceOrderUpdated.emit(this.serviceOrderData);
          this.scrollToTop();

          if (event.status !== ServiceOrderStatus.WAITING_APPROVAL && event.status !== ServiceOrderStatus.REJECTED) {
            this.budgetModified = false;
          }

          if (event.status === ServiceOrderStatus.WAITING_APPROVAL) {
            this.generateApprovalLink();
          }

          if (event.status === ServiceOrderStatus.DIAGNOSING) {
            this.toastService.success("Sucesso", "Diagnóstico iniciado com sucesso.");
          }
        }
        this.isLoading = false;
      },
      (error: any) => {
        this.isLoading = false;
      }
    );
  }

  startDiagnosis(): void {
    if (!this.serviceOrderData._id) {
      this.saveAndStartDiagnosis();
      return;
    }

    this.updateStatus({
      status: ServiceOrderStatus.DIAGNOSING,
      notes: "Iniciando diagnóstico",
    });
  }

  saveAndStartDiagnosis(): void {
    if (this.readonly) return;

    if (this.openingComponent) {
      const isValid = this.openingComponent.validateForm();
      if (!isValid) {
        this.alertService.showAlert("Aviso!", "Preencha os campos obrigatórios: veículo e problema relatado.", "warning", "Fechar");
        return;
      }
    } else if (!this.serviceOrderData.vehicleId || !this.serviceOrderData.reportedProblem) {
      this.alertService.showAlert("Aviso!", "Preencha os campos obrigatórios: veículo e problema relatado.", "warning", "Fechar");
      return;
    }

    this.isLoading = true;

    const sanitizedData = { ...this.serviceOrderData };
    if (sanitizedData.visibleDamages) {
      sanitizedData.visibleDamages = sanitizedData.visibleDamages.filter((damage: string) => damage.trim() !== "");
    }

    this.serviceOrdersService.createServiceOrder(sanitizedData).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200) {
          this.serviceOrderData = response.body?.result;
          this.updateStatus({
            status: ServiceOrderStatus.DIAGNOSING,
            notes: "Iniciando diagnóstico",
          });
        }
      },
      (error: any) => {
        this.isLoading = false;
      }
    );
  }

  generateDiagnosticAndBudget(): void {
    if (this.readonly || !this.serviceOrderData._id) {
      this.alertService.showAlert("Erro!", "É necessário salvar a OS antes de gerar um orçamento.", "error", "Fechar");
      return;
    }

    if (this.diagnosisComponent) {
      this.diagnosisComponent.generateDiagnosticAndBudget();
      return;
    }

    this.processGenerateDiagnosticAndBudget();
  }

  processGenerateDiagnosticAndBudget(): void {
    this.isLoading = true;

    const originalEstimatedCompletionDate = this.serviceOrderData.estimatedCompletionDate;

    const diagnosticData = {
      identifiedProblems: this.serviceOrderData.identifiedProblems?.filter((problem: string) => problem.trim() !== "") || [],
      requiredParts: this.serviceOrderData.requiredParts || [],
      services: this.serviceOrderData.services || [],
      estimatedCompletionDate: this.serviceOrderData.estimatedCompletionDate,
      technicalObservations: this.serviceOrderData.technicalObservations,
    };

    if (this.diagnosisComponent) {
      this.diagnosisComponent.calculateTotals();
    }

    this.serviceOrdersService.generateDiagnosticAndBudget(this.serviceOrderData._id, diagnosticData).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200) {
          this.serviceOrderData = response.body?.result;

          if (this.serviceOrderData.estimatedCompletionDate) {
            if (typeof this.serviceOrderData.estimatedCompletionDate === "string") {
              this.serviceOrderData.estimatedCompletionDate = new Date(this.serviceOrderData.estimatedCompletionDate).toISOString().split("T")[0];
            }
          } else if (originalEstimatedCompletionDate) {
            this.serviceOrderData.estimatedCompletionDate = originalEstimatedCompletionDate;
          }

          if (this.diagnosisComponent) {
            this.diagnosisComponent.initializeFormattedValues();
          }

          this.budgetModified = false;
          this.serviceOrderUpdated.emit(this.serviceOrderData);
          this.scrollToTop();

          if (this.serviceOrderData.status === ServiceOrderStatus.WAITING_APPROVAL) {
            this.generateApprovalLink();
          }

          this.toastService.success("Sucesso", "Orçamento gerado com sucesso.");
        }
        this.isLoading = false;
      },
      (error: any) => {
        this.toastService.error("Erro", error.error?.msg || "Erro ao gerar orçamento");
        this.isLoading = false;
      }
    );
  }

  generateApprovalLink(): void {
    if (!this.serviceOrderData._id) return;

    if (this.serviceOrderData.status !== ServiceOrderStatus.WAITING_APPROVAL) {
      this.approvalLink = "";
      return;
    }

    this.budgetApprovalService.generateApprovalLink(this.serviceOrderData._id).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200 && response.body?.approvalLink) {
          this.approvalLink = response.body.approvalLink;

          if (this.diagnosisComponent) {
            this.diagnosisComponent.approvalLink = this.approvalLink;
            this.diagnosisComponent.prepareDefaultMessage();
          }
        }
      },
      (error: any) => {
      }
    );
  }

  shareBudgetWithClient(): void {
    if (!this.serviceOrderData._id) {
      this.alertService.showAlert("Erro!", "É necessário salvar o orçamento antes de compartilhar.", "error", "Fechar");
      return;
    }

    if (!this.approvalLink && this.serviceOrderData.status === ServiceOrderStatus.WAITING_APPROVAL) {
      this.generateApprovalLink();
    }
  }

  approveBudget(): void {
    if (this.readonly || !this.serviceOrderData._id) return;

    this.isLoading = true;
    this.serviceOrdersService.approveBudget(this.serviceOrderData._id).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200) {
          this.serviceOrderData = response.body?.result;
          this.selectedTab = "execution";
          this.serviceOrderUpdated.emit(this.serviceOrderData);
          this.scrollToTop();
          this.budgetModified = false;
          this.approvalLink = "";
          this.toastService.success("Sucesso", "Orçamento aprovado com sucesso.");
        }
        this.isLoading = false;
      },
      (error: any) => {
        this.isLoading = false;
      }
    );
  }

  public initializeFormattedValues() {
    if (this.serviceOrderData.requiredParts) {
      this.serviceOrderData.requiredParts.forEach((part: PartItem) => {
        if (part.unitPrice) {
          part.formattedUnitPrice = this.formatCurrencyWithPrefix(part.unitPrice);
        } else {
          part.formattedUnitPrice = "R$ 0,00";
        }
      });
    }

    if (this.serviceOrderData.services) {
      this.serviceOrderData.services.forEach((service: ServiceItem) => {
        if (service.pricePerHour) {
          service.formattedPricePerHour = this.formatCurrencyWithPrefix(service.pricePerHour);
        } else {
          service.formattedPricePerHour = "R$ 0,00";
        }
      });
    }
  }

  rejectBudget(): void {
    if (this.readonly || !this.serviceOrderData._id) return;

    this.isLoading = true;
    this.serviceOrdersService.rejectBudget(this.serviceOrderData._id).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200) {
          this.serviceOrderData = response.body?.result;
          this.serviceOrderUpdated.emit(this.serviceOrderData);
          this.scrollToTop();
          this.budgetModified = false;
          this.approvalLink = "";
          this.toastService.success("Sucesso", "Orçamento rejeitado com sucesso.");
        }
        this.isLoading = false;
      },
      (error: any) => {
        this.isLoading = false;
      }
    );
  }

  startExecution(): void {
    if (this.readonly || !this.serviceOrderData._id) return;

    this.updateStatus({
      status: ServiceOrderStatus.IN_PROGRESS,
      notes: "Iniciando execução do serviço",
    });
  }

  completeServiceOrder(): void {
    if (this.readonly || !this.serviceOrderData._id) return;

    this.isLoading = true;

    const completionData = {
      exitChecklist: this.serviceOrderData.exitChecklist || [],
      testDrive: this.serviceOrderData.testDrive || { performed: false },
      invoiceNumber: this.serviceOrderData.invoiceNumber || "",
      paymentMethod: this.serviceOrderData.paymentMethod || PaymentMethod.CASH,
      finalTotalParts: this.serviceOrderData.estimatedTotalParts || 0,
      finalTotalServices: this.serviceOrderData.estimatedTotalServices || 0,
      finalTotal: this.serviceOrderData.estimatedTotal || 0,
    };

    this.serviceOrdersService.completeServiceOrder(this.serviceOrderData._id, completionData).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200) {
          this.serviceOrderData = response.body?.result;
          this.selectedTab = "completion";
          this.serviceOrderUpdated.emit(this.serviceOrderData);
          this.scrollToTop();
          this.toastService.success("Sucesso", "Serviço concluído com sucesso.");
        }
        this.isLoading = false;
      },
      (error: any) => {
        this.isLoading = false;
      }
    );
  }

  deliverVehicle(): void {
    if (this.readonly || !this.serviceOrderData._id) return;

    if (!this.serviceOrderData.paymentMethod) {
      this.alertService.showAlert("Aviso!", "Selecione um método de pagamento antes de registrar a entrega.", "warning", "Fechar");
      return;
    }

    this.isLoading = true;
    this.serviceOrdersService.deliverVehicle(this.serviceOrderData._id, this.serviceOrderData.paymentMethod, this.serviceOrderData.invoiceNumber).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200) {
          this.serviceOrderData = response.body?.result;
          this.serviceOrderSaved.emit(this.serviceOrderData);
          this.toastService.success("Sucesso", "Veículo entregue com sucesso.");
          this.closeModal();
        }
        this.isLoading = false;
      },
      (error: any) => {
        this.isLoading = false;
      }
    );
  }

  saveServiceOrder(): void {
    if (this.readonly) return;

    if (this.selectedTab === "diagnosis" && this.serviceOrderData._id && (this.serviceOrderData.status === ServiceOrderStatus.DIAGNOSING || this.serviceOrderData.status === ServiceOrderStatus.REJECTED || this.budgetModified)) {
      this.generateDiagnosticAndBudget();
      return;
    }

    if (!this.serviceOrderData._id) {
      if (this.openingComponent) {
        const isValid = this.openingComponent.validateForm();
        if (!isValid) {
          this.alertService.showAlert("Aviso!", "Preencha os campos obrigatórios: veículo e problema relatado.", "warning", "Fechar");
          this.selectedTab = "general";
          return;
        }
      } else {
        if (!this.serviceOrderData.vehicleId || !this.serviceOrderData.reportedProblem) {
          this.alertService.showAlert("Aviso!", "Preencha os campos obrigatórios: veículo e problema relatado.", "warning", "Fechar");
          this.selectedTab = "general";
          return;
        }
      }
    }

    this.isLoading = true;

    if (this.serviceOrderData.visibleDamages) {
      this.serviceOrderData.visibleDamages = this.serviceOrderData.visibleDamages.filter((damage: string) => damage.trim() !== "");
    }
    if (this.serviceOrderData.identifiedProblems) {
      this.serviceOrderData.identifiedProblems = this.serviceOrderData.identifiedProblems.filter((problem: string) => problem.trim() !== "");
    }

    if (this.serviceOrder && this.serviceOrder._id) {
      this.updateServiceOrder(this.serviceOrder._id, this.serviceOrderData);
    } else {
      this.createServiceOrder(this.serviceOrderData);
    }
  }

  createServiceOrder(serviceOrderData: ServiceOrder): void {
    this.serviceOrdersService.createServiceOrder(serviceOrderData).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200) {
          this.toastService.success("Sucesso", "Ordem de serviço criada com sucesso.");
          this.serviceOrderSaved.emit(response.body?.result);
          this.closeModal();
        }
        this.isLoading = false;
      },
      (error: any) => {
        this.isLoading = false;
      }
    );
  }

  updateServiceOrder(id: string, serviceOrderData: ServiceOrder): void {
    this.serviceOrdersService.updateServiceOrder(id, serviceOrderData).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200) {
          this.toastService.success("Sucesso", "Ordem de serviço atualizada com sucesso.");
          this.serviceOrderSaved.emit(response.body?.result);
          this.closeModal();
        }
        this.isLoading = false;
      },
      (error: any) => {
        this.isLoading = false;
      }
    );
  }

  enableEditing(): void {
    this.readonly = false;
  }

  closeModal(): void {
    this.closeModalEvent.emit();
  }
}
