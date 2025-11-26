import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { NgClass, NgFor } from "@angular/common";

@Component({
  selector: "app-pagination",
  templateUrl: "./pagination.component.html",
  styleUrls: ["./pagination.component.scss"],
  imports: [NgClass, NgFor],
})
export class PaginationComponent implements OnChanges {
  @Input() totalPages: number = 0;
  @Input() currentPage: number = 1;
  @Input() itemsPerPage: number = 10;
  @Input() currentItemsCount: number = 0;
  @Input() totalItems: number = 0;
  @Input() itemsLabel: string = "itens";

  @Output() pageChange: EventEmitter<number> = new EventEmitter<number>();

  pages: number[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    this.generatePagination();
  }

  generatePagination(): void {
    const maxPagesToShow = 5;

    if (this.totalPages <= maxPagesToShow) {
      this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    } else {
      const startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
      const endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

      this.pages = [];
      for (let i = startPage; i <= endPage; i++) {
        this.pages.push(i);
      }
    }
  }

  setPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    this.pageChange.emit(page);
  }

  getFirstItemIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  getLastItemIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, (this.currentPage - 1) * this.itemsPerPage + this.currentItemsCount);
  }
}
