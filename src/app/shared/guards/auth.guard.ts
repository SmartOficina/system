import { HttpResponse } from '@angular/common/http';
import { GarageSystemService } from '@features/garage-system/garage-system.service';
import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(
    private garageSystemService: GarageSystemService,
    private router: Router
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    let token = localStorage.getItem('token');
    const urlToken = route.queryParams['token'];
    
    if (urlToken) {
      localStorage.setItem('token', urlToken);
      token = urlToken;
      
      const urlParams = new URLSearchParams(window.location.search);
      const activated = urlParams.get('activated');
      const email = urlParams.get('email');
      
      if (activated && email) {
        const newUrl = `${state.url.split('?')[0]}?activated=${activated}&token=${token}&email=${encodeURIComponent(email)}`;
        window.history.replaceState({}, document.title, newUrl);
      } else {
        window.history.replaceState({}, document.title, state.url.split('?')[0]);
      }
    }

    if (!token) {
      this.redirectToLogin();
      return of(false);
    }

    return this.garageSystemService.validateToken(token).pipe(map((response: HttpResponse<any>) => {
      if (response.status === 200) {
        this.garageSystemService.updateGarage(response.body?.garage);
        return true;
      }
      this.redirectToLogin();
      return false;
    }),
      catchError(() => {
        this.redirectToLogin();
        return of(false);
      })
    );
  }

  private redirectToLogin(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/system/login']);
  }
}