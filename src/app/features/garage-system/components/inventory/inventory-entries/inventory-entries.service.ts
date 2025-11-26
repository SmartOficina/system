import { Injectable } from "@angular/core";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import { AuthHeaderService } from "@shared/services/auth-header.service";
import { environment } from "@environment/environment";

@Injectable({
  providedIn: "root",
})
export class InventoryEntriesService {
  constructor(private http: HttpClient) {}

  listEntries(params: { search?: string; limit?: number; page?: number; partId?: string; supplierId?: string; movementType?: string; startDate?: string; endDate?: string }): Observable<HttpResponse<any>> {
    const filteredParams: any = {};
    Object.keys(params).forEach((key) => {
      const value = (params as any)[key];
      if (value !== "" && value !== null && value !== undefined) {
        filteredParams[key] = value;
      }
    });

    return this.http.get<HttpResponse<any>>(`${environment.api_server}/api/inventory-entries/list`, {
      headers: AuthHeaderService.header,
      observe: "response",
      params: filteredParams,
    });
  }

  createEntry(entryData: any): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/inventory-entries/create`, entryData, { headers: AuthHeaderService.header, observe: "response" });
  }

  editEntry(id: string, entryData: any): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/inventory-entries/edit`, { id, ...entryData }, { headers: AuthHeaderService.header, observe: "response" });
  }

  removeEntry(id: string): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/inventory-entries/remove`, { id }, { headers: AuthHeaderService.header, observe: "response" });
  }

  createManualExit(exitData: { partId: string; quantity: number; description: string; exitType: string; reference?: string; costPrice?: number; sellingPrice?: number }): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/inventory-entries/create-exit`, exitData, { headers: AuthHeaderService.header, observe: "response" });
  }

  calculateSellingPrice(costPrice: number, profitMargin: number): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/inventory-entries/calculate-price`, { costPrice, profitMargin }, { headers: AuthHeaderService.header, observe: "response" });
  }
}
