import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CacheManagementService } from "../../../services/cache-management.service";

interface SystemStats {
  cache?: {
    redis?: { keys: number };
    localStorage?: { keys: number };
  };
  reads?: { totalRowsRead: number };
}

interface HealthStatus {
  redis: boolean;
  localStorage: boolean;
  status: "healthy" | "degraded" | "error";
  totalReads?: number;
  cacheHits?: number;
  lastCheck?: string;
  error?: string;
}

interface CacheConfig {
  strategies?: Record<string, { ttl: number; description: string }>;
}

@Component({
  selector: "app-cache-debug",
  standalone: true,
  templateUrl: "./cache-debug.component.html",
  styleUrls: ["./cache-debug.component.scss"],
  imports: [CommonModule],
})
export class CacheDebugComponent implements OnInit {
  showDebug = false;
  systemStats: SystemStats = {};
  healthStatus: HealthStatus = {
    redis: false,
    localStorage: false,
    status: "degraded",
    totalReads: 0,
    cacheHits: 0,
  };
  cacheConfig: CacheConfig = {};
  isLoading = false;

  constructor(private cacheManagement: CacheManagementService) {}

  ngOnInit() {
    this.cacheConfig = this.cacheManagement.getCacheConfig();
    // No cargar stats automáticamente al inicializar
  }

  toggleDebug() {
    this.showDebug = !this.showDebug;
    if (this.showDebug) {
      this.loadStats();
    }
  }

  async loadStats() {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    try {
      // Cargar estadísticas del sistema (incluye localStorage)
      this.systemStats = await this.cacheManagement.getSystemStats();

      // Cargar estado de salud (incluye ping a Redis)
      const healthData = await this.cacheManagement.getHealthStatus();

      this.healthStatus = {
        redis: healthData.redis,
        localStorage: (this.systemStats.cache?.localStorage?.keys || 0) > 0,
        status: healthData.status as "healthy" | "degraded" | "error",
        totalReads: healthData.totalReads,
        cacheHits: healthData.cacheHits,
        lastCheck: healthData.lastCheck,
        error: healthData.error,
      };
    } catch (error) {
      console.error("❌ Error cargando estadísticas:", error);
      this.healthStatus = {
        redis: false,
        localStorage: false,
        status: "error",
        totalReads: 0,
        cacheHits: 0,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    } finally {
      this.isLoading = false;
    }
  }

  async refreshAll() {
    await this.cacheManagement.refreshAllData();
    await this.loadStats();
  }

  async refreshAppointments() {
    await this.cacheManagement.refreshData("appointments");
    await this.loadStats();
  }

  async refreshClients() {
    await this.cacheManagement.refreshData("clients");
    await this.loadStats();
  }

  async clearAll() {
    await this.cacheManagement.cleanupExpiredCache();
    await this.loadStats();
  }

  getCacheStrategies() {
    if (!this.cacheConfig?.strategies) {
      return [];
    }
    return Object.entries(this.cacheConfig.strategies).map(([key, value]) => ({
      key,
      value: value as { ttl: number; description: string },
    }));
  }

  getStatusClass(): string {
    switch (this.healthStatus.status) {
      case "healthy":
        return "status-ok";
      case "degraded":
        return "status-warning";
      case "error":
        return "status-error";
      default:
        return "status-warning";
    }
  }

  getStatusText(): string {
    switch (this.healthStatus.status) {
      case "healthy":
        return "✅ Saludable";
      case "degraded":
        return "⚠️ Degradado";
      case "error":
        return "❌ Error";
      default:
        return "⚠️ Desconocido";
    }
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (error) {
      return dateString;
    }
  }
}
