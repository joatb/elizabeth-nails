import { Injectable } from '@angular/core';
import { DBService } from './db.service';

@Injectable({
  providedIn: 'root'
})
export class CacheManagementService {

  constructor(private dbService: DBService) {}

  async refreshAllData(): Promise<void> {
    await this.dbService.clearAllCache();
  }

  async refreshData(type: 'clients' | 'appointments' | 'messages' | 'schedules'): Promise<void> {
    await this.dbService.clearCacheForCollection('core', type);
  }

  async forceReload(type: 'clients' | 'appointments' | 'messages' | 'schedules'): Promise<void> {
    await this.refreshData(type);
  }

  async cleanupExpiredCache(): Promise<void> {
    await this.dbService.clearAllCache();
  }

  getCacheConfig() {
    return {
      strategies: {
        clients: { ttl: 86400, description: '24 horas - datos muy estables' },
        appointments: { ttl: 1800, description: '30 minutos - datos dinámicos' },
        messages: { ttl: 300, description: '5 minutos - muy dinámicos' },
        schedules: { ttl: 86400, description: '24 horas - muy estables' }
      }
    };
  }

  async getSystemStats() {
    return {
      cache: { redis: { keys: 0 }, localStorage: { keys: 0 } },
      reads: { totalRowsRead: 0 },
      timestamp: new Date().toISOString()
    };
  }

  async getHealthStatus() {
    return {
      status: 'healthy' as const,
      redis: false,
      localStorage: false,
      totalReads: 0,
      cacheHits: 0,
      lastCheck: new Date().toISOString(),
      error: undefined as string | undefined
    };
  }
}
