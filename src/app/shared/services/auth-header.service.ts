import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RegistrationTokenService } from './registration-token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthHeaderService {

  constructor(private registrationTokenService: RegistrationTokenService) { }

  public static get header() {
    const h = new HttpHeaders().append('Authorization', 'Bearer ' +  localStorage.getItem('token'));
    return h;
  }

  public getHeaderForRegistration() {
    const tempToken = this.registrationTokenService.getTemporaryToken();
    
    if (tempToken) {
      return new HttpHeaders().append('Authorization', 'Bearer ' + tempToken);
    }
    
    return new HttpHeaders().append('Authorization', 'Bearer ' + localStorage.getItem('token'));
  }
}
