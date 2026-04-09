import { Injectable } from "@angular/core";
import { Query } from "appwrite";
import { DBService } from "../../services/db.service";
import { Service } from "./models/service";

@Injectable({
  providedIn: "root",
})
export class ServicesProvider {
  private readonly database = "core";
  private readonly tableId = "services";

  constructor(private dbService: DBService) {}

  listServices() {
    return this.dbService.listDocuments<Service>(this.database, this.tableId, [
      Query.orderAsc("name"),
      Query.limit(2500),
    ]);
  }

  createService(service: {
    name: string;
    description: string;
    price: number;
    color: string;
  }) {
    return this.dbService.createDocument(this.database, this.tableId, service);
  }

  updateService(
    serviceId: string,
    service: {
      name: string;
      description: string;
      price: number;
      color: string;
    },
  ) {
    return this.dbService.updateDocument(
      this.database,
      this.tableId,
      serviceId,
      service,
    );
  }

  deleteService(serviceId: string) {
    return this.dbService.deleteDocument(this.database, this.tableId, serviceId);
  }
}
