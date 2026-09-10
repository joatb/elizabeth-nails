import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Subscription } from "rxjs";
import { SharedModule } from "../../../modules/shared.module";
/* IonNav and IonModal provided via SharedModule (IonicModule); evitar import standalone para prevenir selectores duplicados */
import { ConfigComponent } from "../../../ui/organisms/config-panel/config-panel.component";
import { EventService } from "../../../services/event.service";

@Component({
  selector: "app-config-modal",
  standalone: true,
  templateUrl: "./config-modal.component.html",
  imports: [SharedModule, CommonModule],
})
export class ConfigModalComponent implements OnInit, OnDestroy {
  showModalBackButton: boolean = false;

  @ViewChild("nav") private nav: any;
  @ViewChild("configModal") private modal: any;

  private eventsSubscription: Subscription | null = null;

  constructor(private events: EventService) {}

  ngOnInit(): void {
    // Ver nota equivalente en calendar-schedule-modal.component.ts: el botón
    // que abre este modal vive dentro de un ion-popover cuyo contenido no
    // existe en el DOM hasta que se abre, así que el trigger por id de Ionic
    // no llega a engancharse. Se abre vía EventService en su lugar.
    this.eventsSubscription = this.events.getObservable().subscribe((event) => {
      if (event?.name === "open-config-modal") {
        void this.modal?.present();
      }
    });
  }

  ngOnDestroy(): void {
    this.eventsSubscription?.unsubscribe();
    this.eventsSubscription = null;
  }

  async onWillPresent() {
    // Solo intentar setRoot si `nav` existe y expone la API esperada.
    if (this.nav && typeof this.nav.setRoot === "function") {
      await this.nav.setRoot(ConfigComponent, { nav: this.nav });
      try {
        const canGoBack = await this.nav.canGoBack();
        this.showModalBackButton = !!canGoBack;
      } catch {
        this.showModalBackButton = false;
      }
    } else {
      this.showModalBackButton = false;
    }
  }

  async modalClose() {
    // Intentar usar nav si existe y puede navegar hacia atrás, con guards para evitar errores.
    try {
      if (this.nav && typeof this.nav.canGoBack === "function") {
        const canGoBack = await this.nav.canGoBack();
        if (canGoBack && typeof this.nav.pop === "function") {
          await this.nav.pop();
          return;
        }
      }
    } catch {
      // noop
    }

    // Por defecto cerrar el modal si está disponible.
    if (this.modal && typeof this.modal.dismiss === "function") {
      await this.modal.dismiss();
    }
  }
}
