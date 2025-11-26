import { Injectable } from "@angular/core";
import { GarageSystemService } from "@features/garage-system/garage-system.service";
import { PermissionService } from "@shared/services/permission.service";
import { Observable, map } from "rxjs";

export interface PermissionSet {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  [key: string]: boolean;
}

@Injectable({
  providedIn: "root",
})
export class PermissionHelperService {
  // prettier-ignore
  constructor(
    private permissionService: PermissionService,
    private garageSystemService: GarageSystemService
  ) { }

  getEntityPermissions(entityType: string): Observable<PermissionSet> {
    return this.permissionService.hasAllPermissions([`${entityType}:view`, `${entityType}:create`, `${entityType}:edit`, `${entityType}:delete`]).pipe(
      map((hasAll) => {
        if (hasAll) {
          return {
            view: true,
            create: true,
            edit: true,
            delete: true,
          };
        }

        return {
          view: this.hasPermissionSync(`${entityType}:view`),
          create: this.hasPermissionSync(`${entityType}:create`),
          edit: this.hasPermissionSync(`${entityType}:edit`),
          delete: this.hasPermissionSync(`${entityType}:delete`),
        };
      })
    );
  }

  checkPermission(hasPermission: boolean, actionDescription: string): boolean {
    if (!hasPermission) {
      this.garageSystemService.alertUpgradeRequired(actionDescription);
      return false;
    }
    return true;
  }

  private hasPermissionSync(permission: string): boolean {
    let result = false;
    this.permissionService
      .hasPermission(permission)
      .subscribe((hasPermission) => {
        result = hasPermission;
      })
      .unsubscribe();
    return result;
  }
}
