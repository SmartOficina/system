import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environment/environment';

@Injectable({
  providedIn: 'root'
})
export class VerifyCodeService {
  constructor(private http: HttpClient) { }

  verifyCode(email: string, code: string, context: 'activation' | 'password_reset') {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/garage/verify-code`, { email, code, context }, { observe: 'response' });
  }

  resendCode(email: string, context: 'activation' | 'password_reset') {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/garage/resend-code`, { email, context }, { observe: 'response' }
    );
  }
}
