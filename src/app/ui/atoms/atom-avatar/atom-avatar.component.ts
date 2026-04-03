import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonAvatar, IonImg } from '@ionic/angular/standalone';

@Component({
  selector: 'atom-avatar',
  standalone: true,
  templateUrl: './atom-avatar.component.html',
  styleUrls: ['./atom-avatar.component.scss'],
  imports: [CommonModule, IonAvatar, IonImg]
})
export class AtomAvatarComponent {
  @Input({ required: true }) src!: string;
  @Input() alt: string = 'Avatar';
  @Input() size: number = 40;
}
