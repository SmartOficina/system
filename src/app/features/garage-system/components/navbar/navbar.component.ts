import { AlertService } from "@shared/services/alert.service";
import { HeartbeatService } from "@shared/services/heartbeat.service";
import { Component, OnInit, OnDestroy, HostListener } from "@angular/core";
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { filter, Subject, takeUntil } from "rxjs";
import { CommonModule, NgClass, NgIf, NgFor } from "@angular/common";
import { GarageSystemService } from "./../../garage-system.service";

interface MenuItem {
  label: string;
  route: string;
  icon: string;
  description?: string;
  hasSubmenu?: boolean;
  submenuItems?: {
    label: string;
    route: string;
    icon: string;
  }[];
}

@Component({
  selector: "app-navbar",
  templateUrl: "./navbar.component.html",
  styleUrls: ["./navbar.component.scss"],
  imports: [RouterOutlet, NgClass, CommonModule, NgIf, NgFor],
})
export class NavbarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  garageInfo: any;
  lastActive: string = "";
  transitionInProgress: boolean = false;
  isMobileView: boolean = false;
  mobileMenuOpen: boolean = false;
  expandedSubmenus: { [key: string]: boolean } = {};
  breadcrumb: string = "";

  menuItems: MenuItem[] = [
    {
      label: "Dashboard",
      route: "dashboard",
      icon: "../../../../assets/icons/chart-pie-solid.svg",
      description: "Visão geral do negócio",
    },
    {
      label: "Clientes",
      route: "clients",
      icon: "../../../../assets/icons/user-group-solid.svg",
      description: "Gerencie seus clientes",
    },
    {
      label: "Veículos",
      route: "vehicles",
      icon: "../../../../assets/icons/car-solid.svg",
      description: "Gerencie os veículos dos clientes",
    },
    {
      label: "Agenda",
      route: "schedule",
      icon: "../../../../assets/icons/calendar-days-solid.svg",
      description: "Visualize e gerencie sua agenda",
    },
    {
      label: "Ordem de Serviço",
      route: "orders",
      icon: "../../../../assets/icons/file-solid.svg",
      description: "Crie e gerencie ordens de serviço",
    },
    {
      label: "Serviços",
      route: "services",
      icon: "../../../../assets/icons/wrench-solid.svg",
      description: "Gerencie os serviços oferecidos",
    },
    {
      label: "Estoque",
      route: "inventory",
      icon: "../../../../assets/icons/box-solid.svg",
      description: "Gerencie peças, fornecedores e estoque",
      hasSubmenu: true,
      submenuItems: [
        {
          label: "Estoque Atual",
          route: "inventory/stock",
          icon: "../../../../assets/icons/box-open-solid.svg",
        },
        {
          label: "Peças",
          route: "inventory/parts",
          icon: "../../../../assets/icons/gear-solid.svg",
        },
        {
          label: "Fornecedores",
          route: "inventory/suppliers",
          icon: "../../../../assets/icons/truck-solid.svg",
        },
        {
          label: "Movimentações",
          route: "inventory/entries",
          icon: "../../../../assets/icons/file-circle-plus-solid.svg",
        },
      ],
    },
  ];

  constructor(private router: Router, private garageSystemService: GarageSystemService, private heartbeatService: HeartbeatService, private alertService: AlertService) {
    // Garantir que o menu mobile inicie fechado
    this.mobileMenuOpen = false;
    this.checkScreenSize();
  }

  @HostListener("window:resize")
  onResize() {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    // Garantir estado inicial correto
    this.mobileMenuOpen = false;
    
    this.garageSystemService.garageInfo$.pipe(takeUntil(this.destroy$)).subscribe((data) => (this.garageInfo = data));

    this.setBreadcrumb(this.router.url);
    this.initExpandedSubmenus();

    this.router.events
      .pipe(
        takeUntil(this.destroy$),
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe((event) => {
        this.handleRouteChange(event.urlAfterRedirects);
      });

    this.heartbeatService.startHeartbeat();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.heartbeatService.stopHeartbeat();
  }

  private handleRouteChange(url: string): void {
    this.setBreadcrumb(url);
    this.animateRouteTransition(this.getActiveRoute(url));
    this.updateExpandedSubmenus(url);

    // Fechar menu mobile após navegação
    if (this.isMobileView && this.mobileMenuOpen) {
      this.closeMobileMenu();
    }
  }

  private initExpandedSubmenus(): void {
    this.menuItems.forEach((item) => {
      if (item.hasSubmenu) {
        this.expandedSubmenus[item.label] = this.isSubmenuActive(item);
      }
    });
  }

  private updateExpandedSubmenus(url: string): void {
    this.menuItems.forEach((item) => {
      if (item.hasSubmenu && this.isSubmenuItemRouteActive(item, url)) {
        this.expandedSubmenus[item.label] = true;
      }
    });
  }

  isSubmenuActive(item: MenuItem): boolean {
    if (!item.submenuItems) return false;
    return item.submenuItems.some((subItem) => this.router.url.includes(subItem.route));
  }

  private isSubmenuItemRouteActive(item: MenuItem, url: string): boolean {
    if (!item.submenuItems) return false;
    return item.submenuItems.some((subItem) => url.includes(subItem.route));
  }

  isSubmenuItemActive(route: string): boolean {
    return this.router.url.includes(route);
  }

  toggleSubmenu(label: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.expandedSubmenus[label] = !this.expandedSubmenus[label];
  }

  trackById(_index: number, item: MenuItem): string {
    return item.route;
  }

  private checkScreenSize(): void {
    const wasMobile = this.isMobileView;
    this.isMobileView = window.innerWidth < 768;

    // Fechar menu mobile ao mudar para desktop
    if (wasMobile && !this.isMobileView) {
      this.closeMobileMenu();
    }
    
    // Se mudou para mobile, garantir que menu inicie fechado
    if (!wasMobile && this.isMobileView) {
      this.mobileMenuOpen = false;
    }
  }

  private closeMobileMenu(): void {
    this.mobileMenuOpen = false;
    // Restaurar scroll do body
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
  }

  getMenuTransform(): string {
    if (!this.isMobileView) {
      return 'translateX(0)';
    }
    
    return this.mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)';
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    
    // Prevenir scroll do body quando menu estiver aberto
    if (this.mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
  }

  private setBreadcrumb(url: string): void {
    if (url.includes("dashboard")) {
      this.breadcrumb = "Dashboard";
      return;
    }
    
    if (url.includes("settings")) {
      this.breadcrumb = "Configurações";
      return;
    }

    for (const item of this.menuItems) {
      if (item.submenuItems) {
        for (const subItem of item.submenuItems) {
          if (url.includes(subItem.route)) {
            this.breadcrumb = `${item.label} / ${subItem.label}`;
            return;
          }
        }
      }
    }

    const foundItem = this.menuItems.find((item) => url.includes(item.route) && !item.hasSubmenu);
    this.breadcrumb = foundItem ? foundItem.label : this.extractRouteName(url);
  }

  private extractRouteName(url: string): string {
    const segments = url.split("/");
    const lastSegment = segments[segments.length - 1];
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  }

  private getActiveRoute(url: string): string {
    for (const item of this.menuItems) {
      if (item.submenuItems) {
        for (const subItem of item.submenuItems) {
          if (url.includes(subItem.route)) {
            return subItem.route;
          }
        }
      }
    }

    for (const item of this.menuItems) {
      if (!item.hasSubmenu && url.includes(item.route)) {
        return item.route;
      }
    }

    if (url.includes("settings")) {
      return "settings";
    }

    return "";
  }

  private animateRouteTransition(newRoute: string): void {
    if (this.lastActive === newRoute || this.transitionInProgress) {
      return;
    }

    this.transitionInProgress = true;
    this.lastActive = newRoute;

    setTimeout(() => {
      this.transitionInProgress = false;
    }, 300);
  }

  navigateTo(route: string): void {
    if (!this.transitionInProgress) {
      this.router.navigate([route]);

      // Fechar menu mobile após navegação
      if (this.isMobileView && this.mobileMenuOpen) {
        setTimeout(() => this.closeMobileMenu(), 150);
      }
    }
  }

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }

  logout(): void {
    this.alertService.showAlert("Confirmação", "Tem certeza que deseja sair do sistema?", "warning", "Confirmar", "Cancelar").then((confirmed) => {
      if (confirmed) {
        document.body.classList.add("fade-out");

        setTimeout(() => {
          localStorage.removeItem("token");
          this.router.navigate(["/login"]);

          setTimeout(() => {
            document.body.classList.remove("fade-out");
          }, 500);
        }, 300);
      }
    });
  }
}
