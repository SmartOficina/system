import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.scss'],
  imports: [],
  standalone: true
})
export class LoadingSpinnerComponent {
  @Input() text: string = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() fullscreen: boolean = false;

  get sizeClass(): string {
    return `size-${this.size}`;
  }
}