# 🔧 Variables de Entorno - Elizabeth Nails App

## 📋 Variables Requeridas

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```bash
# Appwrite Configuration
NG_APP_ENDPOINT=https://cloud.appwrite.io/v1

# WhatsApp Configuration
NG_APP_WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
NG_APP_WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# Redis Configuration
REDIS_URL=redis://username:password@host:port
```

## 🚀 Configuración de Redis

### Para Redis Local (Desarrollo)
```bash
REDIS_URL=redis://localhost:6379
```

## 🔄 Regenerar Archivos de Entorno

Después de configurar las variables de entorno, ejecuta:

```bash
node env.js
```

Esto generará automáticamente:
- `src/environments/environment.ts` (desarrollo)
- `src/environments/environment.prod.ts` (producción)

## ✅ Verificación

Para verificar que Redis está configurado correctamente, puedes usar el componente de debug:

```typescript
// En cualquier componente
constructor(private cacheManagement: CacheManagementService) {}

async checkRedis() {
  const isConnected = await this.cacheManagement.checkRedisConnection();
  console.log('Redis conectado:', isConnected);
}
```

## 🐛 Troubleshooting

### Redis no conecta
1. Verificar que la variable `REDIS_URL` esté configurada
2. Comprobar que la URL de Redis sea correcta
3. Verificar que Redis esté activo y accesible

### Variables no se cargan
1. Asegurarse de que el archivo `.env` esté en la raíz del proyecto
2. Ejecutar `node env.js` para regenerar los archivos
3. Reiniciar el servidor de desarrollo

### En Vercel
1. Añadir las variables en el dashboard de Vercel
2. Redesplegar la aplicación