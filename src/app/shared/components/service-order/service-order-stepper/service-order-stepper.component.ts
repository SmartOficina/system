import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ServiceOrderStatus } from "../../../models/models";
import { ServiceOrderStatusUtils } from "../../../utils/service-order-status.utils";

interface Step {
  id: string;
  label: string;
  active: boolean;
  completed: boolean;
  disabled: boolean;
  statusValues: string[];
}

@Component({
  selector: "app-service-order-stepper",
  templateUrl: "./service-order-stepper.component.html",
  styleUrls: ["./service-order-stepper.component.scss"],
  imports: [CommonModule],
})
export class ServiceOrderStepperComponent implements OnInit {
  @Input() currentStatus: string = "";
  @Input() readonly: boolean = false;
  @Output() changeTabEvent = new EventEmitter<string>();

  ServiceOrderStatus = ServiceOrderStatus;

  steps: Step[] = [
    {
      id: "general",
      label: "Abertura",
      active: false,
      completed: false,
      disabled: false,
      statusValues: [ServiceOrderStatus.OPENED],
    },
    {
      id: "diagnosis",
      label: "Diagnóstico e Orçamento",
      active: false,
      completed: false,
      disabled: false,
      statusValues: [ServiceOrderStatus.DIAGNOSING, ServiceOrderStatus.WAITING_APPROVAL, ServiceOrderStatus.REJECTED],
    },
    {
      id: "execution",
      label: "Execução",
      active: false,
      completed: false,
      disabled: true,
      statusValues: [ServiceOrderStatus.APPROVED, ServiceOrderStatus.IN_PROGRESS, ServiceOrderStatus.WAITING_PARTS],
    },
    {
      id: "completion",
      label: "Conclusão e Entrega",
      active: false,
      completed: false,
      disabled: true,
      statusValues: [ServiceOrderStatus.COMPLETED, ServiceOrderStatus.DELIVERED],
    },
  ];

  constructor() {}

  ngOnInit(): void {
    this.updateStepsState();
  }

  ngOnChanges(): void {
    this.updateStepsState();
  }

  updateStepsState(): void {
    if (this.readonly) {
      this.steps.forEach((step) => {
        step.disabled = false;
        step.completed = false;
        step.active = false;
      });
      return;
    }

    let hasPassedCompletion = false;
    let hasPassedExecution = false;
    let hasPassedDiagnosis = false;

    if ([ServiceOrderStatus.DELIVERED].includes(this.currentStatus as ServiceOrderStatus)) {
      hasPassedCompletion = true;
    }

    if ([ServiceOrderStatus.COMPLETED, ServiceOrderStatus.DELIVERED].includes(this.currentStatus as ServiceOrderStatus)) {
      hasPassedExecution = true;
    }

    if ([ServiceOrderStatus.APPROVED, ServiceOrderStatus.IN_PROGRESS, ServiceOrderStatus.WAITING_PARTS, ServiceOrderStatus.COMPLETED, ServiceOrderStatus.DELIVERED].includes(this.currentStatus as ServiceOrderStatus)) {
      hasPassedDiagnosis = true;
    }

    this.steps.forEach((step) => {
      if (step.id === "general") {
        step.completed = hasPassedDiagnosis || this.currentStatus !== ServiceOrderStatus.OPENED;
      } else if (step.id === "diagnosis") {
        step.completed = hasPassedDiagnosis;
      } else if (step.id === "execution") {
        step.completed = hasPassedExecution;
      } else if (step.id === "completion") {
        step.completed = hasPassedCompletion;
      }

      if (step.id === "general") {
        step.disabled = false;
      } else if (step.id === "diagnosis") {
        step.disabled = this.currentStatus === ServiceOrderStatus.OPENED;
      } else if (step.id === "execution") {
        step.disabled = !hasPassedDiagnosis;
      } else if (step.id === "completion") {
        step.disabled = !hasPassedExecution;
      }

      step.active = step.statusValues.includes(this.currentStatus);
    });
  }

  changeTab(stepId: string): void {
    const step = this.steps.find((s) => s.id === stepId);

    if (step && step.disabled && !this.readonly) {
      return;
    }

    this.changeTabEvent.emit(stepId);
  }

  getStatusLabel(status: string): string {
    return ServiceOrderStatusUtils.getStatusLabel(status);
  }
}
