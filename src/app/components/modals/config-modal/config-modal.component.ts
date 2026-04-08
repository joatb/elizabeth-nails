import { CommonModule } from "@angular/common";
import { Component, ViewChild } from "@angular/core";
import { SharedModule } from "../../../modules/shared.module";
/* IonNav and IonModal provided via SharedModule (IonicModule); evitar import standalone para prevenir selectores duplicados */
import { ConfigComponent } from "../../../ui/organisms/config-panel/config-panel.component";

@Component({
  selector: "app-config-modal",
  standalone: true,
  templateUrl: "./config-modal.component.html",
  imports: [SharedModule, CommonModule],
})
export class ConfigModalComponent {
  showModalBackButton: boolean = false;

  @ViewChild("nav") private nav: any;
  @ViewChild("configModal") private modal: any;

  constructor() {}

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
