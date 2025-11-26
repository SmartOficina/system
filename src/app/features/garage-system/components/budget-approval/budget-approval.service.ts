import { Injectable } from "@angular/core";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import { AuthHeaderService } from "@shared/services/auth-header.service";
import { environment } from "@environment/environment";

@Injectable({
  providedIn: "root",
})
export class BudgetApprovalService {
  constructor(private http: HttpClient) {}

  generateApprovalLink(serviceOrderId: string): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/service-orders/budget/generate-approval-link`, { serviceOrderId }, { headers: AuthHeaderService.header, observe: "response" });
  }

  getBudgetApprovalDetails(token: string): Observable<HttpResponse<any>> {
    return this.http.get<HttpResponse<any>>(`${environment.api_server}/api/service-orders/budget/approval-details/${token}`, { observe: "response" });
  }

  approveBudgetViaLink(token: string): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/service-orders/budget/approve-external`, { token }, { observe: "response" });
  }

  rejectBudgetViaLink(token: string, reason?: string): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/service-orders/budget/reject-external`, { token, reason }, { observe: "response" });
  }
}
