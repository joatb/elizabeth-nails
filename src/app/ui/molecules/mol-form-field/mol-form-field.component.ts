import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'mol-form-field',
  standalone: true,
  templateUrl: './mol-form-field.component.html',
  styleUrls: ['./mol-form-field.component.scss'],
  imports: [CommonModule],
})
export class MolFormFieldComponent {
  @Input() label?: string;
  @Input() helperText?: string;
  @Input() errorText?: string;
  @Input() invalid: boolean = false;
}
