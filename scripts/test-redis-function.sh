#!/bin/bash

# Configuración
FUNCTION_URL="http://localhost:3000"
PROJECT_ID="elizabeth-nails"

echo "🚀 Iniciando pruebas de la función de caché..."

# Test 1: Almacenar datos
echo "📝 Test 1: Almacenando datos en caché..."
curl -X POST "${FUNCTION_URL}/cache/set" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: ${PROJECT_ID}" \
  -d '{
    "key": "test_client_123",
    "dataType": "clients",
    "value": {
      "id": "123",
      "name": "María García",
      "email": "maria@example.com",
      "phone": "+34 666 123 456"
    },
    "ttl": 1800
  }' | jq '.'

echo -e "\n"

# Test 2: Obtener datos
echo "📖 Test 2: Obteniendo datos del caché..."
curl -X POST "${FUNCTION_URL}/cache/get" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: ${PROJECT_ID}" \
  -d '{
    "key": "test_client_123",
    "dataType": "clients"
  }' | jq '.'

echo -e "\n"

# Test 3: Obtener estadísticas
echo "📊 Test 3: Obteniendo estadísticas..."
curl -X GET "${FUNCTION_URL}/cache/stats" \
  -H "X-Appwrite-Project: ${PROJECT_ID}" | jq '.'

echo -e "\n"

# Test 4: Almacenar más datos
echo "📝 Test 4: Almacenando más datos..."
curl -X POST "${FUNCTION_URL}/cache/set" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: ${PROJECT_ID}" \
  -d '{
    "key": "test_appointment_456",
    "dataType": "appointments",
    "value": {
      "id": "456",
      "clientId": "123",
      "date": "2024-12-20",
      "time": "10:00",
      "service": "Manicura"
    },
    "ttl": 600
  }' | jq '.'

echo -e "\n"

# Test 5: Estadísticas actualizadas
echo "📊 Test 5: Estadísticas actualizadas..."
curl -X GET "${FUNCTION_URL}/cache/stats" \
  -H "X-Appwrite-Project: ${PROJECT_ID}" | jq '.'

echo -e "\n"

# Test 6: Limpiar caché de clientes
echo "🗑️ Test 6: Limpiando caché de clientes..."
curl -X POST "${FUNCTION_URL}/cache/clear" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: ${PROJECT_ID}" \
  -d '{
    "dataType": "clients"
  }' | jq '.'

echo -e "\n"

# Test 7: Verificar que se limpió
echo "🔍 Test 7: Verificando limpieza..."
curl -X POST "${FUNCTION_URL}/cache/get" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: ${PROJECT_ID}" \
  -d '{
    "key": "test_client_123",
    "dataType": "clients"
  }' | jq '.'

echo -e "\n"

# Test 8: Limpiar caché de citas
echo "🗑️ Test 8: Limpiando caché de citas..."
curl -X POST "${FUNCTION_URL}/cache/clear" \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: ${PROJECT_ID}" \
  -d '{
    "dataType": "appointments"
  }' | jq '.'

echo -e "\n"

echo "✅ Pruebas completadas!"