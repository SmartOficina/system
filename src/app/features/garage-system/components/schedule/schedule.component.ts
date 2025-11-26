import { Component, OnInit, ComponentRef, LOCALE_ID, OnDestroy } from "@angular/core";
import { HttpResponse } from "@angular/common/http";
import { FormsModule } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";
import { NgIf, NgFor, NgClass, DatePipe, registerLocaleData } from "@angular/common";
import { ScheduleService } from "./schedule.service";
import { ScheduleEventModalComponent } from "@shared/modals/schedule-event-modal/schedule-event-modal.component";
import { AlertService } from "@shared/services/alert.service";
import { ModalService } from "@shared/services/modal.service";
import { ScheduleEvent, ScheduleEventStatus } from "@shared/models/models";
import { PaginationComponent } from "@shared/components/pagination/pagination.component";
import { LoadingSpinnerComponent } from "@shared/components/loading-spinner/loading-spinner.component";
import { InputGenericComponent } from "@shared/components/input-generic/input-generic.component";
import localePt from "@angular/common/locales/pt";
import { PermissionHelperService, PermissionSet } from "@shared/services/permission-helper.service";
import { GarageSystemService } from "@features/garage-system/garage-system.service";
import { PermissionGuardComponent } from "@shared/components/permission-guard.component";
import { ToastService } from "@shared/services/toast.service";

registerLocaleData(localePt);

@Component({
  selector: "app-schedule",
  templateUrl: "./schedule.component.html",
  styleUrls: ["./schedule.component.scss"],
  // prettier-ignore
  imports: [
    FormsModule,
    NgIf,
    NgFor,
    NgClass,
    DatePipe,
    PaginationComponent,
    PermissionGuardComponent,
    LoadingSpinnerComponent,
    InputGenericComponent
  ],
  providers: [{ provide: LOCALE_ID, useValue: "pt-BR" }],
})
export class ScheduleComponent implements OnInit, OnDestroy {
  events: ScheduleEvent[] = [];
  currentDate: Date = new Date();
  calendarDays: Day[] = [];
  selectedDate: Date | null = null;
  currentMonth: Date = new Date();
  weekDays: string[] = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  ScheduleEventStatus = ScheduleEventStatus;
  isLoading: boolean = false;
  activeScheduleEventModalRef: ComponentRef<ScheduleEventModalComponent> | null = null;
  upcomingEvents: ScheduleEvent[] = [];
  Math = Math;
  lastUpdate: Date = new Date();
  private destroy$ = new Subject<void>();

  permissions: PermissionSet = {
    view: false,
    create: false,
    edit: false,
    delete: false,
  };

  page: number = 1;
  limit: number = 5;
  totalPages: number = 1;

  search: string = "";
  filterServiceTag: string = "all";

  showFullMonth: boolean = false;
  currentWeekDays: Day[] = [];

  limitOptions: number[] = [5, 10, 20, 50];
  sortOrder: string = "date_asc";
  sortOptions = [
    { value: "date_asc", label: "Data (Mais Antiga)" },
    { value: "date_desc", label: "Data (Mais Recente)" },
    { value: "title_asc", label: "Título (A-Z)" },
    { value: "title_desc", label: "Título (Z-A)" },
  ];
  serviceTagOptions = [
    { value: "all", label: "Todas as etiquetas" },
    { value: "Manutenção", label: "Manutenção" },
    { value: "Retorno", label: "Retorno" },
    { value: "Garantia", label: "Garantia" },
    { value: "Acessório", label: "Acessório" },
    { value: "Orçamento", label: "Orçamento" },
  ];

