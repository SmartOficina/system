import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { HttpResponse } from "@angular/common/http";
import { ScheduleService } from "@features/garage-system/components/schedule/schedule.service";
import { ClientDropdownComponent } from "@shared/components/client-dropdown/client-dropdown.component";
import { InputGenericComponent } from "@shared/components/input-generic/input-generic.component";
import { VehicleDropdownComponent } from "@shared/components/vehicle-dropdown/vehicle-dropdown.component";
import { ScheduleEvent, ScheduleEventStatus } from "@shared/models/models";
import { AlertService } from "@shared/services/alert.service";
import { ToastService } from "@shared/services/toast.service";

@Component({
  selector: "app-schedule-event-modal",
  templateUrl: "./schedule-event-modal.component.html",
  styleUrls: ["./schedule-event-modal.component.scss"],
  // prettier-ignore
  imports: [
    FormsModule,
    CommonModule,
    InputGenericComponent,
    VehicleDropdownComponent,
    ClientDropdownComponent
  ],
})
export class ScheduleEventModalComponent implements OnInit {
  @Input() event: ScheduleEvent | null = null;
  @Input() date: Date | null = null;
  @Input() readonly: boolean = false;
  @Output() closeModalEvent: EventEmitter<void> = new EventEmitter<void>();
  @Output() eventSaved: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild("titleInput") titleInput!: InputGenericComponent;

  ScheduleEventStatus = ScheduleEventStatus;

  eventData: ScheduleEvent = {
    title: "",
    date: "",
    time: "",
    duration: 60,
    serviceTag: "Manutenção",
    status: ScheduleEventStatus.SCHEDULED,
  };

  selectedVehiclePlate: string = "";
  selectedClientName: string = "";
  isLoading: boolean = false;

  timeOptions: string[] = [];
  durationOptions: number[] = [15, 30, 45, 60, 90, 120, 180, 240];
  serviceTagOptions: string[] = ["Manutenção", "Retorno", "Garantia", "Acessório", "Orçamento"];
  statusOptions = [
    { value: ScheduleEventStatus.SCHEDULED, label: "Agendado" },
    { value: ScheduleEventStatus.COMPLETED, label: "Concluído" },
    { value: ScheduleEventStatus.CANCELED, label: "Cancelado" },
    { value: ScheduleEventStatus.NO_SHOW, label: "Não Compareceu" },
  ];

  // prettier-ignore
  constructor(
    private scheduleService: ScheduleService,
    private alertService: AlertService,
    private toastService: ToastService
  ) {
    for (let hour = 7; hour <= 18; hour++) {
      const hourStr = hour.toString().padStart(2, '0');
      this.timeOptions.push(`${hourStr}:00`);
      if (hour < 18) {
        this.timeOptions.push(`${hourStr}:30`);
      }
    }
  }

  ngOnInit(): void {
    if (this.event) {
      this.loadEventData();
    } else if (this.date) {
      this.eventData.date = this.date.toISOString().split("T")[0];
      this.eventData.time = "09:00";
    } else {
      this.eventData.date = new Date().toISOString().split("T")[0];
      this.eventData.time = "09:00";
    }
  }

  loadEventData(): void {
    this.eventData = { ...this.event! };

    if (this.event?.date && typeof this.event.date === "string") {
      this.eventData.date = new Date(this.event.date).toISOString().split("T")[0];
    }

    if (this.event?.vehicle) {
      this.selectedVehiclePlate = this.event.vehicle.licensePlate || "";

      if (this.event.vehicle.client && typeof this.event.vehicle.client === "object") {
        this.selectedClientName = this.event.vehicle.client.fullName || "";
      }
    } else if (this.event?.client && typeof this.event.client === "object") {
      this.selectedClientName = this.event.client.fullName || "";
    }
  }

  onVehicleSelected(vehicleData: any): void {
    if (this.readonly) return;

    this.eventData.vehicleId = vehicleData.vehicleId;
    this.selectedVehiclePlate = vehicleData.licensePlate;
    this.selectedClientName = vehicleData.clientName || "";

    if (vehicleData.clientId) {
      this.eventData.clientId = vehicleData.clientId;
    }
  }

  onClientSelected(clientData: any): void {
    if (this.readonly) return;

    this.eventData.clientId = clientData.clientId;
    this.selectedClientName = clientData.client?.fullName || "";
  }

  switchToEditMode(): void {
    if (this.readonly && this.event) {
      this.readonly = false;
      this.alertService.showAlert("Informação", "Agora você pode editar o agendamento.", "info", "OK");
    }
  }

  saveEvent(): void {
    if (this.readonly) return;

    if (this.titleInput) {
      this.titleInput.inputTouched = true;
    }

    if (!this.eventData.title || !this.eventData.date || !this.eventData.time) {
      this.alertService.showAlert("Aviso!", "Por favor, preencha os campos obrigatórios: título, data e hora.", "warning", "Fechar");
      return;
    }

    const selectedDateTime = new Date(`${this.eventData.date}T${this.eventData.time}:00`);
    const now = new Date();

    if (selectedDateTime < now) {
      this.alertService.showAlert("Aviso!", "Não é possível agendar para uma data e horário no passado. Por favor, selecione uma data e horário futuros.", "warning", "Fechar");
      return;
    }

    this.isLoading = true;

    if (this.event && this.event._id) {
      this.updateEvent(this.event._id, this.eventData);
    } else {
      this.createEvent(this.eventData);
    }
  }

  createEvent(eventData: ScheduleEvent): void {
    this.scheduleService.createEvent(eventData).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200) {
          this.toastService.success("Sucesso", "Agendamento criado com sucesso.");
          this.eventSaved.emit();
          this.closeModal();
        }
        this.isLoading = false;
      },
      (error: any) => {
        this.isLoading = false;
      }
    );
  }

  updateEvent(id: string, eventData: ScheduleEvent): void {
    this.scheduleService.updateEvent(id, eventData).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200) {
          this.toastService.success("Sucesso", "Agendamento atualizado com sucesso.");
          this.eventSaved.emit();
          this.closeModal();
        }
        this.isLoading = false;
      },
      (error: any) => {
        this.isLoading = false;
      }
    );
  }

  updateStatus(status: string): void {
    if (this.readonly || !this.event || !this.event._id) return;

    this.isLoading = true;
    this.scheduleService.updateEventStatus(this.event._id, status).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status === 200) {
          this.eventData.status = status;
          this.toastService.success("Sucesso", "Status atualizado com sucesso.");
          this.eventSaved.emit();
        }
        this.isLoading = false;
      },
      (error: any) => {
        this.isLoading = false;
      }
    );
  }

  getStatusLabel(status: string): string {
    const statusOption = this.statusOptions.find((option) => option.value === status);
    return statusOption ? statusOption.label : status;
  }

  getStatusClass(status: string): string {
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

  closeModal(): void {
    this.closeModalEvent.emit();
  }
}
