import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
    name: 'formatDate',
    standalone: true
})
export class FormatDatePipe implements PipeTransform {
    transform(value: any): string {
        if (!value) return '';
        const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return new Date(value).toLocaleString('pt-BR', options);
    }
}