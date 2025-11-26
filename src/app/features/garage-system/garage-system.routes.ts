import { AuthGuard } from "@shared/guards/auth.guard";
import { Routes } from "@angular/router";
import { NavbarComponent } from "./components/navbar/navbar.component";
export const GARAGE_SYSTEM_ROUTS: Routes = [
  {
    path: "",
    component: NavbarComponent,
    children: [
      {
        path: "",
        redirectTo: "dashboard",
        pathMatch: "full",
      },
      {
        path: "dashboard",
        loadComponent: () => import("./components/dashboard/dashboard.component").then((c) => c.DashboardComponent),
      },
      {
        path: "clients",
        loadComponent: () => import("./components/clients/clients.component").then((c) => c.ClientsComponent),
      },
      {
        path: "vehicles",
        loadComponent: () => import("./components/vehicles/vehicles.component").then((c) => c.VehiclesComponent),
      },
      {
        path: "inventory",
        children: [
          {
            path: "",
            redirectTo: "stock",
            pathMatch: "full",
          },
          {
            path: "stock",
            loadComponent: () => import("./components/inventory/inventory-stock/inventory-stock.component").then((c) => c.InventoryStockComponent),
          },
          {
            path: "parts",
            loadComponent: () => import("./components/inventory/parts/parts.component").then((c) => c.PartsComponent),
          },
          {
            path: "suppliers",
            loadComponent: () => import("./components/inventory/suppliers/suppliers.component").then((c) => c.SuppliersComponent),
          },
          {
            path: "entries",
            loadComponent: () => import("./components/inventory/inventory-entries/inventory-entries.component").then((c) => c.InventoryEntriesComponent),
          },
        ],
      },
      {
        path: "services",
        loadComponent: () => import("./components/services/services.component").then((c) => c.ServicesComponent),
      },
      {
        path: "orders",
        loadComponent: () => import("./components/service-orders/service-orders.component").then((c) => c.ServiceOrdersComponent),
      },
      {
        path: "schedule",
        loadComponent: () => import("./components/schedule/schedule.component").then((c) => c.ScheduleComponent),
      },
      {
        path: "settings",
        loadComponent: () => import("./components/settings/settings.component").then((c) => c.SettingsComponent),
      },
    ],
    canActivate: [AuthGuard],
  },
  { path: "login", loadComponent: () => import("./components/login/login.component").then((c) => c.LoginComponent) },
  { path: "**", redirectTo: "", pathMatch: "full" },
];
