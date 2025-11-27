import { AlertService } from "@shared/services/alert.service";
import { environment } from "@environment/environment";
import { HttpClient, HttpHeaders, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class GarageSystemService {
  private garageSubject = new BehaviorSubject<any>(null);
  public garage$ = this.garageSubject.asObservable();
  public garageInfo$: Observable<any> = this.garageSubject.asObservable();

  constructor(private http: HttpClient, private router: Router, private alertService: AlertService) {}

  garageAuthenticate(identifier: string, password: string, isEmail: boolean = true): Observable<HttpResponse<any>> {
    const payload = isEmail ? { email: identifier, password } : { cnpjCpf: identifier, password };
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/auth/login`, payload, { observe: "response" });
  }

  validateToken(token: string): Observable<HttpResponse<any>> {
    const headers = new HttpHeaders().set("Authorization", `Bearer ${token}`);
    return this.http.get<HttpResponse<any>>(`${environment.api_server}/api/auth/token`, { headers, observe: "response" });
  }

  requestPasswordReset(email: string) {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/garage/resend-code`, { email, context: "password_reset" }, { observe: "response" });
  }

  resetPassword(email: string, code: string, newPassword: string) {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/garage/reset-password`, { email, code, newPassword }, { observe: "response" });
  }

  resendActivationLink(email: string): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/garage/resend-activation-link`, { email }, { observe: "response" });
  }

  updateGarage(garageInfo: any): void {
    this.garageSubject.next(garageInfo);
  }

  autoLogin(response: HttpResponse<any>, redirect: boolean): void {
    localStorage.setItem("token", response.body?.token);
    this.updateGarage(response.body?.garage);
    if (redirect) this.router.navigate(["/dashboard"]);
  }

  garageAuthenticateWithCnpjCpf(cnpjCpf: string, password: string): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${environment.api_server}/api/auth/login`, { cnpjCpf, password }, { observe: "response" });
  }

  alertUpgradeRequired(action: string): void {
    this.alertService.showAlert("Acesso Restrito", `Sua situação atual não permite acesso à funcionalidade de ${action}. Considere mudar para um plano que permita esse recurso.`, "warning", "Beleza");
  }

  handleUpgradePlan(): void {
    window.location.href = environment.landing_url + "?plans=true";
  }

  handleMoreInfo(): void {
    this.alertService.showAlert("Permissão Limitada", "Sua situação atual não permite acesso completo a essa funcionalidade. Veja os planos disponíveis para liberar esse recurso.", "warning", "Tranquilo");
  }
}
