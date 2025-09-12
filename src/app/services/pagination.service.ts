import { Injectable } from '@angular/core';
import { Models } from 'appwrite';

export interface PaginationOptions {
  limit: number;
  offset: number;
  cacheKey?: string;
}

export interface PaginatedResult<T> {
  documents: T[];
  total: number;
  hasMore: boolean;
  nextOffset?: number;
  fromCache: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PaginationService {
  
  private cache = new Map<string, { data: any[], total: number, timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Pagina datos de manera inteligente usando caché
   */
  async paginateData<T extends Models.Document>(
    fetchFunction: (limit: number, offset: number) => Promise<Models.DocumentList<T>>,
    options: PaginationOptions
  ): Promise<PaginatedResult<T>> {
    const { limit, offset, cacheKey } = options;
    
    // Si tenemos caché completo y estamos pidiendo datos dentro del rango cacheado
    if (cacheKey && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      
      
      // Verificar si el caché no ha expirado
      if (Date.now() - cached.timestamp < this.CACHE_TTL) {
        const startIndex = offset;
        const endIndex = Math.min(offset + limit, cached.data.length);
        
        // Solo usar caché si el offset está dentro del rango de datos cacheados
        if (offset < cached.data.length) {
          const paginatedData = cached.data.slice(startIndex, endIndex);
          
          
          return {
            documents: paginatedData,
            total: cached.total,
            hasMore: endIndex < cached.data.length,
            nextOffset: endIndex < cached.data.length ? endIndex : undefined,
            fromCache: true
          };
        } else {
        }
      } else {
        // Caché expirado, limpiarlo
        this.cache.delete(cacheKey);
      }
    }

    // Si no hay caché, está expirado, o el offset está fuera del rango cacheado, hacer petición a Appwrite
    const result = await fetchFunction(limit, offset);
    
    
    // Si es la primera página y tenemos pocos datos, cachear todo
    if (offset === 0 && result.documents.length <= 100) {
      this.cache.set(cacheKey || 'default', {
        data: result.documents,
        total: result.total,
        timestamp: Date.now()
      });
    }

    return {
      documents: result.documents,
      total: result.total,
      hasMore: offset + limit < result.total,
      nextOffset: offset + limit < result.total ? offset + limit : undefined,
      fromCache: false
    };
  }

  /**
   * Limpia el caché de paginación
   */
  clearCache(cacheKey?: string) {
    if (cacheKey) {
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Carga todos los datos para búsqueda completa
   */
  async loadAllData<T extends Models.Document>(
    fetchFunction: (limit: number, offset: number) => Promise<Models.DocumentList<T>>,
    cacheKey: string
  ): Promise<T[]> {
    // Si ya tenemos todos los datos en caché, devolverlos
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }
    }

    const allData: T[] = [];
    let offset = 0;
    const limit = 100; // Cargar en lotes de 100
    
    while (true) {
      const result = await fetchFunction(limit, offset);
      allData.push(...result.documents);
      
      if (result.documents.length < limit) {
        break; // No hay más datos
      }
      
      offset += limit;
    }

    // Cachear todos los datos
    this.cache.set(cacheKey, {
      data: allData,
      total: allData.length,
      timestamp: Date.now()
    });

    return allData;
  }

  /**
   * Obtiene estadísticas del caché de paginación
   */
  getCacheStats() {
    return {
      totalCached: this.cache.size,
      cacheKeys: Array.from(this.cache.keys()),
      totalItems: Array.from(this.cache.values()).reduce((sum, item) => sum + item.data.length, 0)
    };
  }
}