import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonInput, IonItem, IonLabel } from '@ionic/angular/standalone';

type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
type IonInputEvent = CustomEvent<{ value?: string | null }>;

@Component({
  selector: 'atom-input',
  standalone: true,
  templateUrl: './atom-input.component.html',
  styleUrls: ['./atom-input.component.scss'],
  imports: [CommonModule, IonItem, IonInput, IonLabel],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AtomInputComponent),
      multi: true
    }
  ]
})
export class AtomInputComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() placeholder?: string;
  @Input() type: InputType = 'text';
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Input() required: boolean = false;
  @Input() name?: string;
  @Input() autocomplete?: string;
  @Input() errorText?: string;
  @Input() invalid: boolean = false;
  @Input() helperText?: string;

  value: string = '';

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.value = value ?? '';
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
    const nextValue = event.detail.value ?? '';
    this.value = nextValue;
    this.onChange(nextValue);
  }

  handleBlur(): void {
    this.onTouched();
  }
}
