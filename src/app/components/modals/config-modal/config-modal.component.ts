import { CommonModule } from "@angular/common";
import { Component, ViewChild } from "@angular/core";
import { SharedModule } from "../../../modules/shared.module";
import { IonNav, IonModal } from "@ionic/angular/standalone";
import { ConfigComponent } from "../../../ui/organisms/config-panel/config-panel.component";
import { ModalTemplateComponent } from "../../../ui/templates/modal-template/modal-template.component";

@Component({
  selector: "app-config-modal",
  standalone: true,
  templateUrl: "./config-modal.component.html",
  styleUrls: ["./config-modal.component.scss"],
  imports: [SharedModule, CommonModule, ModalTemplateComponent],
})
export class ConfigModalComponent {
  showModalBackButton: boolean = false;

  @ViewChild("nav") private nav!: IonNav;
  @ViewChild("configModal") private modal!: IonModal;

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
