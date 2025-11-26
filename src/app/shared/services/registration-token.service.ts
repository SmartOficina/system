import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RegistrationTokenService {
  private temporaryToken: string | null = null;

  constructor() { }

  setTemporaryToken(token: string): void {
    this.temporaryToken = token;
  }

  getTemporaryToken(): string | null {
    return this.temporaryToken;
  }

  clearTemporaryToken(): void {
    this.temporaryToken = null;
  }

  hasTemporaryToken(): boolean {
    return this.temporaryToken !== null;
  }
}