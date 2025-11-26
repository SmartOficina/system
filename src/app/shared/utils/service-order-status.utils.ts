import { ServiceOrderStatus } from '../models/models';

export class ServiceOrderStatusUtils {
    static statusOptions = [
        { value: '', label: 'Todos os status' },
        { value: ServiceOrderStatus.OPENED, label: 'Aberta' },
        { value: ServiceOrderStatus.DIAGNOSING, label: 'Em Diagnóstico' },
        { value: ServiceOrderStatus.WAITING_APPROVAL, label: 'Aguardando Aprovação' },
        { value: ServiceOrderStatus.APPROVED, label: 'Aprovada' },
        { value: ServiceOrderStatus.REJECTED, label: 'Rejeitada' },
        { value: ServiceOrderStatus.IN_PROGRESS, label: 'Em Andamento' },
        { value: ServiceOrderStatus.WAITING_PARTS, label: 'Aguardando Peças' },
        { value: ServiceOrderStatus.COMPLETED, label: 'Concluída' },
        { value: ServiceOrderStatus.DELIVERED, label: 'Entregue' },
        { value: ServiceOrderStatus.CANCELED, label: 'Cancelada' }
    ];

    static getStatusLabel(status: string): string {
        const statusOption = this.statusOptions.find(option => option.value === status);
        return statusOption ? statusOption.label : status;
    }

    static getStatusClass(status: string): string {
        switch (status) {
            case ServiceOrderStatus.OPENED:
                return 'bg-blue-100 text-blue-800';
            case ServiceOrderStatus.DIAGNOSING:
                return 'bg-purple-100 text-purple-800';
            case ServiceOrderStatus.WAITING_APPROVAL:
                return 'bg-yellow-100 text-yellow-800';
            case ServiceOrderStatus.APPROVED:
                return 'bg-green-100 text-green-800';
            case ServiceOrderStatus.REJECTED:
                return 'bg-red-100 text-red-800';
            case ServiceOrderStatus.IN_PROGRESS:
                return 'bg-indigo-100 text-indigo-800';
            case ServiceOrderStatus.WAITING_PARTS:
                return 'bg-orange-100 text-orange-800';
            case ServiceOrderStatus.COMPLETED:
                return 'bg-emerald-100 text-emerald-800';
            case ServiceOrderStatus.DELIVERED:
                return 'bg-teal-100 text-teal-800';
            case ServiceOrderStatus.CANCELED:
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    static getStatusValue(status: string): number {
        switch (status) {
            case ServiceOrderStatus.OPENED:
                return 1;
            case ServiceOrderStatus.DIAGNOSING:
            case ServiceOrderStatus.WAITING_APPROVAL:
            case ServiceOrderStatus.REJECTED:
                return 2;
            case ServiceOrderStatus.APPROVED:
            case ServiceOrderStatus.IN_PROGRESS:
            case ServiceOrderStatus.WAITING_PARTS:
                return 3;
            case ServiceOrderStatus.COMPLETED:
            case ServiceOrderStatus.DELIVERED:
                return 4;
            case ServiceOrderStatus.CANCELED:
                return 0;
            default:
                return 0;
        }
    }

    static isStatusEqualOrAfter(currentStatus: string, compareStatus: string): boolean {
        return this.getStatusValue(currentStatus) >= this.getStatusValue(compareStatus);
    }
}