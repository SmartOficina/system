import { AuthHeaderService } from "./auth-header.service";
import { environment } from "@environment/environment";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class PlansService {
  constructor(private http: HttpClient) {}

  getPlans(): Observable<HttpResponse<any>> {
    return this.http.get<HttpResponse<any>>(`${environment.api_server}/api/plans/list`, { observe: "response" });
  }

  getPlansWithAnnualOptions(): Observable<HttpResponse<any>> {
    return this.http.get<HttpResponse<any>>(`${environment.api_server}/api/plans/list-with-annual`, { observe: "response" });
  }

  getPlanById(id: string): Observable<HttpResponse<any>> {
    return this.http.get<HttpResponse<any>>(`${environment.api_server}/api/plans/${id}`, { observe: "response" });
  }

  getPricingConfig(): Observable<HttpResponse<any>> {
    return this.http.get<HttpResponse<any>>(`${environment.api_server}/api/plans/pricing-config`, { observe: "response" });
  }
}
