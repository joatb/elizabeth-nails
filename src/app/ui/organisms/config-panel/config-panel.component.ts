import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { SharedModule } from "../../../modules/shared.module";
import { ColorTheme, ThemeService } from "../../../services/theme.service";
import { account } from "../../../../lib/appwrite";
import { UserPreferences } from "../../../models/user-preferences";
import { LoadingController } from "@ionic/angular/standalone";

@Component({
  selector: "app-config",
  standalone: true,
  templateUrl: "./config-panel.component.html",
  styleUrls: ["./config-panel.component.scss"],
  imports: [SharedModule, CommonModule],
})
export class ConfigComponent implements OnInit {
  availableThemes: Array<{ key: string; theme: ColorTheme }> = [];
  selectedTheme: string = "nord";

  constructor(
    private themeService: ThemeService,
    private loadingCtrl: LoadingController,
  ) {}

  async ngOnInit(): Promise<void> {
    this.availableThemes = this.themeService.getAvailableThemes();
    await this.loadCurrentTheme();
  }

  async loadCurrentTheme(): Promise<void> {
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

  async selectTheme(themeKey: string): Promise<void> {
    const loading = await this.loadingCtrl.create({
      message: "Guardando tema...",
      spinner: "crescent",
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
