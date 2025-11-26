import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { httpErrorInterceptorFn } from './http-error-interceptor';

provideHttpClient(
    withInterceptors([httpErrorInterceptorFn])
)