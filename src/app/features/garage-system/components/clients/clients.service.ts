import { AuthHeaderService } from "@shared/services/auth-header.service";
import { environment } from "@environment/environment";
import { Injectable } from "@angular/core";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import { catchError, retry } from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class ClientsService {
  // prettier-ignore
  constructor(
    private http: HttpClient
  ) { }

  listClients(search: string, limit: number, page: number, sortOrder: string = "newest", filterPeriod: string = "all", filterVehicleStatus: string = "all"): Observable<HttpResponse<any>> {
    const numericLimit = Number(limit);
    const numericPage = Number(page);

    return this.http
      .post<HttpResponse<any>>(
        `${environment.api_server}/api/clients/list`,
        {
          search,
          limit: numericLimit,
          page: numericPage,
          sortOrder,
          filterPeriod,
          filterVehicleStatus,
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

  createClient(clientData: any): Observable<HttpResponse<any>> {
    return this.http
      .post<HttpResponse<any>>(`${environment.api_server}/api/clients/create`, clientData, {
        headers: AuthHeaderService.header,
        observe: "response",
      })
      .pipe(
        catchError((error) => {
          throw error;
        })
      );
  }

  editClient(id: string, clientData: any): Observable<HttpResponse<any>> {
    return this.http
      .post<HttpResponse<any>>(
        `${environment.api_server}/api/clients/edit`,
        { id, ...clientData },
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

  removeClient(id: string): Observable<HttpResponse<any>> {
    return this.http
      .post<HttpResponse<any>>(
        `${environment.api_server}/api/clients/remove`,
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

  updateClientPhoto(id: string, photoBase64: string): Observable<HttpResponse<any>> {
    return this.http
      .post<HttpResponse<any>>(
        `${environment.api_server}/api/clients/update-photo`,
        { id, photoBase64 },
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

  removeClientPhoto(id: string): Observable<HttpResponse<any>> {
    return this.http
      .post<HttpResponse<any>>(
        `${environment.api_server}/api/clients/remove-photo`,
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
}
