import { Component, EventEmitter, Input, Output, TemplateRef } from "@angular/core";
import { NgFor, NgIf, NgClass } from "@angular/common";
import { FormatDatePipe } from "../../pipes/format-date.pipe";
import { TableSkeletonComponent } from "../table-skeleton/table-skeleton.component";

export interface TableColumn {
  header: string;
  field: string;
  align?: string;
  isDate?: boolean;
  type?: string;
  hasVehicles?: boolean;
  template?: TemplateRef<any>;
  transform?: (value: any, item?: any) => string;
  customClasses?: (value: any, item?: any) => string;
  isHtml?: boolean;
}

@Component({
  selector: "app-generic-table",
  imports: [NgFor, NgIf, NgClass, FormatDatePipe, TableSkeletonComponent],
  templateUrl: "./generic-table.component.html",
  styleUrls: ["./generic-table.component.scss"],
})
export class GenericTableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() isLoading: boolean = false;
  @Input() itemsPerPage: number = 10;

  @Input() selectable: boolean = false;
  @Input() selectedItems: any[] = [];
  @Output() selectedItemsChange = new EventEmitter<any[]>();

  @Output() edit = new EventEmitter<any>();
  @Output() remove = new EventEmitter<any>();
  @Output() view = new EventEmitter<any>();
  @Output() print = new EventEmitter<any>();
  @Output() viewVehicles = new EventEmitter<any>();
  @Output() viewClient = new EventEmitter<any>();
  @Output() viewHistory = new EventEmitter<any>();
  @Output() viewVehicle = new EventEmitter<any>();
  @Output() viewServiceOrder = new EventEmitter<any>();
  @Output() viewSupplier = new EventEmitter<any>();
  @Output() viewPart = new EventEmitter<any>();

  getCellValue(item: any, field: string): any {
    return field.split(".").reduce((prev, curr) => (prev ? prev[curr] : ""), item);
  }

  getCellClasses(item: any, column: TableColumn): string {
    if (column.customClasses) {
      const value = this.getCellValue(item, column.field);
      return column.customClasses(value, item);
    }
    return "";
  }

  openWhatsApp(phone: string): void {
    if (!phone) return;

    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.length >= 10) {
      const whatsappUrl = `https://wa.me/55${cleanPhone}`;
      window.open(whatsappUrl, "_blank");
    }
  }

  onEdit(item: any): void {
    this.edit.emit(item);
  }

  onRemove(item: any): void {
    this.remove.emit(item);
  }

  onView(item: any): void {
    this.view.emit(item);
  }

  onPrint(item: any): void {
    this.print.emit(item);
  }

  onViewVehicles(item: any): void {
    this.viewVehicles.emit(item);
  }

  onViewClient(item: any): void {
    this.viewClient.emit(item);
  }

  onViewHistory(item: any): void {
    this.viewHistory.emit(item);
  }

  onViewVehicle(item: any): void {
    this.viewVehicle.emit(item);
  }

  onViewServiceOrder(item: any): void {
    this.viewServiceOrder.emit(item);
  }

  onViewSupplier(item: any): void {
    this.viewSupplier.emit(item);
  }

  onViewPart(item: any): void {
    this.viewPart.emit(item);
  }

  getNonActionColumns(): TableColumn[] {
    return this.columns.filter((col) => col.field !== "actions");
  }

  getActionColumn(): TableColumn | undefined {
    return this.columns.find((col) => col.field === "actions");
  }

  isSelected(item: any): boolean {
    return this.selectedItems.some((selectedItem) => (selectedItem._id && item._id && selectedItem._id === item._id) || (selectedItem.id && item.id && selectedItem.id === item.id));
  }

  toggleSelect(item: any): void {
    if (this.isSelected(item)) {
      this.selectedItems = this.selectedItems.filter((selectedItem) => (selectedItem._id && item._id && selectedItem._id !== item._id) || (selectedItem.id && item.id && selectedItem.id !== item.id));
    } else {
      this.selectedItems = [...this.selectedItems, item];
    }
    this.selectedItemsChange.emit(this.selectedItems);
  }

  isAllSelected(): boolean {
    return this.data.length > 0 && this.selectedItems.length === this.data.length;
  }

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedItems = [];
    } else {
      this.selectedItems = [...this.data];
    }
    this.selectedItemsChange.emit(this.selectedItems);
  }

  getSkeletonColumns(): string[] {
    return this.getNonActionColumns().map((col) => col.header);
  }
}
