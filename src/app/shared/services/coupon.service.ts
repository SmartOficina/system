import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CouponService {
  private couponCodeSubject = new BehaviorSubject<string | null>(null);
  public couponCode$ = this.couponCodeSubject.asObservable();

  constructor() {}

  setCouponCode(code: string): void {
    this.couponCodeSubject.next(code);
  }

  getCouponCode(): string | null {
    return this.couponCodeSubject.value;
  }

  clearCouponCode(): void {
    this.couponCodeSubject.next(null);
  }

  hasCoupon(): boolean {
    return this.couponCodeSubject.value !== null;
  }
}