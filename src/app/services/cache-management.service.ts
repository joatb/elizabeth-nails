import { Injectable } from '@angular/core';
import { DBService } from './db.service';
import { AppwriteCacheService } from './appwrite-cache.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CacheManagementService {

  constructor(
    private dbService: DBService,
    private appwriteCache: AppwriteCacheService
  ) {}

  /**
   * Refresca todos los datos críticos
   */
  async refreshAllData(): Promise<void> {
    await this.dbService.clearAllCache();
  }

  /**
   * Refresca datos específicos
   */
  async refreshData(type: 'clients' | 'appointments' | 'messages' | 'schedules'): Promise<void> {
    const collectionMap = {
      'clients': 'clients',
      'appointments': 'appointments',
      'messages': 'messages',
      'schedules': 'schedules'
    };

    await this.dbService.clearCacheForCollection('core', collectionMap[type]);
  }

  /**
   * Obtiene estadísticas completas del sistema de caché
   */
  async getSystemStats() {
    try {
      const cacheStats = await this.dbService.getCacheStats();
      const readStats = this.dbService.getReadStats();
      const redisPing = await this.dbService.pingRedis();

      return {
        cache: cacheStats || { redis: { keys: 0 }, localStorage: { keys: 0 } },
        reads: readStats || { totalRowsRead: 0 },
        redis: {
          connected: redisPing,
          url: environment.redisUrl ? 'Configurado' : 'No configurado'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas del sistema:', error);
      return {
        cache: { redis: { keys: 0 }, localStorage: { keys: 0 } },
        reads: { totalRowsRead: 0 },
        redis: {
          connected: false,
          url: 'Error'
        },
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Limpia caché expirado manualmente
   */
  async cleanupExpiredCache(): Promise<void> {
    await this.dbService.clearAllCache();
  }

  /**
   * Verifica el estado de la conexión Redis
   */
  async checkRedisConnection(): Promise<boolean> {
    try {
      const isConnected = await this.dbService.pingRedis();
      return isConnected;
    } catch (error) {
      console.error('Error verificando Redis:', error);
      return false;
    }
  }

  /**
   * Obtiene información de configuración del caché
   */
  getCacheConfig() {
    return {
      strategies: {
        clients: { ttl: 86400, description: '24 horas - datos muy estables' },
        appointments: { ttl: 1800, description: '30 minutos - datos dinámicos' },
        messages: { ttl: 300, description: '5 minutos - muy dinámicos' },
        schedules: { ttl: 86400, description: '24 horas - muy estables' }
      },
      fallback: 'localStorage',
      monitoring: 'Habilitado'
    };
  }

  /**
   * Fuerza la recarga de datos específicos
   */
  async forceReload(type: 'clients' | 'appointments' | 'messages' | 'schedules'): Promise<void> {
    await this.refreshData(type);
  }

  /**
   * Obtiene el estado de salud del sistema de caché
   */
  async getHealthStatus() {
    try {
      // Obtener estadísticas del sistema (ya incluye ping a Redis)
      const stats = await this.getSystemStats();
      
      // Validar que stats existe y tiene la estructura esperada
      if (!stats || !stats.cache) {
        return {
          status: 'error',
          redis: false,
          localStorage: false,
          totalReads: 0,
          cacheHits: 0,
          lastCheck: new Date().toISOString(),
          error: 'No se pudieron obtener estadísticas del caché'
        };
      }
      
      const localStorageKeys = stats.cache.localStorage?.keys || 0;
      const redisKeys = stats.cache.redis?.keys || 0;
      const totalReads = stats.reads?.totalRowsRead || 0;
      const redisConnected = stats.redis?.connected || false;
      
      return {
        status: redisConnected ? 'healthy' : 'degraded',
        redis: redisConnected,
        localStorage: localStorageKeys > 0,
        totalReads: totalReads,
        cacheHits: redisKeys + localStorageKeys,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error obteniendo estado de salud:', error);
      return {
        status: 'error',
        redis: false,
        localStorage: false,
        totalReads: 0,
        cacheHits: 0,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}