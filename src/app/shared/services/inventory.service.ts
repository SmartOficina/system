import { Injectable } from "@angular/core";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import { AuthHeaderService } from "@shared/services/auth-header.service";
import { environment } from "@environment/environment";

@Injectable({
  providedIn: "root",
})
export class InventoryService {
  constructor(private http: HttpClient) {}

  checkPartsAvailability(partsList: { partId: string; quantity: number }[]): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/parts/check-availability`, { parts: partsList }, { headers: AuthHeaderService.header, observe: "response" });
  }

  getPartStock(partId: string): Observable<HttpResponse<any>> {
    return this.http.get<HttpResponse<any>>(`${environment.api_server}/api/parts/${partId}/stock`, { headers: AuthHeaderService.header, observe: "response" });
  }
}
