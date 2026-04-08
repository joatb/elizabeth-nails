import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { AgGridAngular } from "ag-grid-angular";
import type { ColDef, GridReadyEvent } from "ag-grid-community";
import { MolLoadingBannerComponent } from "../../molecules/mol-loading-banner/mol-loading-banner.component";
import { MolPaginationInfoComponent } from "../../molecules/mol-pagination-info/mol-pagination-info.component";

type GridDomLayout = "autoHeight" | "normal" | "print";

@Component({
  selector: "org-clients-grid-panel",
  standalone: true,
  templateUrl: "./clients-grid-panel.component.html",
  styleUrls: ["./clients-grid-panel.component.scss"],
  imports: [
    CommonModule,
    AgGridAngular,
    MolLoadingBannerComponent,
    MolPaginationInfoComponent,
  ],
})
export class ClientsGridPanelComponent {
  @Input() rowData: Array<Record<string, unknown>> = [];
  @Input() colDefs: ColDef[] = [];
  @Input() localeText: Record<string, string> = {};

  @Input() gridClass: string = "ag-theme-alpine";
  @Input() domLayout: GridDomLayout = "autoHeight";
  @Input() suppressHorizontalScroll: boolean = true;
  @Input() enableCellTextSelection: boolean = true;
  @Input() animateRows: boolean = true;
  @Input() undoRedoCellEditing: boolean = true;

  @Input() isLoadingMore: boolean = false;
  @Input() isLoadingAll: boolean = false;

  @Input() currentCount: number = 0;
  @Input() totalCount: number = 0;
  @Input() showLoadMore: boolean = false;
  @Input() showLoadAll: boolean = false;

  @Output() gridReady = new EventEmitter<GridReadyEvent>();
  @Output() loadMore = new EventEmitter<void>();
  @Output() loadAll = new EventEmitter<void>();

  handleGridReady(event: GridReadyEvent): void {
    this.gridReady.emit(event);
  }

  handleLoadMore(): void {
    this.loadMore.emit();
  }

  handleLoadAll(): void {
    this.loadAll.emit();
  }
}
