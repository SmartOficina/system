import { Injectable } from "@angular/core";
import { ToastService } from "@shared/services/toast.service";

@Injectable({
  providedIn: "root",
})
export class ExportService {
  constructor(private toastService: ToastService) {}


  exportToCsv<T>(data: T[], headers: string[], filenamePrefix: string, mapFunction: (item: T) => string[]): void {
    if (data.length === 0) {
      this.toastService.info("Informação", "Não há dados para exportar.");
      return;
    }

    try {

      const csvData = data.map(mapFunction);
      csvData.unshift(headers);


      const csvString = this.convertToCSV(csvData);


      this.downloadCsvFile(csvString, filenamePrefix);

      this.toastService.success("Sucesso", `${data.length} item(ns) exportado(s) com sucesso.`);
    } catch (error) {
      this.toastService.error("Erro", "Falha ao exportar dados.");
    }
  }


  private convertToCSV(data: string[][]): string {
    return data
      .map((row) =>
        row
          .map((cell) => {

            if (cell.includes(",") || cell.includes('"')) {
              return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
          })
          .join(",")
      )
      .join("\n");
  }


  private downloadCsvFile(csvString: string, filenamePrefix: string): void {
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);


    const date = new Date().toISOString().slice(0, 10);
    link.setAttribute("download", `${filenamePrefix}_${date}.csv`);


    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);


    URL.revokeObjectURL(url);
  }
}
