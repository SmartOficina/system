import { Injectable } from "@angular/core";
import { Toast, ToastType } from "@shared/models/toast.model";
import { Subject, Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ToastService {
  private toastSubject = new Subject<Toast>();

  constructor() {}

  getToasts(): Observable<Toast> {
    return this.toastSubject.asObservable();
  }

  show(toast: Toast): void {
    this.toastSubject.next(toast);
  }

  success(title: string, message: string, duration: number = 5000): void {
    this.show({
      type: ToastType.SUCCESS,
      title,
      message,
      duration,
    });
  }

  error(title: string, message: string, duration: number = 5000): void {
    this.show({
      type: ToastType.ERROR,
      title,
      message,
      duration,
    });
  }

  warning(title: string, message: string, duration: number = 5000): void {
    this.show({
      type: ToastType.WARNING,
      title,
      message,
      duration,
    });
  }

  info(title: string, message: string, duration: number = 5000): void {
    this.show({
      type: ToastType.INFO,
      title,
      message,
      duration,
    });
  }
}
