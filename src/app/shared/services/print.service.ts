import { Injectable } from "@angular/core";
import { ServiceOrder } from "@shared/models/models";
import { CurrencyUtils } from "@shared/utils/currency-utils";

@Injectable({
  providedIn: "root",
})
export class PrintService {
  private formatCurrency = CurrencyUtils.formatCurrency;

  constructor() {}

  printServiceOrder(serviceOrder: ServiceOrder): void {
    const clientName = this.getClientName(serviceOrder);
    this.printBudget(serviceOrder, clientName);
  }

  printMultipleServiceOrders(serviceOrders: ServiceOrder[]): void {
    if (serviceOrders.length === 0) {
      alert("Nenhuma ordem de serviço selecionada para impressão.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Por favor, permita janelas pop-up para imprimir as ordens de serviço.");
      return;
    }

    let printContent = `
      <html>
      <head>
        <title>Ordens de Serviço - Impressão em Lote</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .page-break { page-break-before: always; }
          .service-order { margin-bottom: 50px; }
          .service-order:not(:first-child) { page-break-before: always; }
          .header { margin-bottom: 20px; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #ddd; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background-color: #f2f2f2; text-align: left; padding: 8px; border: 1px solid #ddd; }
          td { padding: 8px; border: 1px solid #ddd; }
          .total { font-weight: bold; }
          .no-items { text-align: center; font-style: italic; color: #666; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          @media print {
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
    `;

    serviceOrders.forEach((order, index) => {
      const clientName = this.getClientName(order);
      const dateFormatted = order.openingDate ? new Date(order.openingDate).toLocaleDateString("pt-BR") : new Date().toLocaleDateString("pt-BR");
      const vehiclePlate = order.vehicle?.licensePlate || "N/A";
      let vehicleInfo = vehiclePlate;
      if (order.vehicle?.brandModel) {
        vehicleInfo += ` - ${order.vehicle.brandModel}`;
      }

      printContent += `
        <div class="service-order ${index > 0 ? "page-break" : ""}">
          <div class="header">
            <h2>Ordem de Serviço #${order.orderNumber}</h2>
            <p><strong>Data:</strong> ${dateFormatted}</p>
            <p><strong>Cliente:</strong> ${clientName}</p>
            <p><strong>Veículo:</strong> ${vehicleInfo}</p>
            <p><strong>Status:</strong> ${this.getStatusLabel(order.status)}</p>
          </div>
          
          <div class="section">
            <h3 class="section-title">Problema Relatado</h3>
            <p>${order.reportedProblem || "Não informado"}</p>
          </div>
          
          ${
            order.identifiedProblems && order.identifiedProblems.length > 0
              ? `
          <div class="section">
            <h3 class="section-title">Problemas Identificados</h3>
            <ul>${order.identifiedProblems.map((p: any) => `<li>${p}</li>`).join("")}</ul>
          </div>
          `
              : ""
          }
          
          ${
            order.requiredParts && order.requiredParts.length > 0
              ? `
          <div class="section">
            <h3 class="section-title">Peças</h3>
            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Quantidade</th>
                  <th>Valor Unitário</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.requiredParts
                  .map(
                    (part: any) => `
                  <tr>
                    <td>${part.description}</td>
                    <td>${part.quantity}</td>
                    <td>R$ ${this.formatCurrency(part.unitPrice)}</td>
                    <td>R$ ${this.formatCurrency(part.totalPrice)}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" class="total" align="right">Total Peças:</td>
                  <td class="total">R$ ${this.formatCurrency(order.estimatedTotalParts || order.finalTotalParts || 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          `
              : ""
          }
          
          ${
            order.services && order.services.length > 0
              ? `
          <div class="section">
            <h3 class="section-title">Serviços</h3>
            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Horas</th>
                  <th>Valor/Hora</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.services
                  .map(
                    (service: any) => `
                  <tr>
                    <td>${service.description}</td>
                    <td>${service.estimatedHours}</td>
                    <td>R$ ${this.formatCurrency(service.pricePerHour)}</td>
                    <td>R$ ${this.formatCurrency(service.totalPrice)}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" class="total" align="right">Total Serviços:</td>
                  <td class="total">R$ ${this.formatCurrency(order.estimatedTotalServices || order.finalTotalServices || 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          `
              : ""
          }
          
          <div class="section">
            <h3 class="section-title">Resumo</h3>
            <table>
              <tr>
                <td>Total Peças:</td>
                <td>R$ ${this.formatCurrency(order.estimatedTotalParts || order.finalTotalParts || 0)}</td>
              </tr>
              <tr>
                <td>Total Serviços:</td>
                <td>R$ ${this.formatCurrency(order.estimatedTotalServices || order.finalTotalServices || 0)}</td>
              </tr>
              <tr class="total">
                <td>Valor Total:</td>
                <td>R$ ${this.formatCurrency(order.estimatedTotal || order.finalTotal || 0)}</td>
              </tr>
            </table>
          </div>
          
          ${
            order.technicalObservations
              ? `
          <div class="section">
            <h3 class="section-title">Observações Técnicas</h3>
            <p>${order.technicalObservations}</p>
          </div>
          `
              : ""
          }
        </div>
      `;
    });

    printContent += `
        <div class="footer">
          <p>Impressão gerada em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
          <p>© 2025 Smart Oficina - Sistema de Gerenciamento de Oficina</p>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
  }

  private getClientName(serviceOrder: ServiceOrder): string {
    if (serviceOrder.client && typeof serviceOrder.client === "object") {
      return (serviceOrder.client as any).fullName || "Cliente não informado";
    }
    if (serviceOrder.vehicle?.client && typeof serviceOrder.vehicle.client === "object") {
      return (serviceOrder.vehicle.client as any).fullName || "Cliente não informado";
    }
    return "Cliente não informado";
  }

  private getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      opened: "Aberta",
      in_diagnosis: "Em Diagnóstico",
      waiting_approval: "Aguardando Aprovação",
      approved: "Aprovada",
      rejected: "Rejeitada",
      in_progress: "Em Andamento",
      waiting_parts: "Aguardando Peças",
      completed: "Concluída",
      delivered: "Entregue",
      cancelled: "Cancelada",
    };
    return statusLabels[status] || status;
  }

  printBudget(serviceOrder: ServiceOrder, selectedClientName: string, hideHeader: boolean = false): void {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Por favor, permita janelas pop-up para imprimir o orçamento.");
      return;
    }

    const dateFormatted = serviceOrder.openingDate ? new Date(serviceOrder.openingDate).toLocaleDateString("pt-BR") : new Date().toLocaleDateString("pt-BR");

    const vehiclePlate = serviceOrder.vehicle?.licensePlate || "N/A";

    let vehicleInfo = vehiclePlate;
    if (serviceOrder.vehicle?.brandModel) {
      vehicleInfo += ` - ${serviceOrder.vehicle.brandModel}`;
    }

    let printContent = `
      <html>
      <head>
        <title>Orçamento #${serviceOrder.orderNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; color: #333; }
          .header { margin-bottom: 20px; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #ddd; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background-color: #f2f2f2; text-align: left; padding: 8px; border: 1px solid #ddd; }
          td { padding: 8px; border: 1px solid #ddd; }
          .total { font-weight: bold; }
          .no-items { text-align: center; font-style: italic; color: #666; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          @media print {
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
    `;

    printContent += `
      <div class="header">
        <h1>Orçamento #${serviceOrder.orderNumber}</h1>
        <p><strong>Data:</strong> ${dateFormatted}</p>
        <p><strong>Cliente:</strong> ${selectedClientName}</p>
        <p><strong>Veículo:</strong> ${vehicleInfo}</p>
      </div>
    `;

    printContent += `
        <div class="section">
          <h2 class="section-title">Problema Relatado</h2>
          <p>${serviceOrder.reportedProblem || "Não informado"}</p>
        </div>
        
        <div class="section">
          <h2 class="section-title">Problemas Identificados</h2>
          ${serviceOrder.identifiedProblems && serviceOrder.identifiedProblems.length > 0 ? `<ul>${serviceOrder.identifiedProblems.map((p: any) => `<li>${p}</li>`).join("")}</ul>` : '<p class="no-items">Nenhum problema adicional identificado</p>'}
        </div>
        
        <div class="section">
          <h2 class="section-title">Peças</h2>
          <table>
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Quantidade</th>
                <th>Valor Unitário</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${
                serviceOrder.requiredParts && serviceOrder.requiredParts.length > 0
                  ? serviceOrder.requiredParts
                      .map(
                        (part: any) =>
                          `<tr>
                      <td>${part.description}</td>
                      <td>${part.quantity}</td>
                      <td>R$ ${this.formatCurrency(part.unitPrice)}</td>
                      <td>R$ ${this.formatCurrency(part.totalPrice)}</td>
                    </tr>`
                      )
                      .join("")
                  : '<tr><td colspan="4" class="no-items">Nenhuma peça adicionada</td></tr>'
              }
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="total" align="right">Total Peças:</td>
                <td class="total">R$ ${this.formatCurrency(serviceOrder.estimatedTotalParts || 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div class="section">
          <h2 class="section-title">Serviços</h2>
          <table>
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Horas</th>
                <th>Valor/Hora</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${
                serviceOrder.services && serviceOrder.services.length > 0
                  ? serviceOrder.services
                      .map(
                        (service: any) =>
                          `<tr>
                      <td>${service.description}</td>
                      <td>${service.estimatedHours}</td>
                      <td>R$ ${this.formatCurrency(service.pricePerHour)}</td>
                      <td>R$ ${this.formatCurrency(service.totalPrice)}</td>
                    </tr>`
                      )
                      .join("")
                  : '<tr><td colspan="4" class="no-items">Nenhum serviço adicionado</td></tr>'
              }
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="total" align="right">Total Serviços:</td>
                <td class="total">R$ ${this.formatCurrency(serviceOrder.estimatedTotalServices || 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div class="section">
          <h2 class="section-title">Resumo</h2>
          <table>
            <tr>
              <td>Total Peças:</td>
              <td>R$ ${this.formatCurrency(serviceOrder.estimatedTotalParts || 0)}</td>
            </tr>
            <tr>
              <td>Total Serviços:</td>
              <td>R$ ${this.formatCurrency(serviceOrder.estimatedTotalServices || 0)}</td>
            </tr>
            <tr class="total">
              <td>Valor Total:</td>
              <td>R$ ${this.formatCurrency(serviceOrder.estimatedTotal || 0)}</td>
            </tr>
          </table>
        </div>
        
        ${
          serviceOrder.technicalObservations
            ? `<div class="section">
              <h2 class="section-title">Observações Técnicas</h2>
              <p>${serviceOrder.technicalObservations}</p>
            </div>`
            : ""
        }
        
        <div class="footer">
          <p>Orçamento gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
          <p>© 2025 Smart Oficina - Sistema de Gerenciamento de Oficina</p>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
  }
}
