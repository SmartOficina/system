import { AuthHeaderService } from "@shared/services/auth-header.service";
import { environment } from "@environment/environment";
import { Injectable } from "@angular/core";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ServicesService {
  constructor(private http: HttpClient) {}

  listServices(search: string, limit: number, page: number, sortOrder: string = "newest", filterPeriod: string = "all", filterPriceRange: string = "all"): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(
      `${environment.api_server}/api/services/list`,
      {
        search,
        limit,
        page,
        sortOrder,
        filterPeriod,
        filterPriceRange,
      },
      { headers: AuthHeaderService.header, observe: "response" }
    );
  }

  createService(serviceData: any): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/services/create`, serviceData, { headers: AuthHeaderService.header, observe: "response" });
  }

  editService(id: string, serviceData: any): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/services/edit`, { id, ...serviceData }, { headers: AuthHeaderService.header, observe: "response" });
  }

  removeService(id: string): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/services/remove`, { id }, { headers: AuthHeaderService.header, observe: "response" });
  }
}
