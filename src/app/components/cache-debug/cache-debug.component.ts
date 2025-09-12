import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CacheManagementService } from '../../services/cache-management.service';

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
  status: 'healthy' | 'degraded' | 'error';
  totalReads?: number;
  cacheHits?: number;
  lastCheck?: string;
  error?: string;
}

interface CacheConfig {
  strategies?: Record<string, { ttl: number; description: string }>;
}

@Component({
  selector: 'app-cache-debug',
  standalone: true,
  template: `
    <div class="cache-debug" *ngIf="showDebug">
      <div class="debug-header">
        <h3>🔧 Debug del Sistema de Caché</h3>
        <button (click)="toggleDebug()" class="close-btn">×</button>
      </div>
      
      <div class="debug-content">
        <div class="loading-indicator" *ngIf="isLoading">
          <span>🔄 Cargando estadísticas...</span>
        </div>
        <div class="status-section">
          <h4>Estado del Sistema</h4>
          <div class="status-item">
            <span class="label">Redis:</span>
            <span [class]="(healthStatus.redis || (systemStats.cache?.redis?.keys || 0) > 0) ? 'status-ok' : 'status-error'">
              {{ (healthStatus.redis || (systemStats.cache?.redis?.keys || 0) > 0) ? '✅ Conectado' : '❌ Desconectado' }}
            </span>
          </div>
          <div class="status-item">
            <span class="label">LocalStorage:</span>
            <span [class]="(healthStatus.localStorage || (systemStats.cache?.localStorage?.keys || 0) > 0) ? 'status-ok' : 'status-warning'">
              {{ (healthStatus.localStorage || (systemStats.cache?.localStorage?.keys || 0) > 0) ? '✅ Activo' : '⚠️ Vacío' }}
            </span>
          </div>
          <div class="status-item">
            <span class="label">Estado General:</span>
            <span [class]="getStatusClass()">
              {{ getStatusText() }}
            </span>
          </div>
          <div class="status-item" *ngIf="healthStatus.error">
            <span class="label">Error:</span>
            <span class="status-error">{{ healthStatus.error }}</span>
          </div>
        </div>

        <div class="stats-section">
          <h4>Estadísticas</h4>
          <div class="stat-item">
            <span class="label">Total Lecturas:</span>
            <span class="value">{{ healthStatus.totalReads || systemStats.reads?.totalRowsRead || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="label">Claves en Redis:</span>
            <span class="value">{{ systemStats.cache?.redis?.keys || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="label">Claves en LocalStorage:</span>
            <span class="value">{{ systemStats.cache?.localStorage?.keys || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="label">Cache Hits:</span>
            <span class="value">{{ healthStatus.cacheHits || 0 }}</span>
          </div>
          <div class="stat-item" *ngIf="healthStatus.lastCheck">
            <span class="label">Última Verificación:</span>
            <span class="value">{{ formatDate(healthStatus.lastCheck) }}</span>
          </div>
        </div>

        <div class="actions-section">
          <h4>Acciones</h4>
          <div class="action-buttons">
            <button (click)="refreshAll()" class="btn btn-primary">🔄 Refrescar Todo</button>
            <button (click)="refreshAppointments()" class="btn btn-secondary">📅 Refrescar Citas</button>
            <button (click)="refreshClients()" class="btn btn-secondary">👥 Refrescar Clientes</button>
            <button (click)="clearAll()" class="btn btn-danger">🗑️ Limpiar Todo</button>
          </div>
        </div>

        <div class="config-section">
          <h4>Configuración del Caché</h4>
          <div class="config-item" *ngFor="let strategy of getCacheStrategies()">
            <span class="label">{{ strategy.key }}:</span>
            <span class="value">{{ strategy.value.ttl }}s - {{ strategy.value.description }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <button *ngIf="!showDebug" (click)="toggleDebug()" class="debug-toggle">
      🔧 Debug Caché
    </button>
  `,
  styles: [`
    .cache-debug {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 400px;
      max-height: 80vh;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      overflow-y: auto;
    }

    .debug-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #f5f5f5;
      border-bottom: 1px solid #ddd;
    }

    .debug-header h3 {
      margin: 0;
      font-size: 16px;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
    }

    .debug-content {
      padding: 16px;
    }

    .debug-content h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #333;
    }

    .status-section, .stats-section, .actions-section, .config-section {
      margin-bottom: 20px;
    }

    .status-item, .stat-item, .config-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 12px;
    }

    .label {
      font-weight: 500;
      color: #666;
    }

    .value {
      color: #333;
    }

    .status-ok {
      color: #28a745;
      font-weight: 500;
    }

    .status-warning {
      color: #ffc107;
      font-weight: 500;
    }

    .status-error {
      color: #dc3545;
      font-weight: 500;
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .btn {
      padding: 8px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-danger {
      background: #dc3545;
      color: white;
    }

    .loading-indicator {
      text-align: center;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 4px;
      margin-bottom: 16px;
      font-size: 12px;
      color: #666;
    }

    .debug-toggle {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      cursor: pointer;
      font-size: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 999;
    }
  `],
  imports: [CommonModule]
})
export class CacheDebugComponent implements OnInit {
  showDebug = false;
  systemStats: SystemStats = {};
  healthStatus: HealthStatus = { redis: false, localStorage: false, status: 'degraded', totalReads: 0, cacheHits: 0 };
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
        status: healthData.status as 'healthy' | 'degraded' | 'error',
        totalReads: healthData.totalReads,
        cacheHits: healthData.cacheHits,
        lastCheck: healthData.lastCheck,
        error: healthData.error
      };
      
    } catch (error) {
      console.error('❌ Error cargando estadísticas:', error);
      this.healthStatus = {
        redis: false,
        localStorage: false,
        status: 'error',
        totalReads: 0,
        cacheHits: 0,
        error: error instanceof Error ? error.message : 'Error desconocido'
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
    await this.cacheManagement.refreshData('appointments');
    await this.loadStats();
  }

  async refreshClients() {
    await this.cacheManagement.refreshData('clients');
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
      value: value as { ttl: number; description: string }
    }));
  }

  getStatusClass(): string {
    switch (this.healthStatus.status) {
      case 'healthy':
        return 'status-ok';
      case 'degraded':
        return 'status-warning';
      case 'error':
        return 'status-error';
      default:
        return 'status-warning';
    }
  }

  getStatusText(): string {
    switch (this.healthStatus.status) {
      case 'healthy':
        return '✅ Saludable';
      case 'degraded':
        return '⚠️ Degradado';
      case 'error':
        return '❌ Error';
      default:
        return '⚠️ Desconocido';
    }
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }
}