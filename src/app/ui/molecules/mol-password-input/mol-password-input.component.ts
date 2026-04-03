import { CommonModule } from "@angular/common";
import { Component, forwardRef, Input } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import {
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
} from "@ionic/angular/standalone";

type IonInputEvent = CustomEvent<{ value?: string | null }>;

@Component({
  selector: "mol-password-input",
  standalone: true,
  templateUrl: "./mol-password-input.component.html",
  styleUrls: ["./mol-password-input.component.scss"],
  imports: [CommonModule, IonItem, IonInput, IonIcon, IonButton, IonLabel],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MolPasswordInputComponent),
      multi: true,
    },
  ],
})
export class MolPasswordInputComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() placeholder?: string;
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Input() required: boolean = false;
  @Input() name?: string;
  @Input() autocomplete?: string;
  @Input() helperText?: string;
  @Input() errorText?: string;
  @Input() invalid: boolean = false;
  @Input() showToggle: boolean = true;
  @Input() toggleAriaLabel: string = "Mostrar u ocultar contraseña";

  value: string = "";
  showPassword: boolean = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.value = value ?? "";
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  handleInput(event: IonInputEvent): void {
    const nextValue = event.detail.value ?? "";
    this.value = nextValue;
    this.onChange(nextValue);
  }

  handleBlur(): void {
    this.onTouched();
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}
