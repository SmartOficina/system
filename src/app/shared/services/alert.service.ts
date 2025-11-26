import { Injectable, Injector, ComponentRef, createComponent, ApplicationRef, EnvironmentInjector } from "@angular/core";
import { CustomAlertComponent } from "@shared/components/custom-alert/custom-alert.component";

@Injectable({
  providedIn: "root",
})
export class AlertService {
  private modalComponentRef: ComponentRef<CustomAlertComponent> | null = null;

  constructor(private injector: Injector, private appRef: ApplicationRef, private environmentInjector: EnvironmentInjector) {}


  showAlert(title: string, message: string, type: "success" | "error" | "warning" | "info", confirmButtonText: string = "OK", cancelButtonText?: string, isLoading: boolean = false): Promise<boolean> {
    this.removeComponentFromBody();

    this.modalComponentRef = createComponent(CustomAlertComponent, {
      environmentInjector: this.environmentInjector,
    });

    this.modalComponentRef.instance.title = title;
    this.modalComponentRef.instance.message = message;
    this.modalComponentRef.instance.type = type;
    this.modalComponentRef.instance.confirmButtonText = confirmButtonText;
    this.modalComponentRef.instance.isLoading = isLoading;

    if (cancelButtonText && !isLoading) {
      this.modalComponentRef.instance.cancelButtonText = cancelButtonText;
      this.modalComponentRef.instance.showCancelButton = true;
    }

    this.appRef.attachView(this.modalComponentRef.hostView);

    const domElem = this.modalComponentRef.location.nativeElement;

    document.body.appendChild(domElem);

    return new Promise<boolean>((resolve) => {
      this.modalComponentRef!.instance.confirm.subscribe(() => {
        this.removeComponentFromBody();
        resolve(true);
      });

      this.modalComponentRef!.instance.cancel.subscribe(() => {
        this.removeComponentFromBody();
        resolve(false);
      });
    });
  }

  private removeComponentFromBody(): void {
    if (this.modalComponentRef) {
      this.appRef.detachView(this.modalComponentRef.hostView);
      this.modalComponentRef.destroy();
      this.modalComponentRef = null;
    }
  }
}
