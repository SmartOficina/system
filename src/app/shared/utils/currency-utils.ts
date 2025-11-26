export class CurrencyUtils {

    static formatCurrency(value: number | null | undefined): string {
        if (value == null) return '0,00';
        return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    static formatCurrencyWithPrefix(value: number | null | undefined): string {
        return `R$ ${this.formatCurrency(value)}`;
    }

    static currencyStringToNumber(value: string): number {
        const cleaned = value.replace(/[^\d,]/g, '').replace(',', '.');
        return parseFloat(cleaned || '0');
    }

    static processMoneyInput(value: string): { numericValue: number, formattedValue: string } {
        const digitsOnly = value.replace(/\D/g, '');
        const cents = parseInt(digitsOnly || '0', 10);
        const monetaryValue = cents / 100;
        return {
            numericValue: monetaryValue,
            formattedValue: this.formatCurrencyWithPrefix(monetaryValue)
        };
    }
}