  // prettier-ignore
  constructor(
    private scheduleService: ScheduleService,
    private alertService: AlertService,
    private modalService: ModalService,
    private permissionHelper: PermissionHelperService,
    private garageSystemService: GarageSystemService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.loadPermissions();
    this.generateCalendar();
    this.loadEvents();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPermissions(): void {
    this.permissionHelper
      .getEntityPermissions("schedule")
      .pipe(takeUntil(this.destroy$))
      .subscribe((permissions) => {
        this.permissions = permissions;
      });
  }

  generateCalendar(): void {
    this.generateFullCalendar();
    this.generateCurrentWeek();
  }

  generateFullCalendar(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startingDay = firstDay.getDay();

    const totalDays = 42;

    this.calendarDays = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      this.calendarDays.push({
        date: date,
        isCurrentMonth: false,
        isToday: this.isToday(date),
        events: [],
      });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      this.calendarDays.push({
        date: date,
        isCurrentMonth: true,
        isToday: this.isToday(date),
        events: [],
      });
    }

    const remainingDays = totalDays - this.calendarDays.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      this.calendarDays.push({
        date: date,
        isCurrentMonth: false,
        isToday: this.isToday(date),
        events: [],
      });
    }
  }

  generateCurrentWeek(): void {
    let referenceDate: Date;

    if (this.currentWeekDays.length > 0) {
      referenceDate = new Date(this.currentWeekDays[0].date);
    } else {
      referenceDate = new Date();
    }

    const currentDay = referenceDate.getDay();
    const startOfWeek = new Date(referenceDate);
    startOfWeek.setDate(referenceDate.getDate() - currentDay);

    this.currentWeekDays = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);

      this.currentWeekDays.push({
        date: date,
        isCurrentMonth: date.getMonth() === this.currentMonth.getMonth(),
        isToday: this.isToday(date),
        events: [],
      });
    }
  }

  toggleCalendarView(): void {
    this.showFullMonth = !this.showFullMonth;
  }

  loadEvents(): void {
    this.isLoading = true;
    let startDate: Date, endDate: Date;

    if (this.showFullMonth) {
      startDate = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
      endDate = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0);
    } else {
      if (this.currentWeekDays.length > 0) {
        startDate = new Date(this.currentWeekDays[0].date);
        endDate = new Date(this.currentWeekDays[6].date);
      } else {
        startDate = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
        endDate = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0);
      }
    }

    this.scheduleService.getEvents(startDate.toISOString(), endDate.toISOString()).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200) {
          this.events = response.body?.result || [];
          this.updateCalendarEvents();
          this.loadUpcomingEvents();
          this.lastUpdate = new Date();
        }
        this.isLoading = false;
      },
      (error: any) => {
        this.isLoading = false;
      }
    );
  }

  loadUpcomingEvents(): void {
    const today = new Date();
    this.upcomingEvents = this.events
      .filter((event) => {
        const eventDate = new Date(event.date);
        const isFuture = eventDate >= today || this.isToday(eventDate);

        const matchesSearch = !this.search || event.title.toLowerCase().includes(this.search.toLowerCase()) || event.serviceTag.toLowerCase().includes(this.search.toLowerCase()) || (event.vehicle?.licensePlate && event.vehicle.licensePlate.toLowerCase().includes(this.search.toLowerCase())) || (event.vehicle?.brandModel && event.vehicle.brandModel.toLowerCase().includes(this.search.toLowerCase())) || (event.vehicle?.client?.fullName && event.vehicle.client.fullName.toLowerCase().includes(this.search.toLowerCase())) || (event.client?.fullName && event.client.fullName.toLowerCase().includes(this.search.toLowerCase()));

        const matchesServiceTag = this.filterServiceTag === "all" || event.serviceTag === this.filterServiceTag;

        return isFuture && matchesSearch && matchesServiceTag;
      })
      .sort((a, b) => {
        return this.applySorting(a, b);
      });

    this.totalPages = Math.ceil(this.upcomingEvents.length / this.limit);
    if (this.totalPages === 0) this.totalPages = 1;

    if (this.page > this.totalPages) {
      this.page = this.totalPages;
    }
  }

  applySorting(a: ScheduleEvent, b: ScheduleEvent): number {
    switch (this.sortOrder) {
      case "date_desc":
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA.getTime() === dateB.getTime()) {
          return b.time.localeCompare(a.time);
        }
        return dateB.getTime() - dateA.getTime();

      case "title_asc":
        return a.title.localeCompare(b.title);

      case "title_desc":
        return b.title.localeCompare(a.title);

      default: // "date_asc"
        const dateAsc = new Date(a.date);
        const dateBsc = new Date(b.date);
        if (dateAsc.getTime() === dateBsc.getTime()) {
          return a.time.localeCompare(b.time);
        }
        return dateAsc.getTime() - dateBsc.getTime();
    }
  }

  changePage(page: number): void {
    this.page = page;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  changeLimit(): void {
    this.page = 1;
    this.loadUpcomingEvents();
  }

  changeSortOrder(): void {
    this.page = 1;
    this.loadUpcomingEvents();
  }

  onSearchKeyup(): void {
    this.page = 1;
    this.loadUpcomingEvents();
  }

  applyFilters(): void {
    this.page = 1;
    this.loadUpcomingEvents();
  }

  onServiceTagFilterChange(): void {
    this.page = 1;
    this.loadUpcomingEvents();
  }

  clearFilters(): void {
    this.search = "";
    this.filterServiceTag = "all";
    this.sortOrder = "date_asc";
    this.page = 1;
    this.loadUpcomingEvents();
  }

  updateCalendarEvents(): void {
    this.calendarDays.forEach((day) => (day.events = []));
    this.currentWeekDays.forEach((day) => (day.events = []));

    this.events.forEach((event) => {
      const eventDate = new Date(event.date);

      const dayIndex = this.calendarDays.findIndex((day) => day.date.getDate() === eventDate.getDate() && day.date.getMonth() === eventDate.getMonth() && day.date.getFullYear() === eventDate.getFullYear());

      if (dayIndex !== -1) {
        this.calendarDays[dayIndex].events.push(event);
      }

      const weekDayIndex = this.currentWeekDays.findIndex((day) => day.date.getDate() === eventDate.getDate() && day.date.getMonth() === eventDate.getMonth() && day.date.getFullYear() === eventDate.getFullYear());

      if (weekDayIndex !== -1) {
        this.currentWeekDays[weekDayIndex].events.push(event);
      }
    });
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  }

  previousMonth(): void {
    if (this.showFullMonth) {
      this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    } else {
      const currentWeekStart = new Date(this.currentWeekDays[0].date);
      currentWeekStart.setDate(currentWeekStart.getDate() - 7);

      this.currentMonth = new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), 1);

      this.generateWeekFromDate(currentWeekStart);
    }
    this.generateCalendar();
    this.loadEvents();
  }

  nextMonth(): void {
    if (this.showFullMonth) {
      this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    } else {
      const currentWeekStart = new Date(this.currentWeekDays[0].date);
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);

      this.currentMonth = new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), 1);

      this.generateWeekFromDate(currentWeekStart);
    }
    this.generateCalendar();
    this.loadEvents();
  }

  generateWeekFromDate(startDate: Date): void {
    const currentDay = startDate.getDay();

    const startOfWeek = new Date(startDate);
    startOfWeek.setDate(startDate.getDate() - currentDay);

    this.currentWeekDays = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);

      this.currentWeekDays.push({
        date: date,
        isCurrentMonth: date.getMonth() === this.currentMonth.getMonth(),
        isToday: this.isToday(date),
        events: [],
      });
    }
  }

  goToToday(): void {
    this.currentMonth = new Date();

    if (!this.showFullMonth) {
      this.generateWeekFromDate(new Date());
    }

    this.generateCalendar();
    this.loadEvents();
  }

  selectDate(day: Day): void {
    if (!this.permissionHelper.checkPermission(this.permissions.create, "criar agendamentos")) {
      return;
    }

    this.selectedDate = day.date;
    this.openCreateModal(day.date);
  }

  refreshData(): void {
    this.loadEvents();
  }

  openCreateModal(date?: Date): void {
    if (!this.permissionHelper.checkPermission(this.permissions.create, "criar agendamentos")) {
      return;
    }

    this.activeScheduleEventModalRef = this.modalService.open(ScheduleEventModalComponent, {
      data: {
        event: null,
        date: date || new Date(),
      },
      onClose: () => {
        this.activeScheduleEventModalRef = null;
      },
    });

    this.activeScheduleEventModalRef.instance.eventSaved.subscribe(() => {
      this.loadEvents();
      this.modalService.close(this.activeScheduleEventModalRef!);
      this.activeScheduleEventModalRef = null;
    });
  }

  openEditModal(event: ScheduleEvent): void {
    if (!this.permissionHelper.checkPermission(this.permissions.edit, "editar agendamentos")) {
      return;
    }

    this.activeScheduleEventModalRef = this.modalService.open(ScheduleEventModalComponent, {
      data: {
        event: { ...event },
      },
      onClose: () => {
        this.activeScheduleEventModalRef = null;
      },
    });

    this.activeScheduleEventModalRef.instance.eventSaved.subscribe(() => {
      this.loadEvents();
      this.modalService.close(this.activeScheduleEventModalRef!);
      this.activeScheduleEventModalRef = null;
    });
  }

  openViewModal(event: ScheduleEvent): void {
    this.activeScheduleEventModalRef = this.modalService.open(ScheduleEventModalComponent, {
      data: {
        event: { ...event },
        readonly: true,
      },
      onClose: () => {
        this.activeScheduleEventModalRef = null;
      },
    });
  }

  removeEvent(id: string): void {
    if (!this.permissionHelper.checkPermission(this.permissions.delete, "excluir agendamentos")) {
      return;
    }

    this.alertService.showAlert("Confirmação", "Tem certeza que deseja excluir este agendamento?", "warning", "Excluir", "Cancelar").then((confirmed: boolean) => {
      if (confirmed) {
        this.isLoading = true;
        this.scheduleService.removeEvent(id).subscribe(
          (response: HttpResponse<any>) => {
            if (response.status === 200) {
              this.toastService.success("Sucesso", "Agendamento removido com sucesso.");
              this.loadEvents();
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

  getEventStatusClass(status: string): string {
    switch (status) {
      case ScheduleEventStatus.SCHEDULED:
        return "bg-blue-100 text-blue-800";
      case ScheduleEventStatus.COMPLETED:
        return "bg-green-100 text-green-800";
      case ScheduleEventStatus.CANCELED:
        return "bg-red-100 text-red-800";
      case ScheduleEventStatus.NO_SHOW:
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  getEventStatusLabel(status: string): string {
    switch (status) {
      case ScheduleEventStatus.SCHEDULED:
        return "Agendado";
      case ScheduleEventStatus.COMPLETED:
        return "Concluído";
      case ScheduleEventStatus.CANCELED:
        return "Cancelado";
      case ScheduleEventStatus.NO_SHOW:
        return "Não Compareceu";
      default:
        return status;
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case ScheduleEventStatus.SCHEDULED:
        return "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z";
      case ScheduleEventStatus.COMPLETED:
        return "M5 13l4 4L19 7";
      case ScheduleEventStatus.CANCELED:
        return "M6 18L18 6M6 6l12 12";
      case ScheduleEventStatus.NO_SHOW:
        return "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
      default:
        return "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
    }
  }

  getServiceTagColor(tag: string): string {
    switch (tag) {
      case "Manutenção":
        return "bg-indigo-100 text-indigo-800";
      case "Retorno":
        return "bg-purple-100 text-purple-800";
      case "Garantia":
        return "bg-green-100 text-green-800";
      case "Acessório":
        return "bg-orange-100 text-orange-800";
      case "Orçamento":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  get displayedUpcomingEvents(): ScheduleEvent[] {
    const startIndex = (this.page - 1) * this.limit;
    const endIndex = Math.min(startIndex + this.limit, this.upcomingEvents.length);
    return this.upcomingEvents.slice(startIndex, endIndex);
  }

  handleMoreInfo() {
    this.garageSystemService.handleMoreInfo();
  }

  handleUpgradePlan() {
    this.garageSystemService.handleUpgradePlan();
  }

  getCalendarTitle(): string {
    if (this.showFullMonth) {
      return this.currentMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    } else {
      const startDate = this.currentWeekDays[0]?.date;
      const endDate = this.currentWeekDays[6]?.date;

      if (startDate && endDate) {
        const startStr = startDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        const endStr = endDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
        return `${startStr} - ${endStr}`;
      }

      return this.currentMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    }
  }

  getNavigationTooltip(direction: "previous" | "next"): string {
    if (this.showFullMonth) {
      return direction === "previous" ? "Mês anterior" : "Próximo mês";
    } else {
      return direction === "previous" ? "Semana anterior" : "Próxima semana";
    }
  }

  getFilterServiceTagLabel(): string {
    const option = this.serviceTagOptions.find((opt) => opt.value === this.filterServiceTag);
    return option ? option.label : this.filterServiceTag;
  }
}

interface Day {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: ScheduleEvent[];
}
