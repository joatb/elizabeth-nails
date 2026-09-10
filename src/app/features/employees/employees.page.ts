import { CommonModule } from "@angular/common";
import { Component, OnDestroy } from "@angular/core";
import { AlertController, ModalController } from "@ionic/angular/standalone";
import { LogOut } from "lucide-angular";
import { Subscription } from "rxjs";
import { AtomSpinnerComponent, ClientsToolbarComponent } from "../../ui";
import { SharedModule } from "../../modules/shared.module";
import { EmployeesProvider } from "../../providers/employees/employees.provider";
import { Employee } from "../../providers/employees/models/employee";
import { AuthService } from "../../services/auth.service";
import { AlertService } from "../../services/alert.service";
import { EventService } from "../../services/event.service";
import { TabBarVisibilityService } from "../../services/tab-bar-visibility.service";
import { EmployeeFormPage } from "../../ui/organisms/employee-form/employee-form.page";

@Component({
  selector: "app-employees",
  templateUrl: "employees.page.html",
  styleUrls: ["employees.page.scss"],
  imports: [CommonModule, SharedModule, ClientsToolbarComponent, AtomSpinnerComponent],
})
export class EmployeesPage implements OnDestroy {
  readonly LogOut = LogOut;

  employees: Employee[] = [];
  isLoading = false;
  private eventsSubscription: Subscription | null = null;

  constructor(
    protected authService: AuthService,
    private employeesProvider: EmployeesProvider,
    private alertCtrl: AlertController,
    private alertService: AlertService,
    private modalCtrl: ModalController,
    private events: EventService,
    private tabBarVisibility: TabBarVisibilityService,
  ) {}

  onIonScroll(ev: CustomEvent): void {
    this.tabBarVisibility.onScroll(ev.detail.scrollTop);
  }

  async ionViewDidEnter(): Promise<void> {
    this.subscribeToEvents();
    await this.loadData();
  }

  ionViewDidLeave(): void {
    this.eventsSubscription?.unsubscribe();
    this.eventsSubscription = null;
  }

  ngOnDestroy(): void {
    this.eventsSubscription?.unsubscribe();
    this.eventsSubscription = null;
  }

  trackByEmployeeId(_: number, employee: Employee): string {
    return employee.id;
  }

  async addEmployee(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: EmployeeFormPage,
      componentProps: {
        title: "Nuevo empleado",
      },
    });
    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (!data) return;

    await this.employeesProvider.createEmployee({
      name: data.name,
      color: data.color ?? "#5e81ac",
      active: data.active ?? true,
    });
    this.events.push("employees.changed", true);
    await this.alertService.presentToast("Empleado creado", 2500);
    await this.loadData();
  }

  async editEmployee(employee: Employee): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: EmployeeFormPage,
      componentProps: {
        title: "Editar empleado",
        employee: {
          name: employee.name,
          color: employee.color,
          active: employee.active,
        },
      },
    });
    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (!data) return;

    try {
      await this.employeesProvider.updateEmployee(employee.id, {
        name: data.name,
        color: data.color ?? "#5e81ac",
        active: data.active ?? true,
      });
      this.events.push("employees.changed", true);
      await this.alertService.presentToast("Empleado actualizado", 2500);
      await this.loadData();
    } catch (error) {
      await this.alertService.presentErrorToast("No se pudo actualizar el empleado", 2500);
    }
  }

  async deleteEmployee(employee: Employee): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: "Eliminar empleado",
      message: `¿Seguro que deseas eliminar a "${employee.name}"? Las citas asignadas a este empleado quedarán sin asignar.`,
      buttons: [
        { text: "Cancelar", role: "cancel" },
        {
          text: "Eliminar",
          role: "destructive",
          handler: async () => {
            await this.employeesProvider.deleteEmployee(employee.id);
            this.events.push("employees.changed", true);
            await this.alertService.presentToast("Empleado eliminado", 2500);
            await this.loadData();
          },
        },
      ],
    });

    await alert.present();
  }

  private async loadData(): Promise<void> {
    this.isLoading = true;
    const result = await this.employeesProvider.listEmployees();
    this.employees = result.documents;
    this.isLoading = false;
  }

  private subscribeToEvents(): void {
    if (this.eventsSubscription) return;

    this.eventsSubscription = this.events
      .getObservable()
      .subscribe((event: { name: string }) => {
        if (event?.name === "add.event") {
          void this.addEmployee();
        }
      });
  }
}
