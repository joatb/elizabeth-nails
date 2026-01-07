import { Component, OnInit } from '@angular/core';
import { AnimationController, IonApp, IonRouterOutlet, AnimationBuilder } from '@ionic/angular/standalone';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {

  constructor(private themeService: ThemeService) {
  }

  async ngOnInit() {
    // Cargar tema del usuario al iniciar la aplicación
    await this.themeService.loadUserTheme();
  }
}
