import { CommonModule } from "@angular/common";
import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output,
} from "@angular/core";
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from "@angular/forms";
import { IonItem } from "@ionic/angular/standalone";
import { IonicSelectableComponent } from "ionic-selectable";

export type ClientSelectorItem = Record<string, unknown>;
export type ClientSelectorValue = ClientSelectorItem | string | number | null;
export type ClientSelectorChangeEvent = { value: ClientSelectorValue };
export type ClientSelectorSearchEvent = { text: string };
export type ClientSelectorInfiniteScrollEvent = {
  component: {
    endInfiniteScroll: () => void;
    disableInfiniteScroll: () => void;
    items: ClientSelectorItem[];
  };
  text: string;
};

@Component({
  selector: "mol-client-selector",
  standalone: true,
  imports: [CommonModule, FormsModule, IonItem, IonicSelectableComponent],
  templateUrl: "./mol-client-selector.component.html",
  styleUrls: ["./mol-client-selector.component.scss"],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MolClientSelectorComponent),
      multi: true,
    },
  ],
})
export class MolClientSelectorComponent implements ControlValueAccessor {
  @Input() items: ClientSelectorItem[] = [];
  @Input() placeholder: string = "Seleccionar cliente";
  @Input() canSearch: boolean = true;
  @Input() hasInfiniteScroll: boolean = true;
  @Input() closeButtonText: string = "Cerrar";
  @Input() searchPlaceholder: string = "Buscar cliente...";

  @Input() itemValueField: string = "id";
  @Input() itemTextField: string = "name";
  @Input() disabled: boolean = false;
  @Input() invalid: boolean = false;
  @Input() errorText?: string;

  @Output() change = new EventEmitter<ClientSelectorValue>();
  @Output() search = new EventEmitter<ClientSelectorSearchEvent>();
  @Output() loadMore = new EventEmitter<ClientSelectorInfiniteScrollEvent>();

  value: ClientSelectorValue = null;

  private onChange: (value: ClientSelectorValue) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: ClientSelectorValue): void {
    this.value = value ?? null;
  }

  registerOnChange(fn: (value: ClientSelectorValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  handleChange(event: ClientSelectorChangeEvent): void {
    const nextValue: ClientSelectorValue = event?.value ?? null;
    this.value = nextValue;
    this.onChange(nextValue);
    this.onTouched();
    this.change.emit(nextValue);
  }

  handleSearch(event: ClientSelectorSearchEvent): void {
    this.search.emit(event);
  }

  handleInfiniteScroll(event: ClientSelectorInfiniteScrollEvent): void {
    this.loadMore.emit(event);
  }

  getItemText(item: ClientSelectorItem): string {
    const rawValue = item[this.itemTextField];
    if (typeof rawValue === "string" || typeof rawValue === "number") {
      return String(rawValue);
    }
    return "";
  }
}
