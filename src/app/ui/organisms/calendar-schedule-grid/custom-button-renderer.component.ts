import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AlertController, IonButton, IonIcon } from "@ionic/angular/standalone";
import { ICellRendererAngularComp } from "ag-grid-angular";
import { ICellRendererParams } from "ag-grid-community";
import { SchedulesProvider } from "../../../providers/schedules/schedules.provider";

/**
 * Molécula de configuración para los botones personalizados.
 */
type CustomButtonConfig = {
  label?: string;
  icon?: string;
  color?: string;
  action: string;
};

/**
 * Parámetros esperados por el renderer desde ag-Grid.
 */
type CustomButtonParams = {
  buttons: CustomButtonConfig[];
  reload: () => void;
};

/**
 * Renderer de AG Grid que reutiliza la plantilla existente
 * `custom-button.component.html` para renderizar botones personalizados.
 *
 * Implementa ICellRendererAngularComp para integrarse con ag-grid-angular.
 *
 * Notas de diseño:
 * - Mantengo tipado estricto en TypeScript.
 * - No se usa `any` salvo en accesos puntuales a `params.data` cuando es necesario
 *   acceder a propiedades dinámicas (p. ej. `$id`).
 * - La plantilla referenciada debe estar en el mismo directorio:
 *     ./custom-button.component.html
 */
@Component({
  selector: "app-custom-button-renderer",
  standalone: true,
  templateUrl: "./custom-button.component.html",
  imports: [CommonModule, IonButton, IonIcon],
})
export class CustomButtonRendererComponent implements ICellRendererAngularComp {
  private params!: ICellRendererParams & CustomButtonParams;
  public buttons: CustomButtonConfig[] = [];

  constructor(
    private schedulesPvd: SchedulesProvider,
    private alertCtrl: AlertController,
  ) {}

  /**
   * Inicializa el renderer con los parámetros proporcionados por ag-Grid.
   */
  public agInit(params: ICellRendererParams & CustomButtonParams): void {
    this.params = params;
    this.buttons = params.buttons ?? [];
  }

  /**
   * Refresca el renderer. Devuelve true si la refresqueda fue aceptada.
   * En este caso no se necesita lógica adicional, devolvemos true.
   */
  public refresh(_params: ICellRendererParams): boolean {
    return true;
  }

  /**
   * Manejador cuando se pulsa un botón en la plantilla.
   * - Si la acción es 'delete' lanza el flujo de confirmación y eliminación.
   * - En otro caso muestra un alert simple (comportamiento legacy).
   */
  public async buttonClicked(action: string): Promise<void> {
    if (!action) {
      return;
    }

    if (action === "delete") {
      await this.deleteSchedule();
    } else {
      const name =
        (this.params && (this.params.data as Record<string, unknown>)?.["name"]) ??
        "item";
      // Usa un alert sencillo para mantener compatibilidad con la implementación previa.
      // En una iteración futura podríamos emitir eventos o usar un servicio de notificaciones.
      // eslint-disable-next-line no-alert
      alert(`Clicked: ${String(name)}`);
    }
  }

  /**
   * Elimina el schedule actual tras confirmar con el usuario.
   * Extrae el id desde `params.data.$id` y llama al provider correspondiente.
   */
  private async deleteSchedule(): Promise<void> {
    const data = this.params.data as Record<string, unknown> | null;
    const id = data?.["id"];
    if (!id || typeof id !== "string") {
      return;
    }

    const confirm = await this.alertCtrl.create({
      header: "Eliminar horario",
      message: "¿Quieres eliminar este horario?",
      buttons: [
        {
          text: "Cancelar",
          role: "cancel",
        },
        {
          text: "OK",
          role: "confirm",
          handler: async () => {
            // Intentar eliminar y recargar la tabla mediante el callback `reload`
            try {
              await this.schedulesPvd.deleteSchedule(String(id));
              // Llamamos al reload pasado en los params para refrescar la tabla
              this.params.reload();
            } catch (err) {
              // Si hay error, mostramos una consola; el servicio de alertas central
              // puede usarse en el futuro para notificaciones más ricas.
              // Mantengo el manejo mínimo aquí para no cambiar la API existente.
              // eslint-disable-next-line no-console
              console.error("Error eliminando horario:", err);
            }
          },
        },
      ],
    });

    await confirm.present();
  }
}
