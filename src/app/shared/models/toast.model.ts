export enum ToastType {
  SUCCESS = "success",
  ERROR = "error",
  WARNING = "warning",
  INFO = "info",
}

export interface Toast {
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}
