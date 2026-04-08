import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { IonButton } from "@ionic/angular/standalone";

@Component({
  selector: "mol-pagination-info",
  standalone: true,
  templateUrl: "./mol-pagination-info.component.html",
  styleUrls: ["./mol-pagination-info.component.scss"],
  imports: [CommonModule, IonButton],
})
export class MolPaginationInfoComponent {
  @Input() currentCount: number = 0;
  @Input() totalCount: number = 0;

  @Input() showLoadMore: boolean = false;
  @Input() showLoadAll: boolean = false;

  @Input() loadMoreLabel: string = "Cargar más";
  @Input() loadAllLabel: string = "Cargar todos";
  @Input() infoPrefix: string = "Mostrando";
  @Input() infoSeparator: string = "de";

  @Input() disabled: boolean = false;

  @Output() loadMore = new EventEmitter<void>();
  @Output() loadAll = new EventEmitter<void>();

  get infoText(): string {
    return `${this.infoPrefix} ${this.currentCount} ${this.infoSeparator} ${this.totalCount} clientes`;
  }

  handleLoadMore(): void {
    if (!this.disabled) {
      this.loadMore.emit();
    }
  }

  handleLoadAll(): void {
    if (!this.disabled) {
      this.loadAll.emit();
    }
  }
}
