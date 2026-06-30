import { Component, OnDestroy } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "../../modules/shared.module";
import {
  AtomAvatarComponent,
  AtomBadgeComponent,
  AtomButtonComponent,
  AtomIconComponent,
  AtomInputComponent,
  AtomSpinnerComponent,
  AtomStatusIndicatorComponent,
  ClientSelectorInfiniteScrollEvent,
  MolActionButtonComponent,
  MolClientSelectorComponent,
  MolFormFieldComponent,
  MolPasswordInputComponent,
  MolStatItemComponent,
} from "../../ui";

@Component({
  selector: "app-ui-testing",
  templateUrl: "./ui-testing.page.html",
  styleUrls: ["ui-testing.page.scss"],
  imports: [
    SharedModule,
    FormsModule,
    AtomButtonComponent,
    AtomInputComponent,
    AtomIconComponent,
    AtomAvatarComponent,
    AtomBadgeComponent,
    AtomSpinnerComponent,
    AtomStatusIndicatorComponent,
    MolFormFieldComponent,
    MolPasswordInputComponent,
    MolStatItemComponent,
    MolActionButtonComponent,
    MolClientSelectorComponent,
  ],
})
export class UITestingPage implements OnDestroy {
  public demoEmail: string = "demo@elizabethnails.com";
  public demoPassword: string = "";
  public demoText: string = "";
  public passwordInvalid: boolean = true;
  public avatarUrl: string = "https://i.pravatar.cc/150?img=3";
  public statValue: number = 42;
  public clientOptions: Array<{ id: string; name: string }> = [
    { id: "1", name: "Ana López" },
    { id: "2", name: "María Pérez" },
    { id: "3", name: "Lucía Gómez" },
  ];
  public selectedClient: { id: string; name: string } | null = null;

  constructor() {}

  handleActionClick(): void {}

  handleClientSearch(event: { text: string }): void {
    void event;
  }

  handleClientLoadMore(event: ClientSelectorInfiniteScrollEvent): void {
    void event;
  }

  ngOnDestroy(): void {}
}
