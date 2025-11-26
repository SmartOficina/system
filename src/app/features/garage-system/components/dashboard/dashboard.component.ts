import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { Subject, takeUntil, interval, startWith, switchMap, catchError, of } from "rxjs";
import { DashboardService } from "./dashboard.service";
import { OverviewCardsComponent } from "./overview-cards/overview-cards.component";
import { ServiceOrdersChartComponent } from "./service-orders-chart/service-orders-chart.component";
import { RevenueChartComponent } from "./revenue-chart/revenue-chart.component";
import { CriticalAlertsComponent } from "./critical-alerts/critical-alerts.component";
import { ScheduleTodayComponent } from "./schedule-today/schedule-today.component";
import { InventorySummaryComponent } from "./inventory-summary/inventory-summary.component";
import { AlertService } from "@shared/services/alert.service";
import { OverviewData, ServiceOrdersStats, FinancialStats, DashboardScheduleEvent, Alert } from "../../../../shared/models/models";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule, FormsModule, OverviewCardsComponent, ServiceOrdersChartComponent, RevenueChartComponent, CriticalAlertsComponent, ScheduleTodayComponent, InventorySummaryComponent],
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  selectedPeriod = "month";
  loading = true;
  errorMessage = "";
  lastUpdateTime = new Date();

  overviewData: OverviewData | null = null;
  serviceOrdersData: ServiceOrdersStats | null = null;
  financialData: FinancialStats | null = null;
  criticalAlerts: Alert[] = [];
  todaySchedule: DashboardScheduleEvent[] = [];
  inventoryData: any = null;

  constructor(private dashboardService: DashboardService, private route: ActivatedRoute, private alertService: AlertService) {}

  ngOnInit() {
    this.checkActivationSuccess();
    this.loadDashboardData();
    this.setupAutoRefresh();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkActivationSuccess() {
    this.route.queryParams.subscribe((params) => {
      if (params["activated"] === "true" && params["token"] && params["email"]) {
        if (!localStorage.getItem("token")) {
          localStorage.setItem("token", params["token"]);
        }

        setTimeout(() => {
          this.alertService.showAlert("Conta Ativada com Sucesso! 🎉", `Parabéns! Sua conta Smart Oficina foi ativada. Estamos ansiosos para ajudar você a gerenciar sua oficina com mais eficiência.`, "success", "Começar a usar");
        }, 500);

        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
    });

    const activationData = localStorage.getItem("activationSuccess");
    if (activationData) {
      try {
        const data = JSON.parse(activationData);

        if (Date.now() - data.timestamp < 300000) {
          setTimeout(() => {
            this.alertService.showAlert("Conta Ativada com Sucesso! 🎉", `Parabéns! Sua conta Smart Oficina foi ativada. Estamos ansiosos para ajudar você a gerenciar sua oficina com mais eficiência.`, "success", "Começar a usar");
          }, 500);
        }

        localStorage.removeItem("activationSuccess");
      } catch (error) {
        localStorage.removeItem("activationSuccess");
      }
    }
  }

  private loadDashboardData() {
    this.loading = true;
    this.errorMessage = "";

    const overview$ = this.dashboardService.getOverview().pipe(
      catchError((error) => {
        return of({ result: null });
      })
    );

    const serviceOrders$ = this.dashboardService.getServiceOrdersStats(this.selectedPeriod).pipe(
      catchError((error) => {
        return of({ result: null });
      })
    );

    const financial$ = this.dashboardService.getFinancialStats(this.selectedPeriod).pipe(
      catchError((error) => {
        return of({ result: null });
      })
    );

    const schedule$ = this.dashboardService.getTodaySchedule().pipe(
      catchError((error) => {
        return of({ result: [] });
      })
    );

    const inventory$ = this.dashboardService.getInventoryStats().pipe(
      catchError((error) => {
        return of({ result: null });
      })
    );

    Promise.all([overview$.toPromise(), serviceOrders$.toPromise(), financial$.toPromise(), schedule$.toPromise(), inventory$.toPromise()])
      .then(([overview, serviceOrders, financial, schedule, inventory]) => {
        this.overviewData = overview?.result || null;
        this.serviceOrdersData = serviceOrders?.result || null;
        this.financialData = financial?.result || null;
        this.todaySchedule = schedule?.result || [];
        this.inventoryData = inventory?.result || null;
        this.criticalAlerts = this.overviewData?.criticalAlerts || [];
        this.lastUpdateTime = new Date();
        this.loading = false;
      })
      .catch((error) => {
        this.errorMessage = "Erro ao carregar dados do dashboard. Verifique sua conexão.";
        this.loading = false;
      });
  }

  private setupAutoRefresh() {
    interval(300000)
      .pipe(
        startWith(0),
        switchMap(() =>
          this.dashboardService.getOverview().pipe(
            catchError((error) => {
              return of({ result: null });
            })
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((data) => {
        if (data?.result) {
          this.overviewData = data.result;
          this.criticalAlerts = data.result.criticalAlerts || [];
          this.lastUpdateTime = new Date();
        }
      });
  }

  onPeriodChange() {
    this.loadDashboardData();
  }

  refreshData() {
    this.loadDashboardData();
  }
}
