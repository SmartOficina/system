import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environment/environment';
import { AuthHeaderService } from './auth-header.service';

@Injectable({
    providedIn: 'root'
})
export class CardsService {
    constructor(private http: HttpClient) { }

    getCards(): Observable<HttpResponse<any>> {
        return this.http.get<HttpResponse<any>>(
            `${environment.api_server}/api/cards/cards`,
            { observe: 'response', headers: AuthHeaderService.header }
        );
    }

    setDefaultCard(cardId: string): Observable<HttpResponse<any>> {
        return this.http.post<HttpResponse<any>>(
            `${environment.api_server}/api/cards/cards/set-default`,
            { cardId },
            { observe: 'response', headers: AuthHeaderService.header }
        );
    }

    deleteCard(cardId: string): Observable<HttpResponse<any>> {
        return this.http.post<HttpResponse<any>>(
            `${environment.api_server}/api/cards/cards/delete`,
            { cardId },
            { observe: 'response', headers: AuthHeaderService.header }
        );
    }
}