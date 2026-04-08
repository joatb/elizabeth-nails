import { Injectable } from '@angular/core';
import { account } from '../../lib/appwrite';
import { UserPreferences } from '../models/user-preferences';
import { AuthService } from './auth.service';

export interface ColorTheme {
  name: string;
  primary: string;
  primaryRgb: string;
  primaryContrast: string;
  primaryShade: string;
  primaryTint: string;
  secondary: string;
  secondaryRgb: string;
  secondaryContrast: string;
  secondaryShade: string;
  secondaryTint: string;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private styleElement: HTMLStyleElement | null = null;

  private defaultThemes: Record<string, ColorTheme> = {
    graphite: {
      name: 'Graphite',
      primary: '#1f2937',
      primaryRgb: '31, 41, 55',
      primaryContrast: '#ffffff',
      primaryShade: '#111827',
      primaryTint: '#374151',
      secondary: '#ffffff',
      secondaryRgb: '255, 255, 255',
      secondaryContrast: '#1f2937',
      secondaryShade: '#e5e7eb',
      secondaryTint: '#f9fafb'
    },
    nord: {
      name: 'Nord',
      primary: '#5e81ac',
      primaryRgb: '94, 129, 172',
      primaryContrast: '#eceff4',
      primaryShade: '#4c6a96',
      primaryTint: '#81a1c1',
      secondary: '#5e81ac',
      secondaryRgb: '94, 129, 172',
      secondaryContrast: '#eceff4',
      secondaryShade: '#4c6a96',
      secondaryTint: '#81a1c1'
    },
    ocean: {
      name: 'Ocean',
      primary: '#4f8fc9',
      primaryRgb: '79, 143, 201',
      primaryContrast: '#ffffff',
      primaryShade: '#3f79b1',
      primaryTint: '#6ea4d5',
      secondary: '#6ea4d5',
      secondaryRgb: '110, 164, 213',
      secondaryContrast: '#ffffff',
      secondaryShade: '#5e8fbd',
      secondaryTint: '#8ab8df'
    },
    forest: {
      name: 'Forest',
      primary: '#2d5016',
      primaryRgb: '45, 80, 22',
      primaryContrast: '#ffffff',
      primaryShade: '#264512',
      primaryTint: '#42622d',
      secondary: '#4a7c59',
      secondaryRgb: '74, 124, 89',
      secondaryContrast: '#ffffff',
      secondaryShade: '#3f6d4d',
      secondaryTint: '#5c896a'
    },
    sunset: {
      name: 'Sunset',
      primary: '#ff6b35',
      primaryRgb: '255, 107, 53',
      primaryContrast: '#ffffff',
      primaryShade: '#e05e2e',
      primaryTint: '#ff7a49',
      secondary: '#f7931e',
      secondaryRgb: '247, 147, 30',
      secondaryContrast: '#ffffff',
      secondaryShade: '#d9811a',
      secondaryTint: '#f89e3b'
    },
    purple: {
      name: 'Purple',
      primary: '#7b2cbf',
      primaryRgb: '123, 44, 191',
      primaryContrast: '#ffffff',
      primaryShade: '#6c27a9',
      primaryTint: '#8841c5',
      secondary: '#9d4edd',
      secondaryRgb: '157, 78, 221',
      secondaryContrast: '#ffffff',
      secondaryShade: '#8a44c2',
      secondaryTint: '#a760e1'
    }
  };

  constructor(private authService: AuthService) {}

  /**
   * Obtiene todos los temas disponibles con sus claves
   */
  getAvailableThemes(): Array<{ key: string; theme: ColorTheme }> {
    return Object.entries(this.defaultThemes).map(([key, theme]) => ({
      key,
      theme
    }));
  }

  /**
   * Obtiene un tema por clave
   */
  getTheme(themeKey: string): ColorTheme {
    return this.defaultThemes[themeKey] || this.defaultThemes['graphite'];
  }

  /**
   * Obtiene la clave de un tema por su nombre
   */
  getThemeKeyByName(themeName: string): string | null {
    const entry = Object.entries(this.defaultThemes).find(
      ([_, theme]) => theme.name === themeName
    );
    return entry ? entry[0] : null;
  }

