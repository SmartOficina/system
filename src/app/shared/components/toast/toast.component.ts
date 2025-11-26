import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { Subscription } from "rxjs";
import { NgIf, NgClass } from "@angular/common";
import { Toast, ToastType } from "@shared/models/toast.model";
import { ToastService } from "@shared/services/toast.service";

@Component({
  selector: "app-toast",
  templateUrl: "./toast.component.html",
  styleUrls: ["./toast.component.scss"],
  standalone: true,
  // prettier-ignore
  imports: [
    NgIf,
    NgClass
  ],
})
export class ToastComponent implements OnInit, OnDestroy {
  active: boolean = false;
  toast: Toast | null = null;
  progressActive: boolean = false;
  private subscription: Subscription | null = null;
  private timer1: any;
  private timer2: any;

  constructor(private toastService: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.subscription = this.toastService.getToasts().subscribe((toast) => {
      this.showToast(toast);
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.clearTimers();
  }

  showToast(toast: Toast): void {
    this.clearTimers();

    this.toast = toast;
    this.active = false;
    this.progressActive = false;

    this.cdr.detectChanges();

    setTimeout(() => {
      this.active = true;
      this.progressActive = true;
      this.cdr.detectChanges();

      const duration = toast.duration || 5000;

      this.timer1 = setTimeout(() => {
        this.active = false;
        this.cdr.detectChanges();
      }, duration);

      this.timer2 = setTimeout(() => {
        this.progressActive = false;
        this.cdr.detectChanges();
      }, duration + 300);
    }, 10);
  }

  close(): void {
    this.active = false;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.progressActive = false;
      this.cdr.detectChanges();
    }, 300);

    this.clearTimers();
  }

  getIconPath(): string {
    switch (this.toast?.type) {
      case ToastType.SUCCESS:
        return "../../../../assets/icons/check-solid.svg";
      case ToastType.ERROR:
        return "../../../../assets/icons/xmark-solid.svg";
      case ToastType.WARNING:
        return "../../../../assets/icons/exclamation-solid.svg";
      case ToastType.INFO:
        return "../../../../assets/icons/info-solid.svg";
      default:
        return "../../../../assets/icons/check-solid.svg";
    }
  }

  getToastClass(): string {
    switch (this.toast?.type) {
      case ToastType.SUCCESS:
        return "success";
      case ToastType.ERROR:
        return "error";
      case ToastType.WARNING:
        return "warning";
      case ToastType.INFO:
        return "info";
      default:
        return "success";
    }
  }

  private clearTimers(): void {
    if (this.timer1) {
      clearTimeout(this.timer1);
    }
    if (this.timer2) {
      clearTimeout(this.timer2);
    }
  }
}
