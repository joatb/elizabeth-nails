import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";

@Component({
  selector: "tpl-modal-template",
  standalone: true,
  templateUrl: "./modal-template.component.html",
  styleUrls: ["./modal-template.component.scss"],
  imports: [CommonModule],
})
export class ModalTemplateComponent {
  @Input() title?: string;
  @Input() showClose: boolean = true;
  @Input() closeAriaLabel: string = "Cerrar";

  @Output() close = new EventEmitter<void>();

  handleClose(): void {
    this.close.emit();
  }
}
