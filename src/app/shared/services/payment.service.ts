import { Injectable } from "@angular/core";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "@environment/environment";
import { AuthHeaderService } from "./auth-header.service";

@Injectable({
  providedIn: "root",
})
export class PaymentService {
  constructor(private http: HttpClient, private authHeaderService: AuthHeaderService) {}

  processPayment(paymentData: any, isRegistrationMode: boolean = false): Observable<HttpResponse<any>> {
    if (isRegistrationMode) {
      return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/payment/process`, paymentData, { observe: "response", headers: this.authHeaderService.getHeaderForRegistration() });
    }
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/payment/process`, paymentData, { observe: "response", headers: AuthHeaderService.header });
  }

  renewSubscription(renewalData: any): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/payment/renew`, renewalData, { observe: "response", headers: AuthHeaderService.header });
  }

  upgradePlan(upgradeData: any): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/payment/upgrade`, upgradeData, { observe: "response", headers: AuthHeaderService.header });
  }

  previewPlanChange(changeData: any): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/payment/preview-change`, changeData, { observe: "response", headers: AuthHeaderService.header });
  }

  checkPaymentStatus(paymentId: string, isRegistrationMode: boolean = false): Observable<HttpResponse<any>> {
    if (isRegistrationMode) {
      return this.http.get<HttpResponse<any>>(`${environment.api_server}/api/payment/status/${paymentId}`, { observe: "response", headers: this.authHeaderService.getHeaderForRegistration() });
    }
    return this.http.get<HttpResponse<any>>(`${environment.api_server}/api/payment/status/${paymentId}`, { observe: "response", headers: AuthHeaderService.header });
  }

  validateCoupon(code: string, planId: string, interval?: "monthly" | "yearly", isRegistrationMode: boolean = false): Observable<any> {
    if (isRegistrationMode) {
      return this.http.post<any>(`${environment.api_server}/api/coupons/validate`, { code, planId, interval: interval || "monthly" }, { headers: this.authHeaderService.getHeaderForRegistration() });
    }
    return this.http.post<any>(`${environment.api_server}/api/coupons/validate`, { code, planId, interval: interval || "monthly" }, { headers: AuthHeaderService.header });
  }

  getPlanForCoupon(couponCode: string, isRegistrationMode: boolean = false): Observable<HttpResponse<any>> {
    if (isRegistrationMode) {
      return this.http.get<HttpResponse<any>>(`${environment.api_server}/api/coupons/plan/${couponCode}`, { observe: "response", headers: this.authHeaderService.getHeaderForRegistration() });
    }
    return this.http.get<HttpResponse<any>>(`${environment.api_server}/api/coupons/plan/${couponCode}`, { observe: "response", headers: AuthHeaderService.header });
  }
}
