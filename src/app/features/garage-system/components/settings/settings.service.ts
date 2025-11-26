import { AuthHeaderService } from '@shared/services/auth-header.service';
import { environment } from '@environment/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  constructor(private http: HttpClient) { }

  getGarageInfo(): Observable<HttpResponse<any>> {
    return this.http.get<HttpResponse<any>>(
      `${environment.api_server}/api/settings/garage-info`,
      { headers: AuthHeaderService.header, observe: 'response' }
    );
  }

  updateGarageInfo(garageData: any): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(
      `${environment.api_server}/api/settings/update-garage`,
      garageData,
      { headers: AuthHeaderService.header, observe: 'response' }
    );
  }

  changePassword(passwordData: any): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(
      `${environment.api_server}/api/settings/change-password`,
      passwordData,
      { headers: AuthHeaderService.header, observe: 'response' }
    );
  }

  getSubscriptionInfo(): Observable<HttpResponse<any>> {
    return this.http.get<HttpResponse<any>>(
      `${environment.api_server}/api/settings/subscription-info`,
      { headers: AuthHeaderService.header, observe: 'response' }
    );
  }

  getPermissions(): Observable<HttpResponse<any>> {
    return this.http.get<HttpResponse<any>>(
      `${environment.api_server}/api/settings/permissions`,
      { headers: AuthHeaderService.header, observe: 'response' }
    );
  }

  getSubscriptionHistory(): Observable<HttpResponse<any>> {
    return this.http.get<HttpResponse<any>>(
      `${environment.api_server}/api/settings/subscription-history`,
      { headers: AuthHeaderService.header, observe: 'response' }
    );
  }

  requestPasswordChangeCode(email: string): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(
      `${environment.api_server}/api/settings/request-password-change-code`,
      { email, context: 'password_reset' },
      { headers: AuthHeaderService.header, observe: 'response' }
    );
  }

  changePasswordWithCode(data: { email: string; code: string; newPassword: string }): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(
      `${environment.api_server}/api/settings/change-password-with-code`,
      data,
      { headers: AuthHeaderService.header, observe: 'response' }
    );
  }
}