import { Component, Input } from "@angular/core";
import { NgFor, NgIf } from "@angular/common";
import { NgxSkeletonLoaderModule } from "ngx-skeleton-loader";

@Component({
  selector: "app-table-skeleton",
  imports: [NgFor, NgIf, NgxSkeletonLoaderModule],
  templateUrl: "./table-skeleton.component.html",
  styleUrls: ["./table-skeleton.component.scss"],
  standalone: true,
})
export class TableSkeletonComponent {
  @Input() columns: string[] = [];
  @Input() rows: number = 5;
  @Input() hasCheckbox: boolean = false;
  @Input() hasActions: boolean = true;

  get skeletonRows(): number[] {
    const maxSkeletonRows = Math.min(this.rows, 20);
    return Array(maxSkeletonRows)
      .fill(0)
      .map((_, i) => i);
  }

  getColumnWidth(columnIndex: number): string {
    const widths = ["120px", "100px", "80px", "150px", "90px", "110px"];
    return widths[columnIndex % widths.length];
  }
}
