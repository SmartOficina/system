import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environment/environment';
import { AuthHeaderService } from '../../../../shared/services/auth-header.service';
import { 
  OverviewData, 
  ServiceOrdersStats, 
  FinancialStats, 
  DashboardScheduleEvent 
} from '../../../../shared/models/models';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.api_server}/api/statistics`;

  constructor(private http: HttpClient) {}

  getOverview(): Observable<{ result: OverviewData }> {
    return this.http.get<{ result: OverviewData }>(`${this.apiUrl}/overview`, {
      headers: AuthHeaderService.header
    });
  }

  getServiceOrdersStats(period?: string): Observable<{ result: ServiceOrdersStats }> {
    let params: any = {};
    if (period) {
      params = { period };
    }
    return this.http.get<{ result: ServiceOrdersStats }>(`${this.apiUrl}/service-orders`, { 
      params,
      headers: AuthHeaderService.header
    });
  }

  getFinancialStats(period?: string): Observable<{ result: FinancialStats }> {
    let params: any = {};
    if (period) {
      params = { period };
    }
    return this.http.get<{ result: FinancialStats }>(`${this.apiUrl}/financial`, { 
      params,
      headers: AuthHeaderService.header
    });
  }

  getTodaySchedule(): Observable<{ result: DashboardScheduleEvent[] }> {
    return this.http.get<{ result: DashboardScheduleEvent[] }>(`${this.apiUrl}/schedule/today`, {
      headers: AuthHeaderService.header
    });
  }

  getInventoryStats(): Observable<{ result: any }> {
    return this.http.get<{ result: any }>(`${this.apiUrl}/inventory`, {
      headers: AuthHeaderService.header
    });
  }
}