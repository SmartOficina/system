import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@environment/environment';

@Injectable({
  providedIn: 'root'
})
export class DuplicateCheckService {

  constructor(
    private http: HttpClient
  ) { }

  checkPhone(phone: string): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/garage/check-phone`, { phone: phone }, { observe: 'response' });
  }

  checkCnpjCpf(cnpjCpf: string): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/garage/check-cnpj-cpf`, { cnpjCpf: cnpjCpf }, { observe: 'response' });
  }

  checkEmail(email: string): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/garage/check-email`, { email: email }, { observe: 'response' });
  }
}
