import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Client, Functions } from 'appwrite';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheResponse<T> {
  success: boolean;
  data?: T;
  fromCache?: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppwriteCacheService {
  private functions: Functions;
  
  // Configuraciones específicas por tipo de datos
  private cacheConfigs = {
    clients: { ttl: 86400, prefix: 'clients' }, // 24h
    appointments: { ttl: 1800, prefix: 'appointments' }, // 30 min
    messages: { ttl: 300, prefix: 'messages' }, // 5 min
    schedules: { ttl: 86400, prefix: 'schedules' } // 24h
  };

  constructor() {
    const client = new Client()
      .setEndpoint(environment.endpoint)
      .setProject('elizabeth-nails');
    
    this.functions = new Functions(client);
  }

  /**
   * Obtiene datos del caché a través de la función de Appwrite
   */
  async get<T>(key: string, dataType: keyof typeof this.cacheConfigs): Promise<T | null> {
    try {
      const response = await this.functions.createExecution(
        'cache-function',
        JSON.stringify({
          method: 'POST',
          path: '/cache/get',
          key,
          dataType
        })
      );


      if (!response.responseBody || response.responseBody.trim() === '') {
        console.warn('Respuesta vacía de la función de caché GET');
        return null;
      }

      const result: CacheResponse<T> = JSON.parse(response.responseBody);
      
      if (result.success && result.data) {
        return result.data;
      }
      
      return null;
    } catch (error) {
      console.warn('Error obteniendo caché:', error);
      return null;
    }
  }

  /**
   * Almacena datos en caché a través de la función de Appwrite
   */
  async set<T>(key: string, data: T, dataType: keyof typeof this.cacheConfigs): Promise<void> {
    try {
      const config = this.cacheConfigs[dataType];
      
      const response = await this.functions.createExecution(
        'cache-function',
        JSON.stringify({
          method: 'POST',
          path: '/cache/set',
          key,
          dataType,
          value: data,
          ttl: config.ttl
        })
      );


      if (!response.responseBody || response.responseBody.trim() === '') {
        console.warn('Respuesta vacía de la función de caché SET');
        return;
      }

      const result = JSON.parse(response.responseBody);
      
      if (result.success) {
      }
    } catch (error) {
      console.warn('Error almacenando caché:', error);
    }
  }

  /**
   * Invalida caché por tipo de datos
   */
  async invalidate(dataType: keyof typeof this.cacheConfigs): Promise<void> {
    try {
      const response = await this.functions.createExecution(
        'cache-function',
        JSON.stringify({
          method: 'POST',
          path: '/cache/clear',
          dataType
        })
      );

      const result = JSON.parse(response.responseBody);
      
      if (result.success) {
        console.log(`��️ Caché invalidado: ${dataType}`);
      }
    } catch (error) {
      console.warn('Error invalidando caché:', error);
    }
  }

  /**
   * Limpia todo el caché
   */
  async clear(): Promise<void> {
    try {
      const response = await this.functions.createExecution(
        'cache-function',
        JSON.stringify({
          method: 'POST',
          path: '/cache/clear'
        })
      );

      const result = JSON.parse(response.responseBody);
      
      if (result.success) {
      }
    } catch (error) {
      console.warn('Error limpiando caché:', error);
    }
  }

  /**
   * Obtiene estadísticas del caché
   */
  async getStats(): Promise<any> {
    try {
      const response = await this.functions.createExecution(
        'cache-function',
        JSON.stringify({
          method: 'POST',
          path: '/cache/stats'
        })
      );


      if (!response.responseBody || response.responseBody.trim() === '') {
        console.warn('Respuesta vacía de la función de caché');
        return null;
      }

      const result = JSON.parse(response.responseBody);
      
      if (result.success) {
        return result.stats;
      }
      
      return null;
    } catch (error) {
      console.warn('Error obteniendo estadísticas:', error);
      return null;
    }
  }

  /**
   * Verifica la conexión a Redis
   */
  async ping(): Promise<boolean> {
    try {
      const response = await this.functions.createExecution(
        'cache-function',
        JSON.stringify({
          method: 'POST',
          path: '/cache/stats'
        })
      );


      if (!response.responseBody || response.responseBody.trim() === '') {
        console.warn('Respuesta vacía en ping');
        return false;
      }

      const result = JSON.parse(response.responseBody);
      return result.success || false;
    } catch (error) {
      console.warn('Error en ping:', error);
      return false;
    }
  }

  /**
   * Prueba la conexión con la función de caché
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.functions.createExecution(
        'cache-function',
        JSON.stringify({
          method: 'POST',
          path: '/cache/stats'
        })
      );

      
      if (response.responseBody && response.responseBody.trim() !== '') {
        const result = JSON.parse(response.responseBody);
        return result.success || false;
      }
      
      return false;
    } catch (error) {
      console.error('Error testing connection:', error);
      return false;
    }
  }
}