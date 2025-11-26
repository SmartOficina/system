import { inject } from "@angular/core";
import { HttpErrorResponse, HttpInterceptorFn, HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { AlertService } from "./services/alert.service";

const SILENT_ENDPOINTS = ["api/auth/token", "api/coupons/validate"];

interface AlertInfo {
  title: string;
  message: string;
  type: "error" | "warning" | "info";
  buttonText: string;
}

function shouldSuppressError(url: string): boolean {
  return SILENT_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

function getAlertTitleByStatus(status: number): string {
  switch (status) {
    case 0:
      return "Conexão Falhou";
    case 400:
      return "Requisição Inválida";
    case 401:
      return "Sessão Expirada";
    case 403:
      return "Acesso Negado";
    case 404:
      return "Não Encontrado";
    case 500:
      return "Erro do Servidor";
    default:
      return `Erro ${status}`;
  }
}

function getAlertTypeByStatus(status: number): "error" | "warning" | "info" {
  if (status === 0 || status >= 500) {
    return "error";
  } else if (status === 401 || status === 403) {
    return "warning";
  } else if (status === 404) {
    return "info";
  } else {
    return "error";
  }
}

function processErrorAlert(error: HttpErrorResponse): AlertInfo {
  let alertInfo: AlertInfo = {
    title: getAlertTitleByStatus(error.status),
    message: "Ocorreu um erro desconhecido",
    type: getAlertTypeByStatus(error.status),
    buttonText: "Fechar",
  };

  if (error.error instanceof ErrorEvent) {
    alertInfo.message = `Erro: ${error.error.message}`;
  } else {
    if (error.error && error.error.msg) {
      alertInfo.message = error.error.msg;
    } else if (error.status === 0) {
      alertInfo.message = "Não foi possível conectar ao servidor. Verifique sua conexão com a internet.";
    } else if (error.status === 401) {
      alertInfo.message = "Sessão expirada ou não autorizada. Por favor, faça login novamente.";
    } else if (error.status === 403) {
      alertInfo.message = "Você não tem permissão para acessar este recurso.";
    } else if (error.status === 404) {
      alertInfo.message = "O recurso solicitado não foi encontrado.";
    } else if (error.status === 500) {
      alertInfo.message = "Erro interno do servidor. Por favor, tente novamente mais tarde.";
    } else {
      alertInfo.message = `${error.statusText || "Erro desconhecido"}`;
    }
  }

  return alertInfo;
}

export const httpErrorInterceptorFn: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const alertService = inject(AlertService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!shouldSuppressError(req.url)) {
        const alertInfo = processErrorAlert(error);
        alertService.showAlert(alertInfo.title, alertInfo.message, alertInfo.type, alertInfo.buttonText);
      }
      return throwError(() => error);
    })
  );
};
