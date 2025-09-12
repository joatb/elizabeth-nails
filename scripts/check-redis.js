#!/usr/bin/env node

// Cargar variables de entorno desde .env
require('dotenv').config();

const { createClient } = require('redis');

async function checkRedisConnection() {
  const redisUrl = process.env.REDIS_URL || process.env.NG_APP_REDIS_URL;
  
  if (!redisUrl) {
    console.log('❌ Redis URL no configurada');
    console.log('💡 Añade REDIS_URL o NG_APP_REDIS_URL a tu archivo .env');
    process.exit(1);
  }

  console.log('🔗 Verificando conexión a Redis...');
  console.log(`📍 URL: ${redisUrl.replace(/\/\/.*@/, '//***:***@')}`); // Ocultar credenciales

  try {
    const client = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000,
        lazyConnect: true
      }
    });

    client.on('error', (err) => {
      console.error('❌ Error de conexión Redis:', err.message);
      process.exit(1);
    });

    await client.connect();
    
    // Test básico
    await client.set('test:connection', 'ok', { EX: 10 });
    const result = await client.get('test:connection');
    
    if (result === 'ok') {
      console.log('✅ Redis conectado correctamente');
      
      // Obtener información del servidor
      const info = await client.info('server');
      const version = info.match(/redis_version:([^\r\n]+)/)?.[1] || 'desconocida';
      console.log(`📊 Versión Redis: ${version}`);
      
      await client.del('test:connection');
      await client.quit();
      
      console.log('🎉 Configuración Redis válida');
    } else {
      console.log('❌ Test de Redis falló');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error conectando a Redis:', error.message);
    console.log('💡 Verifica que:');
    console.log('   - Redis esté ejecutándose');
    console.log('   - La URL sea correcta');
    console.log('   - Las credenciales sean válidas');
    console.log('   - No haya firewall bloqueando la conexión');
    process.exit(1);
  }
}

checkRedisConnection();