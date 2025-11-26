import { GarageSystemService } from '@features/garage-system/garage-system.service';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  constructor(private garageSystemService: GarageSystemService) { }

  hasPermission(permission: string): Observable<boolean> {
    return this.garageSystemService.garageInfo$.pipe(
      map(garageInfo => {
        if (!garageInfo) return false;

        const permissions = garageInfo?.subscription?.plan?.permissions || [];
        return permissions.includes(permission);
      })
    );
  }

  hasAnyPermission(permissions: string[]): Observable<boolean> {
    return this.garageSystemService.garageInfo$.pipe(
      map(garageInfo => {
        if (!garageInfo) return false;

        const userPermissions = garageInfo?.subscription?.plan?.permissions || [];
        return permissions.some(permission => userPermissions.includes(permission));
      })
    );
  }

  hasAllPermissions(permissions: string[]): Observable<boolean> {
    return this.garageSystemService.garageInfo$.pipe(
      map(garageInfo => {
        if (!garageInfo) return false;

        const userPermissions = garageInfo?.subscription?.plan?.permissions || [];
        return permissions.every(permission => userPermissions.includes(permission));
      })
    );
  }
}