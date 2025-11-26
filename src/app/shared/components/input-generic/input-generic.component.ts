import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
import { DuplicateCheckService } from './../../services/duplicate-check.service';

export type InputType = 'name' | 'email' | 'password' | 'phone' | 'cnpjCpf' | 'cep' | 'number' | 'text' | 'licensePlate' | 'date' | 'cardNumber' | 'cardExpiry' | 'cardCvv' | 'emailOrCnpjCpf';

@Component({
  selector: 'app-input-generic',
  imports: [NgIf, NgClass, FormsModule],
  templateUrl: './input-generic.component.html',
  styleUrls: ['./input-generic.component.scss']
})
export class InputGenericComponent implements OnChanges, OnDestroy {
  @ViewChild('inputElement') inputElement!: ElementRef<HTMLInputElement>;

  @Input() type: InputType = 'text';
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() required: boolean = false;
  @Input() value: any = '';
  @Input() submitted: boolean = false;
  @Input() checkDuplicate: boolean = false;
  @Input() readonly: boolean = false;
  @Input() helpText: string = '';
  @Input() minLength: number | null = null;
  @Input() maxLength: number | null = null;
  @Input() min: number | null = null;
  @Input() max: number | null = null;
  @Input() pattern: string | null = null;
  @Input() isLoading: boolean = false;

  @Output() duplicateEvent = new EventEmitter<boolean>();
  @Output() valueChange = new EventEmitter<string>();
  @Output() blurEvent = new EventEmitter<void>();
  @Output() focusEvent = new EventEmitter<void>();
  @Output() keyupEvent: EventEmitter<KeyboardEvent> = new EventEmitter<KeyboardEvent>();
  @Output() validityChange = new EventEmitter<boolean>();
  @Output() fieldCompleted = new EventEmitter<void>();

  inputTouched: boolean = false;
  showPassword: boolean = false;
  duplicateError: string = '';
  checkingDuplicate: boolean = false;
  detectedType: 'email' | 'cnpjCpf' | null = null;
  private duplicateCheckSubscription: Subscription | null = null;

  constructor(private duplicateCheckService: DuplicateCheckService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.emitValidity();
      if (this.type === 'emailOrCnpjCpf' && this.value) {
        this.detectInputType(this.value);
      }
    }

