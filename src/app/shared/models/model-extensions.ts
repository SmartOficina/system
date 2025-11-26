import { Part, ServiceItem, PartItem, Service } from "./models";

export interface PartItemWithInventory extends PartItem {
  partId?: string;
  fromInventory?: boolean;
  code?: string;
}

export interface ServiceItemWithPricing extends ServiceItem {
  serviceId?: string;
  code?: string;
}

export interface InventoryOperation {
  partId: string;
  quantity: number;
  serviceOrderId?: string;
  operationType: "consume" | "restore";
}

export interface StockAvailability {
  partId: string;
  available: boolean;
  requiredQuantity: number;
  availableQuantity: number;
  partName?: string;
}

export interface InventoryOperationResult {
  success: boolean;
  message: string;
  failedItems?: {
    partId: string;
    partName?: string;
    requestedQuantity: number;
    availableQuantity: number;
  }[];
}
