import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { ServiceOrder } from "@shared/models/models";
import { CurrencyUtils } from "@shared/utils/currency-utils";
import { ServiceOrderStatusUtils } from "@shared/utils/service-order-status.utils";
import { BudgetApprovalService } from "./budget-approval.service";
import { PrintService } from "@shared/services/print.service";

@Component({
  selector: "app-budget-approval",
  templateUrl: "./budget-approval.component.html",
  styleUrls: ["./budget-approval.component.scss"],
  imports: [CommonModule, FormsModule, RouterModule],
})
export class BudgetApprovalComponent implements OnInit {
  token: string = "";
  isLoading: boolean = true;
  hasError: boolean = false;
  errorMessage: string = "";
  successMessage: string = "";

  serviceOrder: ServiceOrder | null = null;
  budgetDetails: any = null;
  rejectionReason: string = "";
  showRejectForm: boolean = false;
  approvalPending: boolean = true;

  constructor(private route: ActivatedRoute, private router: Router, private budgetApprovalService: BudgetApprovalService, private printService: PrintService) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.token = params["token"] || "";
      if (this.token) {
        this.loadBudgetDetails();
      } else {
        this.hasError = true;
        this.errorMessage = "Token de aprovação inválido.";
        this.isLoading = false;
      }
    });
  }

  loadBudgetDetails(): void {
    this.isLoading = true;
    this.hasError = false;

    this.budgetApprovalService.getBudgetApprovalDetails(this.token).subscribe(
      (response) => {
        if (response.status === 200 && response.body) {
          this.serviceOrder = response.body.serviceOrder || null;
          this.budgetDetails = response.body.budgetDetails || null;
          this.approvalPending = response.body.approvalPending || false;

          if (!this.approvalPending) {
            if (this.serviceOrder && this.serviceOrder.status === "aprovada") {
              this.successMessage = "O orçamento foi aprovado.";
            } else if (this.serviceOrder && this.serviceOrder.status === "rejeitada") {
              this.successMessage = "O orçamento foi rejeitado.";
            }
          }
        } else {
          this.hasError = true;
          this.errorMessage = "Não foi possível carregar os detalhes do orçamento.";
        }
        this.isLoading = false;
      },
      (error) => {
        this.hasError = true;
        this.errorMessage = error.error?.msg || "Ocorreu um erro ao carregar os detalhes do orçamento.";
        this.isLoading = false;
      }
    );
  }

  formatCurrency(value: number): string {
    return CurrencyUtils.formatCurrency(value);
  }

  getStatusLabel(status: string): string {
    return ServiceOrderStatusUtils.getStatusLabel(status);
  }

  getStatusClass(status: string): string {
    return ServiceOrderStatusUtils.getStatusClass(status);
  }

  approveBudget(): void {
    if (!this.token || !this.approvalPending) return;

    this.isLoading = true;
    this.budgetApprovalService.approveBudgetViaLink(this.token).subscribe(
      (response) => {
        if (response.status === 200) {
          this.approvalPending = false;
          this.successMessage = "Orçamento aprovado com sucesso! A oficina será notificada e entrará em contato para agendar o serviço.";
          this.loadBudgetDetails();
        } else {
          this.hasError = true;
          this.errorMessage = "Não foi possível aprovar o orçamento.";
        }
        this.isLoading = false;
      },
      (error) => {
        this.hasError = true;
        this.errorMessage = error.error?.msg || "Ocorreu um erro ao aprovar o orçamento.";
        this.isLoading = false;
      }
    );
  }

  toggleRejectForm(): void {
    this.showRejectForm = !this.showRejectForm;
  }

  rejectBudget(): void {
    if (!this.token || !this.approvalPending) return;

    this.isLoading = true;
    this.budgetApprovalService.rejectBudgetViaLink(this.token, this.rejectionReason).subscribe(
      (response) => {
        if (response.status === 200) {
          this.approvalPending = false;
          this.showRejectForm = false;
          this.successMessage = "Orçamento rejeitado com sucesso. A oficina será notificada da sua decisão.";
          this.loadBudgetDetails();
        } else {
          this.hasError = true;
          this.errorMessage = "Não foi possível rejeitar o orçamento.";
        }
        this.isLoading = false;
      },
      (error) => {
        this.hasError = true;
        this.errorMessage = error.error?.msg || "Ocorreu um erro ao rejeitar o orçamento.";
        this.isLoading = false;
      }
    );
  }

  printBudget(): void {
    if (this.serviceOrder) {
      let clientName = "";
      if (this.serviceOrder.client && typeof this.serviceOrder.client === "object") {
        const client = this.serviceOrder.client as any;
        clientName = client.fullName || "";
      } else if (this.serviceOrder.vehicle && this.serviceOrder.vehicle.client) {
        const client = this.serviceOrder.vehicle.client as any;
        clientName = client.fullName || "";
      }
      this.printService.printBudget(this.serviceOrder, clientName, true);
    }
  }
}
