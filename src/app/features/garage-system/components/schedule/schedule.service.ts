import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environment/environment';
import { AuthHeaderService } from '@shared/services/auth-header.service';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {

  constructor(private http: HttpClient) { }

  getEvents(startDate: string, endDate: string, search: string = ''): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(
      `${environment.api_server}/api/schedule/list`,
      { startDate, endDate, search },
      { headers: AuthHeaderService.header, observe: 'response' }
    );
  }

  createEvent(eventData: any): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(
      `${environment.api_server}/api/schedule/create`,
      eventData,
      { headers: AuthHeaderService.header, observe: 'response' }
    );
  }

  updateEvent(id: string, eventData: any): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(
      `${environment.api_server}/api/schedule/update`,
      { id, ...eventData },
      { headers: AuthHeaderService.header, observe: 'response' }
    );
  }

  removeEvent(id: string): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(
      `${environment.api_server}/api/schedule/remove`,
      { id },
      { headers: AuthHeaderService.header, observe: 'response' }
    );
  }

  updateEventStatus(id: string, status: string): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(
      `${environment.api_server}/api/schedule/status/update`,
      { id, status },
      { headers: AuthHeaderService.header, observe: 'response' }
    );
  }
}