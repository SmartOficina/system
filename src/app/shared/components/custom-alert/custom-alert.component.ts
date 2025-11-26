import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-custom-alert",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./custom-alert.component.html",
  styleUrls: ["./custom-alert.component.scss"],
})
export class CustomAlertComponent implements OnInit {
  @Input() title: string = "";
  @Input() message: string = "";
  @Input() type: "success" | "error" | "warning" | "info" = "info";
  @Input() confirmButtonText: string = "OK";
  @Input() cancelButtonText: string = "Cancelar";
  @Input() showCancelButton: boolean = false;
  @Input() isLoading: boolean = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  visible: boolean = false;

  ngOnInit(): void {
    setTimeout(() => {
      this.visible = true;
    }, 10);
  }

  onConfirm(): void {
    this.close(() => this.confirm.emit());
  }

  onCancel(): void {
    this.close(() => this.cancel.emit());
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains("modal-backdrop")) {
      this.onCancel();
    }
  }

  private close(callback: () => void): void {
    this.visible = false;
    setTimeout(() => {
      callback();
    }, 300);
  }

  getIconClass(): string {
    return `icon-${this.type}`;
  }
}
