import { AuthHeaderService } from "@shared/services/auth-header.service";
import { environment } from "@environment/environment";
import { Injectable } from "@angular/core";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ServiceOrdersService {
  constructor(private http: HttpClient) {}

  listServiceOrders(search: string, limit: number, page: number, status?: string, sortOrder: string = "newest", filterPeriod: string = "all"): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(
      `${environment.api_server}/api/service-orders/list`,
      {
        search,
        limit,
        page,
        status,
        sortOrder,
        filterPeriod,
      },
      {
        headers: AuthHeaderService.header,
        observe: "response",
      }
    );
  }

  createServiceOrder(serviceOrderData: any): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/service-orders/create`, serviceOrderData, { headers: AuthHeaderService.header, observe: "response" });
  }

  updateServiceOrder(id: string, serviceOrderData: any): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/service-orders/edit`, { id, ...serviceOrderData }, { headers: AuthHeaderService.header, observe: "response" });
  }

  removeServiceOrder(id: string): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/service-orders/remove`, { id }, { headers: AuthHeaderService.header, observe: "response" });
  }

  updateServiceOrderStatus(id: string, status: string, notes: string): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/service-orders/status/update`, { id, status, notes }, { headers: AuthHeaderService.header, observe: "response" });
  }

  approveBudget(id: string): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/service-orders/budget/approve`, { id }, { headers: AuthHeaderService.header, observe: "response" });
  }

  rejectBudget(id: string): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/service-orders/budget/reject`, { id }, { headers: AuthHeaderService.header, observe: "response" });
  }

  generateDiagnosticAndBudget(id: string, diagnosticData: any): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/service-orders/diagnostic`, { id, ...diagnosticData }, { headers: AuthHeaderService.header, observe: "response" });
  }

  completeServiceOrder(id: string, completionData: any): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/service-orders/complete`, { id, ...completionData }, { headers: AuthHeaderService.header, observe: "response" });
  }

  deliverVehicle(id: string, paymentMethod?: string, invoiceNumber?: string): Observable<HttpResponse<any>> {
    const body: any = { id };
    if (paymentMethod) body.paymentMethod = paymentMethod;
    if (invoiceNumber) body.invoiceNumber = invoiceNumber;
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/service-orders/deliver`, body, { headers: AuthHeaderService.header, observe: "response" });
  }
}