  /**
   * Aplica un tema a la aplicación usando CSS variables
   */
  applyTheme(theme: ColorTheme): void {
    // Crear o actualizar el elemento style dinámico
    if (!this.styleElement) {
      this.styleElement = document.createElement('style');
      this.styleElement.id = 'dynamic-theme';
      document.head.appendChild(this.styleElement);
    }

    // Generar CSS con las variables del tema
    const css = `
      :root {
        --ion-color-primary: ${theme.primary} !important;
        --ion-color-primary-rgb: ${theme.primaryRgb} !important;
        --ion-color-primary-contrast: ${theme.primaryContrast} !important;
        --ion-color-primary-contrast-rgb: ${this.hexToRgb(theme.primaryContrast)} !important;
        --ion-color-primary-shade: ${theme.primaryShade} !important;
        --ion-color-primary-tint: ${theme.primaryTint} !important;

        --ion-color-secondary: ${theme.secondary} !important;
        --ion-color-secondary-rgb: ${theme.secondaryRgb} !important;
        --ion-color-secondary-contrast: ${theme.secondaryContrast} !important;
        --ion-color-secondary-contrast-rgb: ${this.hexToRgb(theme.secondaryContrast)} !important;
        --ion-color-secondary-shade: ${theme.secondaryShade} !important;
        --ion-color-secondary-tint: ${theme.secondaryTint} !important;

        --ion-color-dark: ${theme.primaryShade} !important;
        --ion-color-dark-rgb: ${this.hexToRgb(theme.primaryShade)} !important;
        --ion-color-dark-contrast: ${theme.primaryContrast} !important;
        --ion-color-dark-contrast-rgb: ${this.hexToRgb(theme.primaryContrast)} !important;
        --ion-color-dark-shade: ${theme.primaryShade} !important;
        --ion-color-dark-tint: ${theme.primary} !important;

        --ion-color-medium: ${theme.primaryTint} !important;
        --ion-color-medium-rgb: ${this.hexToRgb(theme.primaryTint)} !important;
        --ion-color-medium-contrast: ${theme.primaryContrast} !important;
        --ion-color-medium-contrast-rgb: ${this.hexToRgb(theme.primaryContrast)} !important;
        --ion-color-medium-shade: ${theme.primary} !important;
        --ion-color-medium-tint: ${theme.secondaryShade} !important;

        --ion-color-light: ${theme.secondaryTint} !important;
        --ion-color-light-rgb: ${this.hexToRgb(theme.secondaryTint)} !important;
        --ion-color-light-contrast: ${theme.secondaryContrast} !important;
        --ion-color-light-contrast-rgb: ${this.hexToRgb(theme.secondaryContrast)} !important;
        --ion-color-light-shade: ${theme.secondary} !important;
        --ion-color-light-tint: ${theme.secondaryTint} !important;
        --app-gradient-primary: linear-gradient(135deg, ${theme.primary}, ${theme.primaryTint}) !important;
      }

      ion-app {
        --ion-color-primary: ${theme.primary} !important;
        --ion-color-primary-rgb: ${theme.primaryRgb} !important;
        --ion-color-primary-contrast: ${theme.primaryContrast} !important;
        --ion-color-primary-shade: ${theme.primaryShade} !important;
        --ion-color-primary-tint: ${theme.primaryTint} !important;

        --ion-color-secondary: ${theme.secondary} !important;
        --ion-color-secondary-rgb: ${theme.secondaryRgb} !important;
        --ion-color-secondary-contrast: ${theme.secondaryContrast} !important;
        --ion-color-secondary-shade: ${theme.secondaryShade} !important;
        --ion-color-secondary-tint: ${theme.secondaryTint} !important;

        --ion-color-dark: ${theme.primaryShade} !important;
        --ion-color-dark-rgb: ${this.hexToRgb(theme.primaryShade)} !important;
        --ion-color-dark-contrast: ${theme.primaryContrast} !important;
        --ion-color-dark-shade: ${theme.primaryShade} !important;
        --ion-color-dark-tint: ${theme.primary} !important;

        --ion-color-medium: ${theme.primaryTint} !important;
        --ion-color-medium-rgb: ${this.hexToRgb(theme.primaryTint)} !important;
        --ion-color-medium-contrast: ${theme.primaryContrast} !important;
        --ion-color-medium-shade: ${theme.primary} !important;
        --ion-color-medium-tint: ${theme.secondaryShade} !important;

        --ion-color-light: ${theme.secondaryTint} !important;
        --ion-color-light-rgb: ${this.hexToRgb(theme.secondaryTint)} !important;
        --ion-color-light-contrast: ${theme.secondaryContrast} !important;
        --ion-color-light-shade: ${theme.secondary} !important;
        --ion-color-light-tint: ${theme.secondaryTint} !important;
        --app-gradient-primary: linear-gradient(135deg, ${theme.primary}, ${theme.primaryTint}) !important;
      }
    `;

    this.styleElement.textContent = css;

    // También aplicar directamente en el root como respaldo
    const root = document.documentElement;
    root.style.setProperty('--ion-color-primary', theme.primary);
    root.style.setProperty('--ion-color-primary-rgb', theme.primaryRgb);
    root.style.setProperty('--ion-color-primary-contrast', theme.primaryContrast);
    root.style.setProperty('--ion-color-primary-shade', theme.primaryShade);
    root.style.setProperty('--ion-color-primary-tint', theme.primaryTint);

    root.style.setProperty('--ion-color-secondary', theme.secondary);
    root.style.setProperty('--ion-color-secondary-rgb', theme.secondaryRgb);
    root.style.setProperty('--ion-color-secondary-contrast', theme.secondaryContrast);
    root.style.setProperty('--ion-color-secondary-shade', theme.secondaryShade);
    root.style.setProperty('--ion-color-secondary-tint', theme.secondaryTint);

    root.style.setProperty('--ion-color-dark', theme.primaryShade);
    root.style.setProperty('--ion-color-dark-rgb', this.hexToRgb(theme.primaryShade));
    root.style.setProperty('--ion-color-dark-contrast', theme.primaryContrast);
    root.style.setProperty('--ion-color-dark-contrast-rgb', this.hexToRgb(theme.primaryContrast));
    root.style.setProperty('--ion-color-dark-shade', theme.primaryShade);
    root.style.setProperty('--ion-color-dark-tint', theme.primary);

    root.style.setProperty('--ion-color-medium', theme.primaryTint);
    root.style.setProperty('--ion-color-medium-rgb', this.hexToRgb(theme.primaryTint));
    root.style.setProperty('--ion-color-medium-contrast', theme.primaryContrast);
    root.style.setProperty('--ion-color-medium-contrast-rgb', this.hexToRgb(theme.primaryContrast));
    root.style.setProperty('--ion-color-medium-shade', theme.primary);
    root.style.setProperty('--ion-color-medium-tint', theme.secondaryShade);

    root.style.setProperty('--ion-color-light', theme.secondaryTint);
    root.style.setProperty('--ion-color-light-rgb', this.hexToRgb(theme.secondaryTint));
    root.style.setProperty('--ion-color-light-contrast', theme.secondaryContrast);
    root.style.setProperty('--ion-color-light-contrast-rgb', this.hexToRgb(theme.secondaryContrast));
    root.style.setProperty('--ion-color-light-shade', theme.secondary);
    root.style.setProperty('--ion-color-light-tint', theme.secondaryTint);
    root.style.setProperty('--app-gradient-primary', `linear-gradient(135deg, ${theme.primary}, ${theme.primaryTint})`);
  }

