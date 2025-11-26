import { Injectable } from "@angular/core";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import { AuthHeaderService } from "@shared/services/auth-header.service";
import { environment } from "@environment/environment";

@Injectable({
  providedIn: "root",
})
export class SuppliersService {
  constructor(private http: HttpClient) {}

  listSuppliers(search: string, limit: number, page: number, filterPeriod: string = "all", filterState: string = "all", sortOrder: string = "name"): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/suppliers/list`, { search, limit, page, filterPeriod, filterState, sortOrder }, { headers: AuthHeaderService.header, observe: "response" });
  }

  getSupplier(id: string): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/suppliers/get`, { id }, { headers: AuthHeaderService.header, observe: "response" });
  }

  createSupplier(supplierData: any): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/suppliers/create`, supplierData, { headers: AuthHeaderService.header, observe: "response" });
  }

  editSupplier(id: string, supplierData: any): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/suppliers/edit`, { id, ...supplierData }, { headers: AuthHeaderService.header, observe: "response" });
  }

  removeSupplier(id: string): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/suppliers/remove`, { id }, { headers: AuthHeaderService.header, observe: "response" });
  }
}
