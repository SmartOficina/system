import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpResponse } from "@angular/common/http";
import { environment } from "@environment/environment";
import { Observable } from "rxjs";
import { AuthHeaderService } from "@shared/services/auth-header.service";
import { catchError, retry } from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class VehiclesService {
  constructor(private http: HttpClient) {}

  listVehicles(search: string, limit: number, page: number, sortOrder: string = "newest", filterPeriod: string = "all", inGarage: boolean = false): Observable<HttpResponse<any>> {
    const numericLimit = Number(limit);
    const numericPage = Number(page);

    return this.http
      .post<HttpResponse<any>>(
        `${environment.api_server}/api/vehicles/list`,
        {
          search,
          limit: numericLimit,
          page: numericPage,
          sortOrder,
          filterPeriod,
          inGarage,
        },
        {
          headers: AuthHeaderService.header,
          observe: "response",
        }
      )
      .pipe(
        retry(1),
        catchError((error) => {
          throw error;
        })
      );
  }

  createVehicle(vehicleData: any): Observable<HttpResponse<any>> {
    return this.http
      .post<HttpResponse<any>>(`${environment.api_server}/api/vehicles/create`, vehicleData, {
        headers: AuthHeaderService.header,
        observe: "response",
      })
      .pipe(
        catchError((error) => {
          throw error;
        })
      );
  }

  editVehicle(id: string, vehicleData: any): Observable<HttpResponse<any>> {
    return this.http
      .post<HttpResponse<any>>(
        `${environment.api_server}/api/vehicles/edit`,
        { id, ...vehicleData },
        {
          headers: AuthHeaderService.header,
          observe: "response",
        }
      )
      .pipe(
        catchError((error) => {
          throw error;
        })
      );
  }

  removeVehicle(id: string): Observable<HttpResponse<any>> {
    return this.http
      .post<HttpResponse<any>>(
        `${environment.api_server}/api/vehicles/remove`,
        { id },
        {
          headers: AuthHeaderService.header,
          observe: "response",
        }
      )
      .pipe(
        catchError((error) => {
          throw error;
        })
      );
  }

  getVehicleInfoByPlate(plate: string): Observable<HttpResponse<any>> {
    return this.http
      .get<HttpResponse<any>>(`${environment.api_server}/api/vehicles/info/${plate}`, {
        headers: AuthHeaderService.header,
        observe: "response",
      })
      .pipe(
        catchError((error) => {
          throw error;
        })
      );
  }

  getVehicleHistory(vehicleId: string): Observable<HttpResponse<any>> {
    return this.http
      .post<HttpResponse<any>>(
        `${environment.api_server}/api/service-orders/vehicle-history`,
        { vehicleId },
        {
          headers: AuthHeaderService.header,
          observe: "response",
        }
      )
      .pipe(
        catchError((error) => {
          throw error;
        })
      );
  }
}
