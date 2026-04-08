import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { SharedModule } from "../../../modules/shared.module";

type IonDatetimeChangeEvent = CustomEvent<{ value?: string | string[] | null }>;

@Component({
  selector: "org-month-picker-modal",
  standalone: true,
  templateUrl: "./month-picker-modal.component.html",
  styleUrls: ["./month-picker-modal.component.scss"],
  imports: [CommonModule, SharedModule],
})
export class MonthPickerModalComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = "Seleccionar mes";
  @Input() value: string | null = null;
  @Input() locale: string = "es-ES";
  @Input() confirmLabel: string = "Confirmar";
  @Input() cancelLabel: string = "Cancelar";
  @Input() preferWheel: boolean = true;
  @Input() presentation: "month-year" = "month-year";

  @Output() valueChange = new EventEmitter<string | null>();
  @Output() cancel = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<string | null>();
  @Output() dismiss = new EventEmitter<void>();

  handleDismiss(): void {
    this.dismiss.emit();
  }

  handleCancel(): void {
    this.cancel.emit();
  }

  handleConfirm(): void {
    this.confirm.emit(this.value);
  }

  handleValueChange(event: IonDatetimeChangeEvent): void {
    const detail = event.detail;
    let nextValue: string | null = null;

    if (detail.value) {
      if (typeof detail.value === "string") {
        nextValue = detail.value;
      } else if (Array.isArray(detail.value) && detail.value.length > 0) {
        nextValue = detail.value[0];
      }
    }

    this.value = nextValue;
    this.valueChange.emit(nextValue);
  }
}
