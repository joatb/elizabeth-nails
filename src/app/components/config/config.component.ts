import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../modules/shared.module';
import { ThemeService } from '../../services/theme.service';
import { account } from '../../../lib/appwrite';
import { UserPreferences } from '../../models/user-preferences';
import { LoadingController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-config',
  standalone: true,
  template: `
    <ion-content>
      <ion-list>
        <ion-list-header class="config-header">
          <ion-label>
            <h2 class="config-title">Tema de colores</h2>
            <p class="config-subtitle">
              Selecciona un tema para personalizar la apariencia de la
              aplicación
            </p>
          </ion-label>
        </ion-list-header>

        <ion-item
          *ngFor="let themeEntry of availableThemes"
          [class.selected-theme]="selectedTheme === themeEntry.key"
          (click)="selectTheme(themeEntry.key)"
        >
          <ion-avatar slot="start">
            <div
              class="theme-preview"
              [style.background]="
                'linear-gradient(135deg, ' +
                themeEntry.theme.primary +
                ' 0%, ' +
                themeEntry.theme.secondary +
                ' 100%)'
              "
            ></div>
          </ion-avatar>
          <ion-label>
            <h2>{{ themeEntry.theme.name }}</h2>
            <ion-text>
              <p>
                Primari: {{ themeEntry.theme.primary }} | Secundari:
                {{ themeEntry.theme.secondary }}
              </p>
            </ion-text>
          </ion-label>
          <ion-icon
            *ngIf="selectedTheme === themeEntry.key"
            name="checkmarkCircle"
            color="primary"
            slot="end"
          >
          </ion-icon>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
  styles: [
    `
      ion-item {
        cursor: pointer;
      }

      ion-item:hover {
        --background: var(--ion-color-light);
      }
      ion-list {
        padding: 0;
      }
      .theme-preview {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 2px solid var(--ion-color-medium);
      }

      .selected-theme {
        --background: var(--ion-color-primary-tint);
        --background-opacity: 0.1;
        color: var(--ion-color-primary-contrast);
      }

      .selected-theme:hover {
        color: var(--ion-text-color);
      }

      .config-header {
        --background: linear-gradient(
          135deg,
          var(--ion-color-primary),
          var(--ion-color-primary-tint)
        );
        padding: 12px 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      }

      /* Forzar contraste del texto del header (evita .sc-ion-label-md-s > p) */
      .config-header ion-label h2,
      .config-header ion-label p {
        color: var(--ion-color-primary-contrast) !important;
        margin: 0;
      }

      .config-title {
        font-weight: 700;
        font-size: 1.1rem;
        margin-bottom: 4px;
      }

      .config-subtitle {
        opacity: 0.9;
        font-size: 0.9rem;
      }
    `,
  ],
  imports: [SharedModule, CommonModule],
})
export class ConfigComponent implements OnInit {
  availableThemes: Array<{ key: string; theme: any }> = [];
  selectedTheme: string = 'nord';

  constructor(
    private themeService: ThemeService,
    private loadingCtrl: LoadingController
  ) {}

  async ngOnInit() {
    this.availableThemes = this.themeService.getAvailableThemes();
    await this.loadCurrentTheme();
  }

  async loadCurrentTheme() {
    try {
      const user = await account.get();
      if (user && user.prefs) {
        const preferences = user.prefs as UserPreferences;
        if (preferences.theme) {
          this.selectedTheme = preferences.theme;
        }
      }
    } catch (error) {
      // Error silencioso al cargar tema actual
    }
  }

  async selectTheme(themeKey: string) {
    const loading = await this.loadingCtrl.create({
      message: 'Guardando tema...',
      spinner: 'crescent',
      duration: 500,
    });

    await loading.present();

    try {
      await this.themeService.saveTheme(themeKey);
      this.selectedTheme = themeKey;
    } catch (error) {
      // Error silencioso al guardar tema
    } finally {
      await loading.dismiss();
    }
  }
}
