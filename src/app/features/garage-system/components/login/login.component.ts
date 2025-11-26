import { AlertService } from '@shared/services/alert.service';
import { HttpResponse } from '@angular/common/http';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { GarageSystemService } from '../../garage-system.service';
import { FormsModule, NgForm } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { InputGenericComponent } from '@shared/components/input-generic/input-generic.component';
import { CodeInputComponent } from '@shared/components/code-input/code-input.component';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [NgFor, NgIf, FormsModule, InputGenericComponent, CodeInputComponent]
})
export class LoginComponent implements OnInit, OnDestroy {
  @ViewChild('loginForm') loginForm!: NgForm;
  currentSlide: number = 0;
  slides = [
    { src: '../../../../assets/img/image1.png', title: 'Título 1', description: 'Descrição 1', alt: 'Imagem 1' },
    { src: '../../../../assets/img/image2.png', title: 'Título 2', description: 'Descrição 2', alt: 'Imagem 2' },
    { src: '../../../../assets/img/image3.png', title: 'Título 3', description: 'Descrição 3', alt: 'Imagem 3' }
  ];
  intervalId: any;
  passwordVisible: boolean = false;
  isLoading: boolean = false;
  submitted: boolean = false;
  email: string = '';
  code: string = '';
  identifier: string = '';
  password: string = '';
  recoveryStep: number = 0;
  newPassword: string = '';
  isSubmitting: boolean = false;
  isSubmittingPassword: boolean = false;
  cooldown: number = 0;
  cooldownInterval: any;
  activationError: string = '';
  resendError: string = '';
  resendMessage: string = '';
  isSendingCode: boolean = false;

  get isEmailValid(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }

  get isLoginValid(): boolean {
    const identifierValid: boolean = !!this.identifier;
    const passwordValid: boolean = !!this.password && this.password.trim().length >= 6;
    return identifierValid && passwordValid;
  }

  constructor(
    private router: Router,
    private garageSystemService: GarageSystemService,
    private alertService: AlertService,
  ) { }

  ngOnInit(): void {
    this.startCarousel();
    window.scrollTo(0, 0);
    this.autoLoginWithToken();
  }

  ngOnDestroy(): void {
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);
    if (this.intervalId) clearInterval(this.intervalId);
  }

  startCarousel(): void {
    this.intervalId = setInterval(() => {
      this.nextSlide();
    }, 3000);
  }

  stopCarousel(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
    this.stopCarousel();
    this.startCarousel();
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  private handleLoginError(error: any): void {
    if (error.status === 403 && error.error?.needsActivation) {
      const message = error.error.msg || 'Sua conta não está ativada.';
      
      this.alertService.showAlert(
        'Conta Não Ativada 🔐',
        `${message}\n\nVamos reenviar um link de ativação para seu email agora mesmo!`,
        'warning',
        'Reenviar Link',
        'Cancelar'
      ).then((confirmed) => {
        if (confirmed) {
          this.resendActivationLink();
        }
      });
      return;
    }

    const errorMessage = error.error?.msg || 'Erro ao fazer login. Verifique suas credenciais.';
    this.alertService.showAlert('Erro no Login', errorMessage, 'error');
  }

  private showLoadingAlert(): void {
    this.alertService.showAlert(
      'Enviando... ⏳',
      'Estamos reenviando o link de ativação para seu email. Aguarde um momento...',
      'info',
      '',
      undefined,
      true // isLoading = true
    );
  }

  private resendActivationLink(): void {
    this.showLoadingAlert();
    
    this.garageSystemService.resendActivationLink(this.identifier).subscribe({
      next: () => {
        this.alertService.showAlert(
          'Link Enviado! 📧',
          'Um novo link de ativação foi enviado para seu email. Verifique sua caixa de entrada e spam.',
          'success'
        );
      },
      error: (error) => {
        const errorMsg = error.error?.msg || 'Erro ao reenviar link de ativação.';
        this.alertService.showAlert('Erro', errorMsg, 'error');
      }
    });
  }

  onSubmitLogin(): void {
    this.submitted = true;
    if (!this.isLoginValid) {
      return;
    }
    this.isLoading = true;

    let isEmail = this.identifier.includes('@');

    try {
      this.garageSystemService.garageAuthenticate(this.identifier, this.password, isEmail).subscribe({
        next: (response: HttpResponse<any>) => {
          if (response.status === 200) {
            localStorage.setItem('token', response.body?.token);
            this.garageSystemService.updateGarage(response.body?.garage);
            this.router.navigate(['/system']);
            this.isLoading = false;
          } else {
            if (response.status === 202 && response.body?.garage?.id) {
              this.router.navigate(['/complete-registration'], {
                queryParams: {
                  garage: response.body?.garage.id,
                  token: response.body?.token
                }
              });
            }
            this.isLoading = false;
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.handleLoginError(error);
        }
      });
    } catch (error: any) {
      this.isLoading = false;
    }
  }

  private autoLoginWithToken(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.isLoading = true;
      this.garageSystemService.validateToken(token).subscribe({
        next: (response: HttpResponse<any>) => {
          if (response.status === 200) {
            this.garageSystemService.updateGarage(response.body?.garage);
            this.router.navigate(['/system']);
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          localStorage.removeItem('token');
          if (error.status === 202 && error.error?.garage?.id) {
            this.router.navigate(['/complete-registration'], {
              queryParams: {
                garage: error.error.garage.id,
                token: error.error.token
              }
            });
          }
        }
      });
    }
  }

  startPasswordRecovery(): void {
    this.recoveryStep = 1;
    if (this.identifier && this.identifier.includes('@')) {
      this.email = this.identifier;
    }
  }

  requestPasswordReset(): void {
    if (this.isSendingCode) return;
    this.isSendingCode = true;
    this.resendMessage = '';
    this.resendError = '';
    this.isSubmitting = true;
    this.garageSystemService.requestPasswordReset(this.email).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.startCooldown(45);
        this.recoveryStep = 2;
        this.isSendingCode = false;
      },
      error: (error) => {
        this.isSubmitting = false;
        this.resendError = 'Erro ao tentar reenviar o código. Tente novamente mais tarde.';
        this.isSendingCode = false;
      }
    });
  }

  onCodeVerified(response: any): void {
    this.recoveryStep = 3;
    this.code = response.code;
  }

  resetPassword(): void {
    this.isSubmittingPassword = true;
    this.garageSystemService.resetPassword(this.email, this.code, this.newPassword).subscribe({
      next: (response: HttpResponse<any>) => {
        this.isSubmittingPassword = false;
        this.recoveryStep = 0;
        this.newPassword = '';
        this.alertService.showAlert('Sucesso!', 'Senha redefinida com sucesso!', 'success', 'Fechar').then((result) => {
          if (result) {
            this.garageSystemService.autoLogin(response, true);
          }
        });
      },
      error: (error) => {
        this.isSubmittingPassword = false;
      }
    });
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  startCooldown(seconds: number): void {
    this.cooldown = seconds;
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);
    this.cooldownInterval = setInterval(() => {
      if (this.cooldown > 0) {
        this.cooldown--;
      } else {
        clearInterval(this.cooldownInterval);
      }
    }, 1000);
  }

  cancelPasswordRecovery(): void {
    this.recoveryStep = 0;
    this.isSubmitting = false;
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }
}