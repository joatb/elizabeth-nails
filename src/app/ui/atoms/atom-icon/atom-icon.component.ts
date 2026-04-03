import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';

type IconSize = 'small' | 'medium' | 'large' | 'default';

@Component({
  selector: 'atom-icon',
  standalone: true,
  templateUrl: './atom-icon.component.html',
  styleUrls: ['./atom-icon.component.scss'],
  imports: [CommonModule, IonIcon]
})
export class AtomIconComponent {
  @Input({ required: true }) name!: string;
  @Input() size: IconSize = 'default';
  @Input() color?: string;
  @Input() ariaLabel?: string;
}
