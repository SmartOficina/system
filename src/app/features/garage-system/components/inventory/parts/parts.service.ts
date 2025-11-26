import { Injectable } from "@angular/core";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import { AuthHeaderService } from "@shared/services/auth-header.service";
import { environment } from "@environment/environment";

@Injectable({
  providedIn: "root",
})
export class PartsService {
  constructor(private http: HttpClient) {}

  listParts(search: string, limit: number, page: number, filterStockStatus: string = "all", filterCategory: string = "all", sortOrder: string = "name"): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/parts/list`, { search, limit, page, filterStockStatus, filterCategory, sortOrder }, { headers: AuthHeaderService.header, observe: "response" });
  }

  getPart(id: string): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/parts/get`, { id }, { headers: AuthHeaderService.header, observe: "response" });
  }

  createPart(partData: any): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/parts/create`, partData, { headers: AuthHeaderService.header, observe: "response" });
  }

  editPart(id: string, partData: any): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/parts/edit`, { id, ...partData }, { headers: AuthHeaderService.header, observe: "response" });
  }

  removePart(id: string): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/parts/remove`, { id }, { headers: AuthHeaderService.header, observe: "response" });
  }

  calculateSellingPrice(costPrice: number, profitMargin: number): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/parts/calculate-price`, { costPrice, profitMargin }, { headers: AuthHeaderService.header, observe: "response" });
  }
}
