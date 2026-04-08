import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { IonSpinner } from "@ionic/angular/standalone";

type LoadingBannerVariant = "neutral" | "primary";

@Component({
  selector: "mol-loading-banner",
  standalone: true,
  templateUrl: "./mol-loading-banner.component.html",
  styleUrls: ["./mol-loading-banner.component.scss"],
  imports: [CommonModule, IonSpinner],
})
export class MolLoadingBannerComponent {
  @Input() text: string = "Cargando...";
  @Input() variant: LoadingBannerVariant = "neutral";
  @Input() showSpinner: boolean = true;
}
