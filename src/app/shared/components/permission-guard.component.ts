import { NgIf } from "@angular/common";
import { Component, Input } from "@angular/core";
import { GarageSystemService } from "@features/garage-system/garage-system.service";
import { AccessDeniedComponent } from "./access-denied/access-denied.component";

@Component({
  selector: "app-permission-guard",
  // prettier-ignore
  template: `
    <ng-content *ngIf="!showAccessDenied"></ng-content>
    <app-access-denied 
      *ngIf="showAccessDenied" 
      [requiredPermission]="requiredPermission"
      (upgradePlan)="handleUpgradePlan()" 
      (moreInfo)="handleMoreInfo()">
    </app-access-denied>
  `,
  // prettier-ignore
  imports: [
    NgIf,
    AccessDeniedComponent
  ],
})
export class PermissionGuardComponent {
  @Input() showAccessDenied: boolean = false;
  @Input() requiredPermission: string = "";

  constructor(private garageSystemService: GarageSystemService) {}

  handleMoreInfo(): void {
    this.garageSystemService.handleMoreInfo();
  }

  handleUpgradePlan(): void {
    this.garageSystemService.handleUpgradePlan();
  }
}
