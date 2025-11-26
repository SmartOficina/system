import { GarageSystemService } from "./../../garage-system.service";
import { Component, OnInit, OnDestroy, HostListener } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { SettingsService } from "./settings.service";
import { NgIf, NgFor, DatePipe, NgClass, JsonPipe } from "@angular/common";
import { AlertService } from "@shared/services/alert.service";
import { ToastService } from "@shared/services/toast.service";
import { InputGenericComponent } from "@shared/components/input-generic/input-generic.component";
import { AccessDeniedComponent } from "@shared/components/access-denied/access-denied.component";
import { PermissionService } from "@shared/services/permission.service";
import { Subject, takeUntil, finalize } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { PlansService } from "@shared/services/plans.service";
import { CodeInputComponent } from "@shared/components/code-input/code-input.component";

interface TabDefinition {
  label: string;
  icon: string;
  loaded: boolean;
  loading: boolean;
}

interface PermissionGroupInfo {
  name: string;
  permissions: Array<{
    key: string;
    description: string;
    enabled: boolean;
  }>;
}

interface PermissionInfo {
  group: string;
  description: string;
}

@Component({
  selector: "app-settings",
  templateUrl: "./settings.component.html",
  styleUrls: ["./settings.component.scss"],
  standalone: true,
  imports: [FormsModule, NgIf, NgFor, NgClass, DatePipe, InputGenericComponent, AccessDeniedComponent, CodeInputComponent],
})
export class SettingsComponent implements OnInit, OnDestroy {
  isLoading: boolean = false;
  garageInfo: any = {};
  subscription: any = {};
  plan: any = {};
  isEditing: boolean = false;
  isChangingPassword: boolean = false;
  passwordChangeMethod: 'current' | 'email' | null = null;
  passwordChangeStep: number = 0;

  tabs: TabDefinition[] = [
    {
      label: "Informações da Oficina",
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
      loaded: false,
      loading: false,
    },
    {
      label: "Segurança",
      icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
      loaded: false,
      loading: false,
    },
    {
      label: "Permissões",
      icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
      loaded: false,
      loading: false,
    },
    {
      label: "Sistema",
      icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
      loaded: true,
      loading: false,
    },
    {
      label: "Histórico de Pagamentos",
      icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
      loaded: false,
      loading: false,
    },
  ];
  activeTabIndex: number = 0;

  permissions: { [key: string]: boolean } = {};
  permissionGroups: PermissionGroupInfo[] = [];
  subscriptions: any[] = [];
  hasDuplicatePhone: boolean = false;

  editForm = {
    name: "",
    phone: "",
    email: "",
    cnpjCpf: "",
    address: {
      street: "",
      number: "",
      district: "",
      city: "",
      state: "",
      zipCode: "",
    },
  };

