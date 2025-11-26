export class DateUtils {
  static toInputFormat(date: Date | string | undefined | null): string {
    if (!date) return "";

    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;


      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    } catch (error) {
      return "";
    }
  }

  static toBrazilianFormat(date: Date | string | undefined | null): string {
    if (!date) return "";

    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return dateObj.toLocaleDateString("pt-BR");
    } catch (error) {
      return "";
    }
  }

  static formatDateTime(date: Date | string | undefined | null): string {
    if (!date) return "";

    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return dateObj.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "";
    }
  }

  static isValidDate(dateStr: string): boolean {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }
}
