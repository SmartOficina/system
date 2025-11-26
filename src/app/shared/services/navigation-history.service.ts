import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class NavigationHistoryService {
    private history: string[] = [];

    constructor(private router: Router) {
        this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe((event: any) => {
                if (!event.urlAfterRedirects.includes('/login') &&
                    !event.urlAfterRedirects.includes('/register')) {
                    this.history.push(event.urlAfterRedirects);

                    if (this.history.length > 10) {
                        this.history.shift();
                    }
                }
            });
    }

    getPreviousUrl(): string {
        return this.history.length > 1 ? this.history[this.history.length - 2] : '/';
    }

    getLastNonSystemUrl(): string {
        for (let i = this.history.length - 1; i >= 0; i--) {
            if (!this.history[i].includes('/system')) {
                return this.history[i];
            }
        }
        return '/';
    }
}