  passwordForm = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  };

  newPasswordForm = {
    newPassword: "",
    confirmPassword: "",
  };

  passwordChangeCode: string = "";

  private destroy$ = new Subject<void>();
  private originalGarageData: any = {};

  canViewSettings: boolean = false;
  canEditSettings: boolean = false;
  annualDiscountPercent: number = 20;
  hasUnsavedChanges: boolean = false;

  constructor(private settingsService: SettingsService, private alertService: AlertService, private toastService: ToastService, private permissionService: PermissionService, private garageSystemService: GarageSystemService, private http: HttpClient, private router: Router, private plansService: PlansService) {}

  ngOnInit(): void {
    this.loadPricingConfig();
    this.checkPermissions();
    this.loadTabData(this.activeTabIndex);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPricingConfig(): void {
    this.plansService.getPricingConfig().subscribe({
      next: (response: any) => {
        if (response.body && response.body.result) {
          this.annualDiscountPercent = response.body.result.annualDiscountPercent;
        }
      },
      error: (error) => {
      },
    });
  }

  checkPermissions(): void {
    this.permissionService
      .hasPermission("settings:view")
      .pipe(takeUntil(this.destroy$))
      .subscribe((canView) => {
        this.canViewSettings = canView;
      });

    this.permissionService
      .hasPermission("settings:edit")
      .pipe(takeUntil(this.destroy$))
      .subscribe((canEdit) => {
        this.canEditSettings = canEdit;
      });
  }

  loadTabData(tabIndex: number): void {
    if (this.tabs[tabIndex].loaded || this.tabs[tabIndex].loading) {
      return;
    }

    this.tabs[tabIndex].loading = true;

    switch (tabIndex) {
      case 0:
        this.loadGarageInfo();
        this.loadSubscriptionInfo();
        break;
      case 1:
        if (!this.tabs[0].loaded) {
          this.loadGarageInfo();
        } else {
          this.tabs[tabIndex].loading = false;
          this.tabs[tabIndex].loaded = true;
        }
        break;
      case 2:
        this.loadPermissions();
        if (!this.plan?._id && !this.tabs[0].loaded) {
          this.loadSubscriptionInfo();
        } else {
          this.tabs[tabIndex].loading = false;
          this.tabs[tabIndex].loaded = true;
        }
        break;
      case 3:
        this.tabs[tabIndex].loading = false;
        this.tabs[tabIndex].loaded = true;
        break;
      case 4:
        this.loadSubscriptionHistory();
        break;
    }
  }

  loadGarageInfo(): void {
    const tabIndexes = [0, 1];
    this.settingsService
      .getGarageInfo()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          tabIndexes.forEach((idx) => {
            this.tabs[idx].loading = false;
            this.tabs[idx].loaded = true;
          });
        })
      )
      .subscribe(
        (response: any) => {
          if (response.status === 200) {
            this.garageInfo = response.body?.result || {};
            this.populateEditForm();
          }
        },
        (error: any) => {
          this.alertService.showAlert("Erro", "Não foi possível carregar as informações da oficina.", "error", "Fechar");
        }
      );
  }

  loadSubscriptionInfo(): void {
    const tabIndexes = [0, 2];

    this.settingsService
      .getSubscriptionInfo()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          tabIndexes.forEach((idx) => {
            if (this.activeTabIndex === idx || this.tabs[idx].loading) {
              this.tabs[idx].loading = false;
              this.tabs[idx].loaded = true;
            }
          });
        })
      )
      .subscribe(
        (response: any) => {
          if (response.status === 200) {
            if (response.body?.subscription === null && response.body?.plan === null) {
              this.plan = {
                _id: "free",
                name: "Gratuito",
                price: 0,
                interval: "monthly",
                features: ["Recursos básicos do sistema", "Acesso limitado", "Suporte por e-mail"],
                permissions: ["client:view", "client:create", "vehicle:view", "service-order:view", "settings:view"],
              };

              this.subscription = {
                status: "ACTIVE",
                endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 10)),
              };
            } else {
              this.subscription = response.body?.subscription || {};
              this.plan = response.body?.plan || {};
            }
          }
        },
        (error: any) => {
          this.alertService.showAlert("Atenção", "Não foi possível carregar informações da assinatura. Mostrando plano gratuito.", "warning", "Fechar");

          this.plan = {
            _id: "free",
            name: "Gratuito",
            price: 0,
            interval: "monthly",
            features: ["Recursos básicos do sistema", "Acesso limitado", "Suporte por e-mail"],
            permissions: ["client:view", "client:create", "vehicle:view", "service-order:view", "settings:view"],
          };

          this.subscription = {
            status: "ACTIVE",
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 10)),
          };
        }
      );
  }

  loadPermissions(): void {
    this.settingsService
      .getPermissions()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.tabs[2].loading = false;
          this.tabs[2].loaded = true;
        })
      )
      .subscribe(
        (response: any) => {
          if (response.status === 200) {
            this.permissions = response.body?.permissions || {};
            this.organizePermissionsByGroup();
          }
        },
        (error: any) => {}
      );
  }

  loadSubscriptionHistory(): void {
    this.settingsService
      .getSubscriptionHistory()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.tabs[4].loading = false;
          this.tabs[4].loaded = true;
        })
      )
      .subscribe(
        (response: any) => {
          if (response.status === 200) {
            this.subscriptions = (response.body?.subscriptions || []).map((sub: any) => {
              const paidAmount = this.calculatePaidAmount(sub);
              
              return {
                createdAt: sub.createdAt,
                planName: sub.planId?.name || "Plano",
                planPrice: paidAmount,
                originalPrice: sub.planId?.price || 0,
                planChangeType: sub.planChangeType || "NEW",
                paymentStatus: this.determinePaymentStatus(sub),
                paymentMethod: sub.paymentMethod,
                couponDiscount: sub.couponId ? this.getCouponDiscount(sub) : 0,
                wasFree: paidAmount === 0,
              };
            });
          }
        },
        (error: any) => {}
      );
  }

  private calculatePaidAmount(subscription: any): number {
    if (subscription.paymentMethod === 'free_coupon') {
      return 0;
    }

    if (subscription.couponId) {
      const originalPrice = subscription.planId?.price || 0;
      const discount = this.getCouponDiscount(subscription);
      return originalPrice * (1 - discount / 100);
    }

    return subscription.planId?.price || 0;
  }

  private getCouponDiscount(subscription: any): number {
    if (subscription.couponId?.discount !== undefined) {
      return subscription.couponId.discount;
    }
    
    if (subscription.paymentMethod === 'free_coupon') {
      return 100;
    }

    return 0;
  }

  private determinePaymentStatus(subscription: any): string {
    if (subscription.paymentMethod === 'free_coupon' || this.getCouponDiscount(subscription) === 100) {
      return 'free';
    }

    return subscription.paymentStatus?.toLowerCase() || "pending";
  }

  organizePermissionsByGroup(): void {
    const groups: { [key: string]: PermissionGroupInfo } = {};
    
    const permissionMapping = this.createPermissionMapping();
    Object.keys(this.permissions).forEach(permissionKey => {
      const mapping = permissionMapping[permissionKey];
      if (mapping) {
        if (!groups[mapping.group]) {
          groups[mapping.group] = {
            name: this.getGroupDisplayName(mapping.group),
            permissions: []
          };
        }

        groups[mapping.group].permissions.push({
          key: permissionKey,
          description: mapping.description,
          enabled: this.permissions[permissionKey] || false,
        });
      }
    });

    const groupOrder = [
      'clients', 'vehicles', 'serviceOrders', 'services', 
      'schedule', 'inventory', 'parts', 'suppliers', 'finance', 
      'mechanics', 'support', 'reports', 'settings'
    ];

    this.permissionGroups = groupOrder
      .filter(groupKey => groups[groupKey])
      .map(groupKey => groups[groupKey]);
  }

  private createPermissionMapping(): { [key: string]: PermissionInfo } {
    return {
      "client:view": { group: "clients", description: "Visualizar clientes" },
      "client:create": { group: "clients", description: "Cadastrar clientes" },
      "client:edit": { group: "clients", description: "Editar clientes" },
      "client:delete": { group: "clients", description: "Excluir clientes" },
      "vehicle:view": { group: "vehicles", description: "Visualizar veículos" },
      "vehicle:create": { group: "vehicles", description: "Cadastrar veículos" },
      "vehicle:edit": { group: "vehicles", description: "Editar veículos" },
      "vehicle:delete": { group: "vehicles", description: "Excluir veículos" },
      "vehicle:history:view": { group: "vehicles", description: "Visualizar histórico de veículos" },
      "service-order:view": { group: "serviceOrders", description: "Visualizar ordens de serviço" },
      "service-order:create": { group: "serviceOrders", description: "Criar ordens de serviço" },
      "service-order:edit": { group: "serviceOrders", description: "Editar ordens de serviço" },
      "service-order:delete": { group: "serviceOrders", description: "Excluir ordens de serviço" },
      "service:view": { group: "services", description: "Visualizar serviços" },
      "service:create": { group: "services", description: "Cadastrar serviços" },
      "service:edit": { group: "services", description: "Editar serviços" },
      "service:delete": { group: "services", description: "Excluir serviços" },
      "schedule:view": { group: "schedule", description: "Visualizar agenda" },
      "schedule:create": { group: "schedule", description: "Criar agendamentos" },
      "schedule:edit": { group: "schedule", description: "Editar agendamentos" },
      "schedule:delete": { group: "schedule", description: "Excluir agendamentos" },
      "inventory:view": { group: "inventory", description: "Visualizar estoque" },
      "part:view": { group: "parts", description: "Visualizar peças" },
      "part:create": { group: "parts", description: "Cadastrar peças" },
      "part:edit": { group: "parts", description: "Editar peças" },
      "part:delete": { group: "parts", description: "Excluir peças" },
      "supplier:view": { group: "suppliers", description: "Visualizar fornecedores" },
      "supplier:create": { group: "suppliers", description: "Cadastrar fornecedores" },
      "supplier:edit": { group: "suppliers", description: "Editar fornecedores" },
      "supplier:delete": { group: "suppliers", description: "Excluir fornecedores" },
      "inventory-entry:view": { group: "inventory", description: "Visualizar entradas de estoque" },
      "inventory-entry:create": { group: "inventory", description: "Criar entradas de estoque" },
      "inventory-entry:edit": { group: "inventory", description: "Editar entradas de estoque" },
      "inventory-entry:delete": { group: "inventory", description: "Excluir entradas de estoque" },
      "finance:view": { group: "finance", description: "Visualizar financeiro" },
      "finance:create": { group: "finance", description: "Lançar movimentações financeiras" },
      "finance:edit": { group: "finance", description: "Editar movimentações financeiras" },
      "finance:delete": { group: "finance", description: "Excluir movimentações financeiras" },
      "mechanic:view": { group: "mechanics", description: "Visualizar mecânicos" },
      "mechanic:create": { group: "mechanics", description: "Cadastrar mecânicos" },
      "mechanic:edit": { group: "mechanics", description: "Editar mecânicos" },
      "mechanic:delete": { group: "mechanics", description: "Excluir mecânicos" },
      "priority-support:access": { group: "support", description: "Acessar suporte prioritário" },
      "reports:view": { group: "reports", description: "Visualizar relatórios" },
      "settings:view": { group: "settings", description: "Visualizar configurações" },
      "settings:edit": { group: "settings", description: "Editar configurações" },
    };
  }

  private getGroupDisplayName(groupKey: string): string {
    const groupNames: { [key: string]: string } = {
      clients: "Clientes",
      vehicles: "Veículos",
      serviceOrders: "Ordens de Serviço",
      services: "Serviços",
      schedule: "Agenda",
      inventory: "Estoque",
      parts: "Peças",
      suppliers: "Fornecedores",
      finance: "Financeiro",
      mechanics: "Mecânicos",
      support: "Suporte",
      reports: "Relatórios",
      settings: "Configurações",
    };

    return groupNames[groupKey] || groupKey;
  }

  populateEditForm(): void {
    this.editForm.name = this.garageInfo.name || "";
    this.editForm.phone = this.garageInfo.phone || "";
    this.editForm.email = this.garageInfo.email || "";
    this.editForm.cnpjCpf = this.garageInfo.cnpjCpf || "";

    if (this.garageInfo.address) {
      this.editForm.address = {
        street: this.garageInfo.address.street || "",
        number: this.garageInfo.address.number || "",
        district: this.garageInfo.address.district || "",
        city: this.garageInfo.address.city || "",
        state: this.garageInfo.address.state || "",
        zipCode: this.garageInfo.address.zipCode || "",
      };
    }

    this.originalGarageData = JSON.parse(JSON.stringify(this.editForm));
  }

  hasChanges(): boolean {
    const hasChanges = JSON.stringify(this.editForm) !== JSON.stringify(this.originalGarageData);
    this.hasUnsavedChanges = hasChanges && this.isEditing;
    return hasChanges;
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (this.hasUnsavedChanges) {
      $event.returnValue = true;
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      if (this.isEditing && this.hasChanges()) {
        this.saveGarageInfo();
      }
    }
    
    if (event.key === 'Escape') {
      if (this.isEditing) {
        this.cancelEdit();
      } else if (this.isChangingPassword) {
        this.cancelChangePassword();
      }
    }
  }

  toggleEdit(): void {
    if (!this.canEditSettings) {
      this.garageSystemService.alertUpgradeRequired("editar configurações");
      return;
    }

    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.populateEditForm();
    }
  }

  toggleChangePassword(): void {
    if (!this.canEditSettings) {
      this.garageSystemService.alertUpgradeRequired("alterar senha");
      return;
    }

    if (this.isChangingPassword) {
      this.cancelChangePassword();
    } else {
      this.showPasswordChangeOptions();
    }
  }

  showPasswordChangeOptions(): void {
    this.isChangingPassword = true;
    this.passwordChangeMethod = null;
    this.passwordChangeStep = 0;
  }

  selectPasswordChangeMethod(method: 'current' | 'email'): void {
    this.passwordChangeMethod = method;
    
    if (method === 'email') {
      this.startEmailPasswordChange();
    } else {
      this.startCurrentPasswordChange();
    }
  }

  startEmailPasswordChange(): void {
    this.passwordChangeStep = 1;
    this.requestPasswordChangeCode();
  }

  startCurrentPasswordChange(): void {
    this.passwordChangeStep = 4;
  }

  onInputChange(field: string, value: any): void {
    if (field === "phone") {
      this.hasDuplicatePhone = false;
    }
    
    this.hasChanges();
  }

  searchAddressByCep(): void {
    const cep = this.editForm.address.zipCode?.replace(/\D/g, "");

    if (cep?.length !== 8) {
      return;
    }

    this.isLoading = true;

    this.http
      .get(`https://viacep.com.br/ws/${cep}/json/`)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(
        (data: any) => {
          if (!data.erro) {
            this.editForm.address.street = data.logradouro || "";
            this.editForm.address.district = data.bairro || "";
            this.editForm.address.city = data.localidade || "";
            this.editForm.address.state = data.uf || "";
          }
        },
        (error) => {}
      );
  }

  onPhoneDuplicate(isDuplicate: boolean): void {
    if (isDuplicate && this.editForm.phone === this.garageInfo.phone) {
      this.hasDuplicatePhone = false;
    } else {
      this.hasDuplicatePhone = isDuplicate;
    }
  }

  saveGarageInfo(): void {
    if (!this.canEditSettings) {
      this.garageSystemService.alertUpgradeRequired("salvar configurações");
      return;
    }

    if (this.hasDuplicatePhone) {
      this.alertService.showAlert("Erro", "O número de celular informado já está sendo utilizado.", "error", "Fechar");
      return;
    }

    this.isLoading = true;
    this.settingsService
      .updateGarageInfo(this.editForm)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(
        (response: any) => {
          if (response.status === 200) {
            this.garageInfo = response.body?.result || this.garageInfo;
            this.alertService.showAlert("Sucesso", "Informações da oficina atualizadas com sucesso!", "success", "Fechar");
            this.isEditing = false;
          }
        },
        (error: any) => {
          this.alertService.showAlert("Erro", error.error?.msg || "Não foi possível atualizar as informações da oficina.", "error", "Fechar");
        }
      );
  }

  requestPasswordChangeCode(): void {
    this.isLoading = true;
    this.settingsService
      .requestPasswordChangeCode(this.garageInfo.email)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(
        (response: any) => {
          this.passwordChangeStep = 2;
          this.toastService.success("Código enviado", "Um código de verificação foi enviado para seu e-mail.");
        },
        (error: any) => {
          this.alertService.showAlert("Erro", error.error?.msg || "Não foi possível enviar o código de verificação.", "error", "Fechar");
          this.cancelChangePassword();
        }
      );
  }

  onCodeVerified(event: any): void {
    this.passwordChangeCode = event.code;
    this.passwordChangeStep = 3;
  }

  changePasswordWithCode(): void {
    if (!this.canEditSettings) {
      this.garageSystemService.alertUpgradeRequired("alterar senha");
      return;
    }

    if (this.newPasswordForm.newPassword !== this.newPasswordForm.confirmPassword) {
      this.alertService.showAlert("Erro", "As senhas não coincidem. Por favor, verifique.", "error", "Fechar");
      return;
    }

    if (this.newPasswordForm.newPassword.length < 6) {
      this.alertService.showAlert("Erro", "A nova senha deve ter pelo menos 6 caracteres.", "error", "Fechar");
      return;
    }

    this.isLoading = true;
    this.settingsService
      .changePasswordWithCode({
        email: this.garageInfo.email,
        code: this.passwordChangeCode,
        newPassword: this.newPasswordForm.newPassword
      })
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(
        (response: any) => {
          if (response.status === 200) {
            this.alertService.showAlert("Sucesso", "Senha alterada com sucesso!", "success", "Fechar");
            this.cancelChangePassword();
          }
        },
        (error: any) => {
          this.alertService.showAlert("Erro", error.error?.msg || "Não foi possível alterar a senha.", "error", "Fechar");
        }
      );
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.populateEditForm();
  }

  cancelChangePassword(): void {
    this.isChangingPassword = false;
    this.passwordChangeMethod = null;
    this.passwordChangeStep = 0;
    this.passwordChangeCode = "";
    this.passwordForm = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    };
    this.newPasswordForm = {
      newPassword: "",
      confirmPassword: "",
    };
  }

  changePassword(): void {
    if (!this.canEditSettings) {
      this.garageSystemService.alertUpgradeRequired("alterar senha");
      return;
    }

    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.alertService.showAlert("Erro", "As senhas não coincidem. Por favor, verifique.", "error", "Fechar");
      return;
    }

    if (this.passwordForm.newPassword.length < 6) {
      this.alertService.showAlert("Erro", "A nova senha deve ter pelo menos 6 caracteres.", "error", "Fechar");
      return;
    }

    this.isLoading = true;
    this.settingsService
      .changePassword(this.passwordForm)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(
        (response: any) => {
          if (response.status === 200) {
            this.alertService.showAlert("Sucesso", "Senha alterada com sucesso!", "success", "Fechar");
            this.cancelChangePassword();
          }
        },
        (error: any) => {
          this.alertService.showAlert("Erro", error.error?.msg || "Não foi possível alterar a senha.", "error", "Fechar");
        }
      );
  }

  handleUpgradePlan(): void {
    this.garageSystemService.handleUpgradePlan();
  }

  handleMoreInfo(): void {
    this.garageSystemService.handleMoreInfo();
  }

  getRemainingDays(): number {
    if (!this.subscription?.endDate) return 0;

    if (this.plan?._id === "free") return 999;

    const endDate = new Date(this.subscription.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  }

  getPlanStatusClass(): string {
    const days = this.getRemainingDays();

    if (days <= 0) return "bg-red-100 text-red-800";
    if (days <= 5) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  }

  getPlanStatusText(): string {
    if (this.plan?._id === "free") return "Ativo";

    const days = this.getRemainingDays();

    if (days <= 0) return "Expirado";
    if (days === 1) return "Expira amanhã";
    return `Ativo`;
  }

  formatPrice(price: number): string {
    return price.toFixed(2).replace(".", ",");
  }

  isAnnualPlan(): boolean {
    return this.plan?.interval === "yearly";
  }

  calculateAnnualPrice(monthlyPrice: number): number {
    const yearlyPrice = monthlyPrice * 12;
    const discount = (yearlyPrice * this.annualDiscountPercent) / 100;
    return parseFloat((yearlyPrice - discount).toFixed(2));
  }

  calculateAnnualSavings(monthlyPrice: number): number {
    const yearlyPrice = monthlyPrice * 12;
    const discountedPrice = this.calculateAnnualPrice(monthlyPrice);
    return parseFloat((yearlyPrice - discountedPrice).toFixed(2));
  }

  getPriceDisplayText(): string {
    if (this.isAnnualPlan()) {
      return `R$ ${this.formatPrice(this.plan.price)}/ano`;
    }
    return `R$ ${this.formatPrice(this.plan.price)}/mês`;
  }

  getDaysRemainingText(): string {
    if (this.plan?._id === "free") {
      return "Plano gratuito";
    }

    const days = this.getRemainingDays();
    
    if (days <= 0) {
      return "Expirado";
    }
    
    if (days === 1) {
      return "1 dia restante";
    }
    
    return `${days} dias restantes`;
  }


  getMonthlyEquivalentPrice(): number {
    if (this.isAnnualPlan()) {
      return this.plan.price / 12;
    }
    return this.plan.price;
  }

  getAnnualSavingsText(): string {
    if (!this.isAnnualPlan()) {
      return '';
    }
    
    const monthlyEquivalent = this.plan.price / 12;
    const monthlyPrice = monthlyEquivalent / (1 - this.annualDiscountPercent / 100);
    const annualWithoutDiscount = monthlyPrice * 12;
    const savings = annualWithoutDiscount - this.plan.price;
    
    return `Economize R$ ${this.formatPrice(savings)} por ano`;
  }

  canUpgradePlan(): boolean {
    if (this.plan?._id === 'free') {
      return true;
    }
    
    return this.checkIfUpgradeAvailable();
  }

  private checkIfUpgradeAvailable(): boolean {
    if (this.plan?.name?.toLowerCase().includes('profissional')) {
      return false;
    }
    
    return true;
  }

  selectTab(index: number): void {
    if (this.isEditing && this.activeTabIndex === 0 && index !== 0) {
      this.cancelEdit();
    }

    this.activeTabIndex = index;

    this.loadTabData(index);
  }

  getPermissionIconPath(groupName: string): string {
    switch (groupName.toLowerCase()) {
      case "clientes":
        return "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z";
      case "veículos":
        return "M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0";
      case "ordens de serviço":
        return "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4";
      case "agenda":
        return "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z";
      case "estoque":
        return "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10";
      case "financeiro":
        return "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
      case "mecânicos":
        return "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10";
      case "suporte":
        return "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z";
      case "relatórios":
        return "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z";
      case "configurações":
        return "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z";
      default:
        return "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4";
    }
  }

  getPaymentStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case "paid":
        return "px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs";
      case "pending":
        return "px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs";
      case "failed":
        return "px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs";
      case "refunded":
        return "px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs";
      case "free":
        return "px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs";
      default:
        return "px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs";
    }
  }

  getPaymentStatusDisplay(status: string): string {
    switch (status?.toLowerCase()) {
      case "paid":
        return "Pago";
      case "pending":
        return "Pendente";
      case "failed":
        return "Falhou";
      case "refunded":
        return "Reembolsado";
      case "free":
        return "Gratuito";
      default:
        return status || "Desconhecido";
    }
  }

  getPaymentTypeClass(type: string): string {
    switch (type?.toLowerCase()) {
      case "new":
        return "px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs";
      case "renewal":
        return "px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs";
      case "upgrade":
        return "px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs";
      default:
        return "px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs";
    }
  }

  getPaymentTypeDisplay(type: string): string {
    switch (type?.toLowerCase()) {
      case "new":
        return "Novo";
      case "renewal":
        return "Renovação";
      case "upgrade":
        return "Upgrade";
      default:
        return type || "Desconhecido";
    }
  }

  logout(): void {
    this.alertService.showAlert(
      "Sair do Sistema",
      "Tem certeza que deseja sair da sua conta?",
      "warning",
      "Cancelar",
      "Sair"
    ).then((result: any) => {
      if (result && result.isConfirmed) {
        document.body.classList.add("fade-out");
        setTimeout(() => {
          localStorage.removeItem("token");
          this.router.navigate(["/system/login"]);
          setTimeout(() => {
            document.body.classList.remove("fade-out");
          }, 500);
        }, 300);
      }
    });
  }
}
