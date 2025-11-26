import { AuthHeaderService } from './auth-header.service';
import { environment } from '@environment/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class HeartbeatService {
    private readonly HEARTBEAT_INTERVAL = 2 * 60 * 1000;
    private destroy$ = new Subject<void>();
    constructor(private http: HttpClient) { }

    startHeartbeat(): void {
        const token = localStorage.getItem('token');
        if (!token) {
            return;
        }

        timer(0, this.HEARTBEAT_INTERVAL)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                const currentToken = localStorage.getItem('token');
                if (currentToken) {
                    this.sendHeartbeat().subscribe({
                        next: (response) => { 
                        },
                        error: (error) => {
                            if (error.status === 401 || error.status === 403) {
                                this.stopHeartbeat();
                            }
                        }
                    });
                } else {
                    this.stopHeartbeat();
                }
            });
    }

    stopHeartbeat(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.destroy$ = new Subject<void>();
    }

    private sendHeartbeat(): Observable<any> {
        return this.http.post(`${environment.api_server}/api/heartbeat/ping`, {}, { headers: AuthHeaderService.header });
    }
}