    if (changes['submitted'] && changes['submitted'].currentValue) {
      this.inputTouched = true;
      this.verifyDuplicate();
    }
  }

  ngOnDestroy(): void {
    if (this.duplicateCheckSubscription) {
      this.duplicateCheckSubscription.unsubscribe();
    }
  }

  onFocus(): void {
    this.focusEvent.emit();
  }

  onBlur(): void {
    this.inputTouched = true;
    this.verifyDuplicate();
    this.blurEvent.emit();
  }

  detectInputType(value: string): void {
    if (!value) {
      this.detectedType = null;
      return;
    }

    if (value.includes('@')) {
      this.detectedType = 'email';
    } else {
      this.detectedType = 'cnpjCpf';
    }
  }

  onInputChange(newValue: string): void {
    let inputValue = newValue;

    if (this.type === 'emailOrCnpjCpf') {
      this.detectInputType(inputValue);

      if (this.detectedType === 'cnpjCpf') {
        inputValue = this.applyCnpjCpfMask(inputValue);
      }
    }
    else if (this.type === 'phone') {
      inputValue = this.applyPhoneMask(inputValue);
    } else if (this.type === 'cnpjCpf') {
      inputValue = this.applyCnpjCpfMask(inputValue);
    } else if (this.type === 'cep') {
      inputValue = this.applyCepMask(inputValue);
    } else if (this.type === 'licensePlate') {
      inputValue = this.applyLicensePlateMask(inputValue);
    } else if (this.type === 'cardNumber') {
      inputValue = this.applyCardNumberMask(inputValue);

      if (inputValue.replace(/\D/g, '').length === 16) {
        this.fieldCompleted.emit();
      }
    } else if (this.type === 'cardExpiry') {
      inputValue = this.applyCardExpiryMask(inputValue);

      if (inputValue.length === 5 && /^\d{2}\/\d{2}$/.test(inputValue)) {
        this.fieldCompleted.emit();
      }
    } else if (this.type === 'cardCvv') {
      inputValue = this.applyCardCvvMask(inputValue);
    }

    if (this.maxLength !== null && typeof inputValue === 'string' && inputValue.length > this.maxLength) {
      inputValue = inputValue.substring(0, this.maxLength);
    }

    this.value = inputValue;
    this.valueChange.emit(inputValue);
    this.duplicateError = '';
    this.duplicateEvent.emit(false);
    this.emitValidity();
  }

  onKeyup(event: KeyboardEvent): void {
    this.keyupEvent.emit(event);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  applyPhoneMask(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 10) {
      return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
    } else {
      return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
    }
  }

  applyCnpjCpfMask(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 11) {
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (match, p1, p2, p3, p4) => {
        let result = `${p1}.${p2}.${p3}`;
        if (p4) { result += `-${p4}`; }
        return result;
      }).trim();
    } else {
      return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, (match, p1, p2, p3, p4, p5) => {
        let result = `${p1}.${p2}.${p3}/${p4}`;
        if (p5) { result += `-${p5}`; }
        return result;
      }).trim();
    }
  }

  applyLicensePlateMask(value: string): string {
    const alphanum = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (alphanum.length > 3) {
      return alphanum.substring(0, 3) + '-' + alphanum.substring(3, 7);
    }
    return alphanum;
  }

  applyCepMask(value: string): string {
    const digits = value.replace(/\D/g, '');
    return digits.replace(/(\d{5})(\d{0,3})/, (match, p1, p2) => {
      return p2 ? `${p1}-${p2}` : p1;
    });
  }

  isValid(): boolean {
    if (this.duplicateError) {
      return false;
    }

    const trimmed = (this.value != null ? String(this.value) : '').trim();

    if (this.required && trimmed === '') {
      return false;
    }

    if (this.minLength !== null && trimmed.length < this.minLength && trimmed !== '') {
      return false;
    }

    if (this.pattern !== null && trimmed !== '' && !new RegExp(this.pattern).test(trimmed)) {
      return false;
    }

    if (this.type === 'emailOrCnpjCpf') {
      if (trimmed === '') return !this.required;
      if (this.detectedType === 'email') {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
      } else if (this.detectedType === 'cnpjCpf') {
        const digits = trimmed.replace(/\D/g, '');
        if (!(digits.length === 11 || digits.length === 14)) return false;
        if (digits.length === 11) {
          return this.validateCPF(digits);
        } else {
          return this.validateCNPJ(digits);
        }
      }

      return trimmed !== '';
    }

    switch (this.type) {
      case 'name':
        return trimmed === '' || trimmed.length >= (this.minLength || 4);
      case 'email':
        return trimmed === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
      case 'password':
        return trimmed === '' || trimmed.length >= (this.minLength || 6);
      case 'phone': {
        const digits = (this.value != null ? String(this.value) : '').replace(/\D/g, '');
        return trimmed === '' || digits.length === 10 || digits.length === 11;
      }
      case 'cnpjCpf': {
        if (trimmed === '') return true;
        const digits = trimmed.replace(/\D/g, '');
        if (!(digits.length === 11 || digits.length === 14)) return false;
        if (digits.length === 11) {
          return this.validateCPF(digits);
        } else {
          return this.validateCNPJ(digits);
        }
      }
      case 'cep': {
        if (trimmed === '') return true;
        const digits = trimmed.replace(/\D/g, '');
        return digits.length === 8;
      }
      case 'number': {
        if (trimmed === '') return !this.required;

        const num = Number(this.value);
        if (isNaN(num)) return false;

        if (this.min !== null && num < this.min) return false;
        if (this.max !== null && num > this.max) return false;

        return true;
      }
      case 'date': {
        if (trimmed === '') return !this.required;
        return !isNaN(Date.parse(trimmed));
      }
      case 'cardNumber': {
        if (trimmed === '') return !this.required;
        const digits = trimmed.replace(/\D/g, '');
        return digits.length === 16;
      }
      case 'cardExpiry': {
        if (trimmed === '') return !this.required;
        const digits = trimmed.replace(/\D/g, '');

        if (digits.length !== 4) return false;

        const month = parseInt(digits.substring(0, 2), 10);
        const year = parseInt(digits.substring(2, 4), 10);

        if (month < 1 || month > 12) return false;

        const currentDate = new Date();
        const currentYear = currentDate.getFullYear() % 100;
        const currentMonth = currentDate.getMonth() + 1;

        if (year < currentYear || (year === currentYear && month < currentMonth)) {
          return false;
        }

        return true;
      }
      case 'cardCvv': {
        if (trimmed === '') return !this.required;
        const digits = trimmed.replace(/\D/g, '');
        return digits.length >= 3 && digits.length <= 4;
      }
      case 'text':
      case 'licensePlate':
      default:
        return true;
    }
  }

  getErrorMessage(): string {
    const trimmed = (this.value != null ? String(this.value) : '').trim();

    if (this.duplicateError) {
      return this.duplicateError;
    }

    if (this.required && !trimmed) {
      return 'Campo obrigatório.';
    }

    if (!trimmed) {
      return '';
    }

    if (this.minLength !== null && trimmed.length < this.minLength) {
      return `O campo deve ter pelo menos ${this.minLength} caracteres.`;
    }

    if (this.maxLength !== null && trimmed.length > this.maxLength) {
      return `O campo deve ter no máximo ${this.maxLength} caracteres.`;
    }

    if (this.pattern !== null && !new RegExp(this.pattern).test(trimmed)) {
      return 'Formato inválido.';
    }

    if (this.type === 'emailOrCnpjCpf') {
      if (this.detectedType === 'email') {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? '' : 'Insira um e-mail válido.';
      } else if (this.detectedType === 'cnpjCpf') {
        const digits = trimmed.replace(/\D/g, '');
        if (!(digits.length === 11 || digits.length === 14)) return 'Insira um CNPJ ou CPF válido.';
        if (digits.length === 11 && !this.validateCPF(digits)) return 'CPF inválido.';
        if (digits.length === 14 && !this.validateCNPJ(digits)) return 'CNPJ inválido.';
        return '';
      }
      return 'Digite um e-mail ou CNPJ/CPF válido.';
    }

    switch (this.type) {
      case 'name':
        return trimmed.length >= (this.minLength || 4) ? '' : 'O nome deve ter pelo menos 4 caracteres.';
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? '' : 'Insira um e-mail válido.';
      case 'password':
        return trimmed.length >= (this.minLength || 6) ? '' : 'A senha deve ter pelo menos 6 caracteres.';
      case 'phone': {
        const digits = (this.value != null ? String(this.value) : '').replace(/\D/g, '');
        return (digits.length === 10 || digits.length === 11) ? '' : 'O número deve ter 10 ou 11 dígitos.';
      }
      case 'cnpjCpf': {
        const digits = (this.value != null ? String(this.value) : '').replace(/\D/g, '');
        if (!(digits.length === 11 || digits.length === 14)) return 'Insira um CNPJ ou CPF válido.';
        if (digits.length === 11 && !this.validateCPF(digits)) return 'CPF inválido.';
        if (digits.length === 14 && !this.validateCNPJ(digits)) return 'CNPJ inválido.';
        return '';
      }
      case 'cep': {
        const digits = (this.value != null ? String(this.value) : '').replace(/\D/g, '');
        return digits.length === 8 ? '' : 'CEP inválido.';
      }
      case 'number': {
        if (isNaN(Number(this.value))) return 'Número inválido.';

        if (this.min !== null && Number(this.value) < this.min)
          return `O valor mínimo é ${this.min}.`;

        if (this.max !== null && Number(this.value) > this.max)
          return `O valor máximo é ${this.max}.`;

        return '';
      }
      case 'date': {
        return !isNaN(Date.parse(trimmed)) ? '' : 'Data inválida.';
      }
      case 'licensePlate': {
        return '';
      }
      case 'cardNumber': {
        const digits = (this.value != null ? String(this.value) : '').replace(/\D/g, '');
        return digits.length === 16 ? '' : 'Número de cartão deve ter 16 dígitos.';
      }
      case 'cardExpiry': {
        if (!/^\d{2}\/\d{2}$/.test(trimmed)) return 'Use o formato MM/AA.';

        const digits = trimmed.replace(/\D/g, '');
        const month = parseInt(digits.substring(0, 2), 10);
        const year = parseInt(digits.substring(2, 4), 10);

        if (month < 1 || month > 12) return 'Mês inválido.';

        const currentDate = new Date();
        const currentYear = currentDate.getFullYear() % 100;
        const currentMonth = currentDate.getMonth() + 1;

        if (year < currentYear || (year === currentYear && month < currentMonth)) {
          return 'Cartão expirado.';
        }

        return '';
      }
      case 'cardCvv': {
        const digits = (this.value != null ? String(this.value) : '').replace(/\D/g, '');
        return (digits.length >= 3 && digits.length <= 4) ? '' : 'CVV deve ter 3 ou 4 dígitos.';
      }
      case 'text':
      default:
        return '';
    }
  }

  getInputType(): string {
    if (this.type === 'password') {
      return this.showPassword ? 'text' : 'password';
    }
    if (this.type === 'email') {
      return 'email';
    }
    if (this.type === 'number') {
      return 'number';
    }
    if (this.type === 'date') {
      return 'date';
    }
    if (this.type === 'phone' || this.type === 'cnpjCpf' || this.type === 'cep' ||
      this.type === 'cardCvv' || this.type === 'cardNumber' || this.type === 'cardExpiry') {
      return 'tel';
    }
    if (this.type === 'emailOrCnpjCpf') {
      return 'text';
    }
    return 'text';
  }

  verifyDuplicate(): void {
    if (!this.checkDuplicate || !this.isValid() || !this.value) {
      return;
    }

    if (this.duplicateCheckSubscription) {
      this.duplicateCheckSubscription.unsubscribe();
      this.duplicateCheckSubscription = null;
    }

    this.checkingDuplicate = true;
    const valueToCheck = (this.value != null ? String(this.value) : '').trim();

    if (this.type === 'emailOrCnpjCpf') {
      if (this.detectedType === 'email') {
        this.checkEmailDuplicate(valueToCheck);
      } else if (this.detectedType === 'cnpjCpf') {
        this.checkCnpjCpfDuplicate(valueToCheck);
      } else {
        this.checkingDuplicate = false;
      }
      return;
    }

    if (this.type === 'email') {
      this.checkEmailDuplicate(valueToCheck);
    } else if (this.type === 'phone') {
      this.checkPhoneDuplicate(valueToCheck);
    } else if (this.type === 'cnpjCpf') {
      this.checkCnpjCpfDuplicate(valueToCheck);
    }
  }

  private checkEmailDuplicate(email: string): void {
    this.duplicateCheckSubscription = this.duplicateCheckService.checkEmail(email)
      .pipe(finalize(() => this.checkingDuplicate = false))
      .subscribe(
        (resp: any) => {
          if (resp.body.exists) {
            this.duplicateError = 'E-mail já cadastrado.';
            this.duplicateEvent.emit(true);
          } else {
            this.duplicateError = '';
            this.duplicateEvent.emit(false);
          }
          this.emitValidity();
        },
        (error: any) => {
          this.duplicateError = 'Erro ao verificar e-mail.';
          this.duplicateEvent.emit(true);
          this.checkingDuplicate = false;
          this.emitValidity();
        }
      );
  }

  private checkPhoneDuplicate(phone: string): void {
    this.duplicateCheckSubscription = this.duplicateCheckService.checkPhone(phone)
      .pipe(finalize(() => this.checkingDuplicate = false))
      .subscribe(
        (resp: any) => {
          if (resp.body.exists) {
            this.duplicateError = 'Telefone já cadastrado.';
            this.duplicateEvent.emit(true);
          } else {
            this.duplicateError = '';
            this.duplicateEvent.emit(false);
          }
          this.emitValidity();
        },
        (error: any) => {
          this.duplicateError = 'Erro ao verificar telefone.';
          this.duplicateEvent.emit(true);
          this.checkingDuplicate = false;
          this.emitValidity();
        }
      );
  }

  private checkCnpjCpfDuplicate(cnpjCpf: string): void {
    const digits = cnpjCpf.replace(/\D/g, '');
    this.duplicateCheckSubscription = this.duplicateCheckService.checkCnpjCpf(cnpjCpf)
      .pipe(finalize(() => this.checkingDuplicate = false))
      .subscribe(
        (resp: any) => {
          if (resp.body.exists) {
            this.duplicateError = digits.length === 11 ? 'CPF já cadastrado.' : 'CNPJ já cadastrado.';
            this.duplicateEvent.emit(true);
          } else {
            this.duplicateError = '';
            this.duplicateEvent.emit(false);
          }
          this.emitValidity();
        },
        (error: any) => {
          this.duplicateError = 'Erro ao verificar ' + (digits.length === 11 ? 'CPF.' : 'CNPJ.');
          this.duplicateEvent.emit(true);
          this.checkingDuplicate = false;
          this.emitValidity();
        }
      );
  }

  private emitValidity(): void {
    this.validityChange.emit(this.isValid());
  }

  private validateCPF(cpf: string): boolean {
    if (!cpf || cpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) return false;

    return true;
  }

  private validateCNPJ(cnpj: string): boolean {
    if (!cnpj || cnpj.length !== 14) return false;
    if (/^(\d)\1+$/.test(cnpj)) return false;

    let length = cnpj.length - 2;
    let numbers = cnpj.substring(0, length);
    const digits = cnpj.substring(length);

    let sum = 0;
    let pos = length - 7;
    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    length = length + 1;
    numbers = cnpj.substring(0, length);
    sum = 0;
    pos = length - 7;
    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
  }

  applyCardNumberMask(value: string): string {
    const digits = value.replace(/\D/g, '');

    if (digits.length > 16) {
      return this.applyCardNumberMask(digits.substring(0, 16));
    }

    let result = '';
    for (let i = 0; i < digits.length; i++) {
      if (i > 0 && i % 4 === 0) {
        result += ' ';
      }
      result += digits[i];
    }

    return result;
  }

  applyCardExpiryMask(value: string): string {
    const digits = value.replace(/\D/g, '');

    if (digits.length > 4) {
      return this.applyCardExpiryMask(digits.substring(0, 4));
    }

    if (digits.length <= 2) {
      return digits;
    } else {
      return `${digits.substring(0, 2)}/${digits.substring(2)}`;
    }
  }

  applyCardCvvMask(value: string): string {
    const digits = value.replace(/\D/g, '');

    if (digits.length > 4) {
      return digits.substring(0, 4);
    }

    return digits;
  }

  focus(): void {
    this.inputElement?.nativeElement?.focus();
  }
}