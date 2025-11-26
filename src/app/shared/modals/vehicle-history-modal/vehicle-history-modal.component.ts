import { Component, EventEmitter, Input, OnInit, Output, Pipe, PipeTransform } from "@angular/core";
import { NgClass, NgFor, NgIf, DatePipe } from "@angular/common";
import { PaginationComponent } from "@shared/components/pagination/pagination.component";
import { PrintService } from "@shared/services/print.service";

interface ServiceItem {
  description: string;
  estimatedHours: number;
  pricePerHour: number;
  totalPrice: number;
  _id: string;
}

interface PartItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  _id: string;
}

interface ServiceOrder {
  _id: string;
  orderNumber: string;
  openingDate: string;
  status: string;
  reportedProblem: string;
  identifiedProblems: string[];
  services: ServiceItem[];
  requiredParts: PartItem[];
  completionDate?: string;
  estimatedTotalParts: number;
  estimatedTotalServices: number;
  estimatedTotal: number;
  finalTotal: number;
  technicalObservations: string;
  clientId: string;
  client?: {
    fullName: string;
    [key: string]: any;
  } | null;
  vehicle: {
    licensePlate: string;
    brandModel: string;
    [key: string]: any;
  };
}

interface VehicleHistory {
  history: ServiceOrder[];
  summary: {
    totalServices: number;
    totalParts: number;
    totalOrders: number;
  };
}

@Pipe({
  name: "brazilianCurrency",
  standalone: true,
})
export class BrazilianCurrencyPipe implements PipeTransform {
  transform(value: number): string {
    if (!value && value !== 0) return "";
    return (
      "R$ " +
      value
        .toFixed(2)
        .replace(".", ",")
        .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    );
  }
}

@Component({
  selector: "app-vehicle-history-modal",
  templateUrl: "./vehicle-history-modal.component.html",
  styleUrls: ["./vehicle-history-modal.component.scss"],
  imports: [NgFor, NgIf, NgClass, BrazilianCurrencyPipe, DatePipe, PaginationComponent],
})
export class VehicleHistoryModalComponent implements OnInit {
  @Input() vehicleHistory: VehicleHistory = { history: [], summary: { totalServices: 0, totalParts: 0, totalOrders: 0 } };
  @Input() vehicleInfo: { licensePlate: string; brandModel: string } = { licensePlate: "", brandModel: "" };
  @Output() closeModalEvent: EventEmitter<void> = new EventEmitter<void>();

  expandedOrderId: string | null = null;

  currentPage: number = 1;
  itemsPerPage: number = 5;
  paginatedHistory: ServiceOrder[] = [];
  totalPages: number = 1;

  statusTranslations: { [key: string]: string } = {
    aberta: "Aberta",
    em_diagnostico: "Em Diagnóstico",
    aguardando_aprovacao: "Aguardando Aprovação",
    aprovada: "Aprovada",
    rejeitada: "Rejeitada",
    em_andamento: "Em Andamento",
    aguardando_pecas: "Aguardando Peças",
    concluida: "Concluída",
    entregue: "Entregue",
    cancelada: "Cancelada",
  };

  statusColors: { [key: string]: string } = {
    aberta: "bg-blue-100 text-blue-800",
    em_diagnostico: "bg-purple-100 text-purple-800",
    aguardando_aprovacao: "bg-yellow-100 text-yellow-800",
    aprovada: "bg-green-100 text-green-800",
    rejeitada: "bg-red-100 text-red-800",
    em_andamento: "bg-indigo-100 text-indigo-800",
    aguardando_pecas: "bg-amber-100 text-amber-800",
    concluida: "bg-emerald-100 text-emerald-800",
    entregue: "bg-teal-100 text-teal-800",
    cancelada: "bg-gray-100 text-gray-800",
  };

  constructor(private printService: PrintService) {}

  ngOnInit(): void {
    this.expandedOrderId = null;

    if (this.vehicleHistory.history && this.vehicleHistory.history.length > 0) {
      this.initPagination();

      if (this.vehicleHistory.history.length === 1) {
        this.expandedOrderId = this.vehicleHistory.history[0]._id;
      }
    }
  }

  initPagination(): void {
    this.totalPages = Math.ceil(this.vehicleHistory.history.length / this.itemsPerPage);
    this.changePage(1);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, this.vehicleHistory.history.length);

    this.paginatedHistory = this.vehicleHistory.history.slice(startIndex, endIndex);
  }

  printOrder(order: ServiceOrder): void {
    const clientName = order.client?.fullName || (typeof order.clientId === "object" ? (order.clientId as any).fullName : "Cliente não informado");

    this.printService.printBudget(order, clientName);
  }

  toggleOrderDetails(orderId: string): void {
    if (this.expandedOrderId === orderId) {
      this.expandedOrderId = null;
    } else {
      this.expandedOrderId = orderId;
    }
  }

  getStatusTranslation(status: string): string {
    return this.statusTranslations[status] || status;
  }

  getStatusClass(status: string): string {
    return this.statusColors[status] || "bg-gray-100 text-gray-800";
  }

  getServiceTotal(services: ServiceItem[]): number {
    if (!services || services.length === 0) return 0;
    return services.reduce((total, service) => total + (service.totalPrice || 0), 0);
  }

  getPartsTotal(parts: PartItem[]): number {
    if (!parts || parts.length === 0) return 0;
    return parts.reduce((total, part) => total + (part.totalPrice || 0), 0);
  }

  closeModal(): void {
    this.closeModalEvent.emit();
  }
}
