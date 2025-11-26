import { GarageSystemService } from '@features/garage-system/garage-system.service';
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-access-denied',
  templateUrl: './access-denied.component.html',
  styleUrls: ['./access-denied.component.scss'],
  imports: [CommonModule]
})
export class AccessDeniedComponent implements OnInit, OnDestroy {
  @Input() message: string = 'Você não tem permissão para acessar esta funcionalidade.';
  @Input() requiredPermission: string = '';
  @Output() upgradePlan = new EventEmitter<void>();
  @Output() moreInfo = new EventEmitter<void>();

  hasNeverSubscribed: boolean = false;
  hasExpiredSubscription: boolean = false;
  subscriptionInfo: any = null;
  daysExpired: number = 0;

  private destroy$ = new Subject<void>();

  constructor(private garageSystemService: GarageSystemService) { }

  ngOnInit(): void {
    this.garageSystemService.garageInfo$
      .pipe(takeUntil(this.destroy$))
      .subscribe((garageInfo: any) => {
        if (garageInfo && garageInfo.subscription) {
          this.subscriptionInfo = garageInfo.subscription;

          if (!garageInfo.subscription.subscription?.status ||
            garageInfo.subscription.subscription?.status === '' ||
            garageInfo.subscription.plan?.name === 'Grátis') {
            this.hasNeverSubscribed = true;
            this.hasExpiredSubscription = false;
          }
          else if (garageInfo.subscription.subscription?.status === 'expired' &&
            garageInfo.subscription.subscription?.isExpired) {
            this.hasNeverSubscribed = false;
            this.hasExpiredSubscription = true;

            if (garageInfo.subscription.subscription?.endDate) {
              const endDate = new Date(garageInfo.subscription.subscription.endDate);
              const today = new Date();
              const timeDiff = Math.abs(today.getTime() - endDate.getTime());
              this.daysExpired = Math.ceil(timeDiff / (1000 * 3600 * 24));
            }
          }
          else {
            this.hasNeverSubscribed = false;
            this.hasExpiredSubscription = false;
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onUpgradePlan(): void {
    this.upgradePlan.emit();
  }

  onMoreInfo(): void {
    this.moreInfo.emit();
  }

  get ctaButtonText(): string {
    if (this.hasNeverSubscribed) {
      return 'Assinar agora';
    } else if (this.hasExpiredSubscription) {
      return 'Renovar assinatura';
    } else {
      return 'Fazer upgrade';
    }
  }

  get planReferenceText(): string {
    if (this.hasNeverSubscribed) {
      return 'Você ainda não possui um plano ativo';
    } else if (this.hasExpiredSubscription) {
      return `Seu plano ${this.subscriptionInfo?.plan?.name || ''} está vencido`;
    } else {
      return `Seu plano atual não oferece acesso a essa funcionalidade`;
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);

    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };

    return date.toLocaleDateString('pt-BR', options);
  }

  getMissingFeatureText(): string {
    const permissionFeatureMap: { [key: string]: string } = {
      'client:view': 'visualização de clientes',
      'client:create': 'cadastro de clientes',
      'client:edit': 'edição de clientes',
      'client:delete': 'exclusão de clientes',
      'vehicle:view': 'visualização de veículos',
      'vehicle:create': 'cadastro de veículos',
      'vehicle:edit': 'edição de veículos',
      'vehicle:delete': 'exclusão de veículos',
      'service-order:view': 'visualização de ordens de serviço',
      'service-order:create': 'criação de ordens de serviço',
      'service-order:edit': 'edição de ordens de serviço',
      'service-order:delete': 'exclusão de ordens de serviço',
      'schedule:view': 'visualização da agenda',
      'schedule:create': 'criação de agendamentos',
      'schedule:edit': 'edição de agendamentos',
      'schedule:delete': 'exclusão de agendamentos'
    };

    const feature = permissionFeatureMap[this.requiredPermission] || 'este recurso';

    if (this.hasNeverSubscribed) {
      return `Para acessar ${feature}, você precisa ter uma assinatura ativa.`;
    } else if (this.hasExpiredSubscription) {
      return `Para voltar a usar ${feature}, renove sua assinatura ${this.subscriptionInfo?.plan?.name || ''}.`;
    } else {
      return `Para acessar ${feature}, você precisa fazer upgrade para um plano mais completo.`;
    }
  }
}