  /**
   * Convierte un color hexadecimal a RGB
   */
  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
    }
    return '0, 0, 0';
  }

  /**
   * Carga y aplica el tema guardado en las preferencias del usuario
   */
  async loadUserTheme(): Promise<void> {
    try {
      const user = await account.get();
      if (user && user.prefs) {
        const preferences = user.prefs as UserPreferences;
        if (preferences.theme) {
          const theme = this.getTheme(preferences.theme);
          this.applyTheme(theme);
        } else {
          // Si no hay tema guardado, aplicar el tema por defecto
          this.applyTheme(this.defaultThemes['graphite']);
          this.authService.saveUserPreferences({ theme: 'graphite' });
        }
      } else {
        // Si no hay usuario o preferencias, aplicar tema por defecto
        this.applyTheme(this.defaultThemes['graphite']);
        this.authService.saveUserPreferences({ theme: 'graphite' });
      }
    } catch (error) {
      // Aplicar tema por defecto
      this.applyTheme(this.defaultThemes['graphite']);
      this.authService.saveUserPreferences({ theme: 'graphite' });
    }
  }

  /**
   * Guarda el tema seleccionado en las preferencias del usuario
   */
  async saveTheme(themeKey: string): Promise<void> {
    const preferences: UserPreferences = {
      theme: themeKey
    };
    await this.authService.saveUserPreferences(preferences);
    const theme = this.getTheme(themeKey);
    this.applyTheme(theme);
  }
}

