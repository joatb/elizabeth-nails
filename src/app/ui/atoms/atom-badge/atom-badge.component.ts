import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonBadge } from '@ionic/angular/standalone';

type BadgeMode = 'ios' | 'md';

@Component({
  selector: 'atom-badge',
  standalone: true,
  templateUrl: './atom-badge.component.html',
  styleUrls: ['./atom-badge.component.scss'],
  imports: [CommonModule, IonBadge]
})
export class AtomBadgeComponent {
  @Input() text?: string;
  @Input() color: string = 'primary';
  @Input() mode?: BadgeMode;
  @Input() ariaLabel?: string;
}
