import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { SharedModule } from '../../../modules/shared.module';
import { IonNav, IonModal } from '@ionic/angular/standalone';
import { ConfigComponent } from '../../config/config.component';

@Component({
  selector: 'app-config-modal',
  standalone: true,
  template: `
    <ion-modal #configModal trigger="openConfigModal" (willPresent)="onWillPresent()">
    <ng-template>
      <ion-header>
        <ion-toolbar>
          <ion-title>Ajustes</ion-title>
          <ion-buttons slot="end">
            <ion-button (click)="modalClose()"> Cerrar </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-nav #nav></ion-nav>
      </ion-content>
    </ng-template>
    </ion-modal>
  `,
  styles: [],
  imports: [SharedModule, CommonModule]
})
export class ConfigModalComponent {
  showModalBackButton: boolean = false;

  @ViewChild('nav') private nav!: IonNav;
  @ViewChild('configModal') private modal!: IonModal;

  constructor() {}

  async onWillPresent() {
    this.nav.setRoot(ConfigComponent, { nav: this.nav });
    const canGoBack = await this.nav.canGoBack();
    this.showModalBackButton = canGoBack;
  }

  async modalClose() {
    const canGoBack = await this.nav.canGoBack();
    if (canGoBack) {
      this.nav.pop();
    } else {
      this.modal.dismiss();
    }
  }

}
