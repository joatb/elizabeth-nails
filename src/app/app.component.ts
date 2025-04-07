import { Component } from '@angular/core';
import { AnimationController, IonApp, IonRouterOutlet, AnimationBuilder } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {

  constructor() {
  }
}
