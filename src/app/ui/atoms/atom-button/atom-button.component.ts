import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular/standalone';

type ButtonSize = 'small' | 'default' | 'large';
type ButtonFill = 'clear' | 'outline' | 'solid' | 'default';
type ButtonExpand = 'block' | 'full';
type ButtonShape = 'round' | 'default';
type ButtonType = 'button' | 'submit' | 'reset';
type IconSlot = 'start' | 'end' | 'icon-only';

@Component({
  selector: 'atom-button',
  standalone: true,
  templateUrl: './atom-button.component.html',
  styleUrls: ['./atom-button.component.scss'],
  imports: [CommonModule, IonButton, IonIcon]
})
export class AtomButtonComponent {
  @Input() label?: string;
  @Input() color: string = 'primary';
  @Input() size: ButtonSize = 'default';
  @Input() fill: ButtonFill = 'solid';
  @Input() expand?: ButtonExpand;
  @Input() shape: ButtonShape = 'default';
  @Input() disabled: boolean = false;
  @Input() icon?: string;
  @Input() iconSlot: IconSlot = 'start';
  @Input() type: ButtonType = 'button';

  get showContent(): boolean {
    return this.iconSlot !== 'icon-only';
  }
}
