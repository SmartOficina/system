import { Routes } from "@angular/router";

export const APP_ROUTES: Routes = [
  {
    path: '',
    loadChildren: () => import('@features/garage-system/garage-system.routes').then(r => r.GARAGE_SYSTEM_ROUTS),
  },
  {
    path: 'approval/:token',
    loadComponent: () => import('@features/garage-system/components/budget-approval/budget-approval.component').then(m => m.BudgetApprovalComponent)
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
