import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { account } from '../../lib/appwrite';
import { AuthService } from './auth.service';
import { UserPreferences } from '../models/user-preferences';

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
    nord: {
      name: 'Nord',
      primary: '#5e81ac',
      primaryRgb: '94, 129, 172',
      primaryContrast: '#eceff4',
      primaryShade: '#4c6a96',
      primaryTint: '#81a1c1',
      secondary: '#a3be8c',
      secondaryRgb: '163, 190, 140',
      secondaryContrast: '#2e3440',
      secondaryShade: '#8fa97a',
      secondaryTint: '#b6d1a3'
    },
    ocean: {
      name: 'Ocean',
      primary: '#0066cc',
      primaryRgb: '0, 102, 204',
      primaryContrast: '#ffffff',
      primaryShade: '#0055aa',
      primaryTint: '#1a75d9',
      secondary: '#00b3b3',
      secondaryRgb: '0, 179, 179',
      secondaryContrast: '#ffffff',
      secondaryShade: '#009999',
      secondaryTint: '#1abbbb'
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
    return this.defaultThemes[themeKey] || this.defaultThemes['nord'];
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
          this.applyTheme(this.defaultThemes['nord']);
          this.authService.saveUserPreferences({ theme: 'nord' });
        }
      } else {
        // Si no hay usuario o preferencias, aplicar tema por defecto
        this.applyTheme(this.defaultThemes['nord']);
        this.authService.saveUserPreferences({ theme: 'nord' });
      }
    } catch (error) {
      // Aplicar tema por defecto
      this.applyTheme(this.defaultThemes['nord']);
      this.authService.saveUserPreferences({ theme: 'nord' });
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

