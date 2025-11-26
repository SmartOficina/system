export interface Address {
    zipCode: string;
    street: string;
    number: string;
    district: string;
    city: string;
    state: string;
}

export interface Client {
    _id?: string;
    fullName: string;
    cpfCnpj?: string;
    phone: string;
    email?: string;
    birthDate?: string;
    gender?: string;
    photo?: string;
    address: Address;
    createdAt?: string;
    vehicles?: Vehicle[];
}

export interface Vehicle {
    _id?: string;
    clientId: string;
    licensePlate: string;
    brandModel: string;
    yearOfManufacture?: number;
    color?: string;
    chassisNumber?: string;
    createdAt?: string;
    client?: Client;
}

export enum ServiceOrderStatus {
    OPENED = 'aberta',
    DIAGNOSING = 'em_diagnostico',
    WAITING_APPROVAL = 'aguardando_aprovacao',
    APPROVED = 'aprovada',
    REJECTED = 'rejeitada',
    IN_PROGRESS = 'em_andamento',
    WAITING_PARTS = 'aguardando_pecas',
    COMPLETED = 'concluida',
    DELIVERED = 'entregue',
    CANCELED = 'cancelada'
}

export enum PaymentMethod {
    CASH = 'dinheiro',
    CREDIT_CARD = 'cartao_credito',
    DEBIT_CARD = 'cartao_debito',
    PIX_PF = 'pix_pf',
    PIX_PJ = 'pix_pj',
    BANK_TRANSFER = 'transferencia',
    INSTALLMENT = 'parcelado'
}

export interface ChecklistItem {
    description: string;
    checked: boolean;
    notes?: string;
}

export interface PartItem {
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    formattedUnitPrice?: string;
}

export interface ServiceItem {
    description: string;
    estimatedHours: number;
    pricePerHour: number;
    totalPrice: number;
    formattedPricePerHour?: string;
}

export enum ScheduleEventStatus {
    SCHEDULED = 'scheduled',
    COMPLETED = 'completed',
    CANCELED = 'canceled',
    NO_SHOW = 'no_show'
}

export interface ScheduleEvent {
    _id?: string;
    title: string;
    date: string;
    time: string;
    duration: number;
    clientId?: string;
    client?: any;
    vehicleId?: string;
    vehicle?: any;
    serviceTag: string;
    notes?: string;
    status: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Part {
    _id?: string;
    code: string;
    name: string;
    sellingPrice?: number;
    costPrice?: number;
    averageCost?: number;
    profitMargin?: number;
    minimumStock?: number;
    unit: string;
    location?: string;
    barcode?: string;
    manufacturerCode?: string;
    ncmCode?: string;
    cfopCode?: string;
    anpCode?: string;
    anpDescription?: string;
    anpConsumptionState?: string;
    cestCode?: string;
    currentStock?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Supplier {
    _id?: string;
    code: string;
    name: string;
    cnpj: string;
    mobile?: string;
    phone: string;
    email?: string;
    address: {
        street?: string;
        number?: string;
        district?: string;
        city?: string;
        state?: string;
        zipCode?: string;
    };
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface InventoryEntry {
    _id?: string;
    partId: string;
    part?: Part;
    currentQuantity?: number;
    quantity: number;
    costPrice: number;
    profitMargin?: number;
    sellingPrice: number;
    invoiceNumber?: string;
    supplierId?: string;
    supplier?: Supplier;
    description?: string;
    entryDate: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Service {
    _id?: string;
    code: string;
    name: string;
    sellingPrice: number;
    profitMargin: number;
    costPrice: number;
    garageId?: string;
    createdAt?: Date;
}

export type ServiceOrder = any;

export interface OverviewData {
  totalServiceOrders: number;
  monthlyRevenue: number;
  activeClients: number;
  averageTicket: number;
  serviceOrdersChange: number;
  revenueChange: number;
  clientsChange: number;
  ticketChange: number;
  criticalAlerts: Alert[];
}

export interface ServiceOrdersStats {
  statusDistribution: StatusCount[];
  averageCompletionTime: number;
  approvalRate: number;
  totalOrders: number;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface FinancialStats {
  totalRevenue: number;
  averageTicket: number;
  profitMargin: number;
  revenueByPeriod: RevenuePoint[];
  paymentMethodDistribution: PaymentMethodCount[];
}

export interface RevenuePoint {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface PaymentMethodCount {
  method: string;
  count: number;
  totalValue: number;
}

export interface Alert {
  type: 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  action?: string;
  actionUrl?: string;
}

export interface DashboardScheduleEvent {
  id: string;
  title: string;
  time: string;
  clientName?: string;
  vehiclePlate?: string;
  status: string;
  serviceTag: string;
}