import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { AlertService } from '../../services/alert.service';
import { VerifyCodeService } from './../../services/verify-code.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-code-input',
  imports: [NgIf],
  templateUrl: './code-input.component.html',
  styleUrls: ['./code-input.component.scss']
})
export class CodeInputComponent implements OnInit, OnDestroy {
  @Input() email: string = '';
  @Input() context: 'activation' | 'password_reset' = 'activation';
  @Output() success = new EventEmitter<any>();
  @ViewChildren('codeInput') inputs!: QueryList<ElementRef>;
  codeDigits: string[] = ['', '', '', '', '', ''];
  isVerifying: boolean = false;
  isResending: boolean = false;
  resendCooldown: number = 0;
  cooldownInterval: any;
  resendMessage: string = '';
  resendError: string = '';
  title: string = '';
  description: string = '';

  constructor(
    private verifyCodeService: VerifyCodeService,
    private alertService: AlertService
  ) { }

  ngOnInit(): void {
    if (this.context === 'activation') {
      this.title = 'Verifique seu e-mail';
      this.description = 'Um código de verificação foi enviado para seu e-mail.';
    } else {
      this.title = 'Recuperação de Senha';
      this.description = 'Digite o código enviado para o seu e-mail para recuperar sua senha.';
    }
  }

  ngOnDestroy(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
  }

  onInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    if (!/^\d$/.test(value)) {
      input.value = '';
      this.codeDigits[index] = '';
      return;
    }
    this.codeDigits[index] = value;
    if (index < this.codeDigits.length - 1) {
      const nextInput = this.inputs.toArray()[index + 1];
      nextInput?.nativeElement.focus();
    }
    if (this.isComplete()) {
      this.verifyCode();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;
    if (event.key === 'Backspace' && !input.value && index > 0) {
      const prevInput = this.inputs.toArray()[index - 1];
      if (prevInput) {
        prevInput.nativeElement.focus();
        prevInput.nativeElement.value = '';
        this.codeDigits[index - 1] = '';
      }
      event.preventDefault();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const clipboardData = event.clipboardData?.getData('text');
    if (!clipboardData) return;
    const digits = clipboardData.replace(/\D/g, '').slice(0, 6);
    digits.split('').forEach((digit, index) => {
      this.codeDigits[index] = digit;
      const inputEl = this.inputs.toArray()[index];
      if (inputEl) {
        inputEl.nativeElement.value = digit;
      }
    });
    const nextEmptyIndex = this.codeDigits.findIndex(d => d === '');
    if (nextEmptyIndex !== -1) {
      const nextInput = this.inputs.toArray()[nextEmptyIndex];
      nextInput?.nativeElement.focus();
    } else {
      this.verifyCode();
    }
  }

  private isComplete(): boolean {
    return this.codeDigits.every(digit => digit !== '');
  }

  verifyCode(): void {
    const code = this.codeDigits.join('');
    if (!this.email || !code || code.length !== 6) return;
    this.isVerifying = true;
    this.verifyCodeService.verifyCode(this.email, code, this.context).pipe(finalize(() => this.isVerifying = false)).subscribe({
      next: (response: any) => {
        this.success.emit({ ...response, ...{ code: code } });
      },
      error: (error) => {
      }
    });
  }

  resendCode(): void {
    if (this.isResending || this.resendCooldown > 0) return;
    this.isResending = true;
    this.resendMessage = '';
    this.resendError = '';
    this.verifyCodeService.resendCode(this.email, this.context).pipe(finalize(() => this.isResending = false)).subscribe({
      next: () => {
        this.resendMessage = 'O novo código foi enviado para o seu e-mail.';
        this.startCooldown(45);
        this.clearCode();
      },
      error: (error) => {
        this.resendError = error.error.msg || 'Não foi possível reenviar o código.';
      }
    });
  }

  startCooldown(seconds: number): void {
    this.resendCooldown = seconds;
    this.cooldownInterval = setInterval(() => {
      if (this.resendCooldown > 0) {
        this.resendCooldown--;
      } else {
        clearInterval(this.cooldownInterval);
      }
    }, 1000);
  }

  clearCode(): void {
    this.codeDigits = ['', '', '', '', '', ''];
    this.inputs.forEach(input => input.nativeElement.value = '');
    const firstInput = this.inputs.first;
    firstInput?.nativeElement.focus();
  }
}