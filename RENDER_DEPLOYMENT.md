# APU Backend - Deployment a Render

Guía completa para desplegar el backend de APU en Render.

---

## 📋 Pre-requisitos

- ✅ Cuenta en [Render](https://render.com) (gratis)
- ✅ Repositorio en GitHub/GitLab (este proyecto)
- ✅ Private key de wallet con fondos en Sepolia (para transacciones)
- ✅ Smart contract ya desplegado: `0x2819Cf40a952748014C56f393e1ffd16f4a377ff`

---

## 🚀 Opción 1: Deployment Automático (render.yaml)

### Paso 1: Push a GitHub

```bash
git add .
git commit -m "feat: prepare backend for Render deployment"
git push origin main
```

### Paso 2: Conectar en Render

1. Ve a https://dashboard.render.com
2. Click en **"New +"** → **"Blueprint"**
3. Conecta tu repositorio de GitHub
4. Render detectará automáticamente el `render.yaml`
5. Click en **"Apply"**

### Paso 3: Configurar Variables de Entorno Secretas

En el dashboard de Render, ve a tu servicio → **Environment** y agrega:

**CRÍTICO (Secreto):**
```
DEPLOYER_PRIVATE_KEY=0x0a05aaf16c162e10381e449bf9e0a28de96376a00f8837129af55567f9dd734b
OG_DEPLOYER_PRIVATE_KEY=0x0a05aaf16c162e10381e449bf9e0a28de96376a00f8837129af55567f9dd734b
```

**NOTA:** Las demás variables ya están en `render.yaml`.

### Paso 4: Deploy

Render desplegará automáticamente. Espera ~5 minutos.

✅ **URL del backend:** `https://apu-backend.onrender.com`

---

## 🔧 Opción 2: Deployment Manual (Dashboard)

### Paso 1: Crear Web Service

1. Ve a https://dashboard.render.com
2. Click en **"New +"** → **"Web Service"**
3. Conecta tu repositorio
4. Selecciona la rama `main`

### Paso 2: Configurar Build

**Name:** `apu-backend`

**Region:** `Oregon (US West)`

**Branch:** `main`

**Root Directory:** (dejar vacío)

**Environment:** `Node`

**Build Command:**
```bash
npm install --legacy-peer-deps && cd packages/backend && npm run build
```

**Start Command:**
```bash
cd packages/backend && node dist/server.js
```

### Paso 3: Configurar Variables de Entorno

Agregar todas estas variables en **Environment**:

```bash
# Node Configuration
NODE_VERSION=20.19.5
PORT=3001
NODE_ENV=production

# Deployment Keys (SECRETO!)
DEPLOYER_PRIVATE_KEY=0x0a05aaf16c162e10381e449bf9e0a28de96376a00f8837129af55567f9dd734b
OG_DEPLOYER_PRIVATE_KEY=0x0a05aaf16c162e10381e449bf9e0a28de96376a00f8837129af55567f9dd734b

# Contract Addresses
MEDICAL_REGISTRY_ADDRESS=0x2819Cf40a952748014C56f393e1ffd16f4a377ff

# RPC URLs
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
OG_GALILEO_RPC_URL=https://evmrpc-testnet.0g.ai
OG_RPC_URL=https://evmrpc-testnet.0g.ai

# 0G Services
OG_STORAGE_NODE_URL=https://rpc-storage-testnet.0g.ai
OG_INDEXER_URL=https://indexer-storage-testnet-turbo.0g.ai

# Zama KMS
NEXT_PUBLIC_KMS_GATEWAY_URL=https://gateway.sepolia.zama.dev
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

### Paso 4: Configurar Health Check

**Health Check Path:** `/health`

### Paso 5: Deploy

Click en **"Create Web Service"**.

Render comenzará el deployment (~5-7 minutos primera vez).

---

## ✅ Verificar Deployment

### 1. Health Check

```bash
curl https://apu-backend.onrender.com/health
```

**Respuesta esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2026-08-05T...",
  "services": {
    "storage": "0G Storage",
    "compute": "0G Compute",
    "contract": "MedicalDataRegistry"
  },
  "network": {
    "sepolia": "https://ethereum-sepolia-rpc.publicnode.com",
    "ogGalileo": "https://evmrpc-testnet.0g.ai",
    "contractAddress": "0x2819Cf40a952748014C56f393e1ffd16f4a377ff"
  },
  "note": "FHE encryption handled by frontend with @zama-fhe/sdk/web"
}
```

### 2. Test de Endpoints

**GET Patient Record:**
```bash
curl https://apu-backend.onrender.com/api/patient/0x799795DDef56d71A4d98Fac65cb88B7389614aBC
```

### 3. Logs en Render

Ve a tu servicio → **Logs** para ver:
```
[Server] ✓ All services initialized
[MedicalContract] ✓ Connected to MedicalDataRegistry
[MedicalContract]   Address: 0x2819Cf40a952748014C56f393e1ffd16f4a377ff
[MedicalContract]   Network: Sepolia (11155111)
[OGStorage] ✓ Initialized with 0G Storage SDK v1.2.10
[OGCompute] ✓ Initialized with 0G Compute SDK v0.9.0
Server running on port 3001
```

---

## 🔍 Troubleshooting

### Error: "Module not found"

**Causa:** Dependencias no instaladas correctamente.

**Solución:** Verificar que build command incluya `--legacy-peer-deps`:
```bash
npm install --legacy-peer-deps && cd packages/backend && npm run build
```

### Error: "DEPLOYER_PRIVATE_KEY not set"

**Causa:** Variable de entorno no configurada.

**Solución:**
1. Ve a Environment en Render dashboard
2. Agrega `DEPLOYER_PRIVATE_KEY` con tu private key
3. Redeploy

### Error: "Cannot connect to smart contract"

**Causa:** Contract address incorrecta o RPC no disponible.

**Solución:**
1. Verificar `MEDICAL_REGISTRY_ADDRESS=0x2819Cf40a952748014C56f393e1ffd16f4a377ff`
2. Verificar `SEPOLIA_RPC_URL` funcional
3. Ver logs para detalles

### Error: "Build timeout"

**Causa:** Free tier de Render tiene límites.

**Solución:**
1. Primera build puede tomar 10+ minutos
2. Esperar pacientemente
3. Si falla, hacer redeploy manual

### Error: "ethers version conflict"

**Causa:** NPM no usó `--legacy-peer-deps`.

**Solución:** Asegurar build command:
```bash
npm install --legacy-peer-deps && cd packages/backend && npm run build
```

---

## 📊 Monitoreo

### Render Dashboard

- **Metrics:** CPU, Memory, Response Time
- **Logs:** Real-time server logs
- **Events:** Deployment history

### Health Check Automático

Render hace ping a `/health` cada minuto. Si falla 3 veces consecutivas, reinicia el servicio.

---

## 💰 Costos

**Free Tier (actual):**
- ✅ 750 horas/mes gratis
- ✅ Sufficient para demo y desarrollo
- ⚠️ Se duerme después de 15 minutos de inactividad (primer request toma ~30s)

**Paid Tier ($7/mes):**
- ✅ Always on (no sleep)
- ✅ Más recursos
- ✅ Custom domain

---

## 🔐 Seguridad

### ⚠️ CRÍTICO: Private Keys

**NUNCA commitear private keys al repositorio.**

✅ **Correcto:** Variables de entorno en Render
❌ **INCORRECTO:** Hardcodear en código o .env

### CORS Configuration

El backend tiene CORS habilitado. En producción, limitar a tu dominio frontend:

```typescript
// server.ts
app.use(cors({
  origin: 'https://tu-frontend.vercel.app'
}));
```

---

## 🚀 Actualizar Deployment

### Método 1: Git Push (Automático)

```bash
git add .
git commit -m "feat: update backend"
git push origin main
```

Render detecta el push y redeploya automáticamente (~2-3 minutos).

### Método 2: Manual Redeploy

En Render dashboard → **Manual Deploy** → **Deploy latest commit**

---

## 📱 Integrar con Frontend

Una vez desplegado, actualizar frontend con la URL:

```typescript
// app/src/config.ts
export const BACKEND_URL = "https://apu-backend.onrender.com";
```

Probar endpoints:

```typescript
// Submit patient data
const response = await fetch(`${BACKEND_URL}/api/patient/submit`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    patientAddress,
    medicalData,
    symptoms,
    vitalSigns,
    encryptedRiskScore, // From Zama SDK
    proof                // From Zama SDK
  })
});
```

---

## 🎯 Next Steps

1. ✅ Deploy backend en Render
2. ⏳ Desarrollar frontend con Zama SDK
3. ⏳ Integrar frontend con backend desplegado
4. ⏳ Testing end-to-end completo
5. ⏳ Presentar en 0G Apollo Accelerator

---

## 📞 Soporte

**Backend URL:** https://apu-backend.onrender.com
**Health Check:** https://apu-backend.onrender.com/health
**Smart Contract:** https://sepolia.etherscan.io/address/0x2819Cf40a952748014C56f393e1ffd16f4a377ff

**Issues:** https://github.com/tu-repo/apu/issues

---

**Fecha:** 2026-08-05
**Versión:** 1.0.0
**Status:** ✅ Ready for Production Deployment
