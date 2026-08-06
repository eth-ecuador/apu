# ✅ Deployment Checklist - APU Backend a Render

Checklist rápido para desplegar en 5 minutos.

---

## 📝 Pre-Deployment

- [ ] Código committed y pushed a GitHub
- [ ] Private key guardada en un lugar seguro
- [ ] Cuenta de Render creada (render.com)

---

## 🚀 Deployment Steps

### 1. Conectar Repositorio
- [ ] Login en https://dashboard.render.com
- [ ] Click "New +" → "Blueprint"
- [ ] Seleccionar repositorio GitHub
- [ ] Render detecta `render.yaml` automáticamente
- [ ] Click "Apply"

### 2. Configurar Secrets
En Environment variables, agregar:

- [ ] `DEPLOYER_PRIVATE_KEY` = `0x0a05aaf16c162e10381e449bf9e0a28de96376a00f8837129af55567f9dd734b`
- [ ] `OG_DEPLOYER_PRIVATE_KEY` = `0x0a05aaf16c162e10381e449bf9e0a28de96376a00f8837129af55567f9dd734b`

**NOTA:** Las demás variables públicas ya están en render.yaml

### 3. Esperar Deployment
- [ ] Esperar ~5-7 minutos (primera vez)
- [ ] Ver logs en tiempo real
- [ ] Verificar que termine con "Server running on port 3001"

### 4. Verificar
- [ ] Test health check: `curl https://apu-backend.onrender.com/health`
- [ ] Verificar respuesta JSON con status "healthy"
- [ ] Verificar contractAddress correcto en respuesta

---

## ✅ Post-Deployment

- [ ] Guardar URL del backend: `https://apu-backend.onrender.com`
- [ ] Actualizar frontend con nueva URL
- [ ] Probar endpoints desde frontend
- [ ] Verificar logs en Render dashboard

---

## 🔧 Variables de Entorno (Referencia)

### Ya configuradas en render.yaml (públicas):
```
✅ NODE_VERSION=20.19.5
✅ PORT=3001
✅ MEDICAL_REGISTRY_ADDRESS=0x2819Cf40a952748014C56f393e1ffd16f4a377ff
✅ SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
✅ OG_RPC_URL=https://evmrpc-testnet.0g.ai
✅ OG_STORAGE_NODE_URL=https://rpc-storage-testnet.0g.ai
✅ OG_INDEXER_URL=https://indexer-storage-testnet-turbo.0g.ai
```

### Agregar manualmente (secretas):
```
⚠️ DEPLOYER_PRIVATE_KEY=0x...
⚠️ OG_DEPLOYER_PRIVATE_KEY=0x...
```

---

## 🎯 Commands Usados

**Build Command:**
```bash
npm install --legacy-peer-deps && cd packages/backend && npm run build
```

**Start Command:**
```bash
cd packages/backend && node dist/server.js
```

**Health Check Path:**
```
/health
```

---

## 🔍 Quick Troubleshooting

| Error | Solución |
|-------|----------|
| "Module not found" | Verificar `--legacy-peer-deps` en build command |
| "DEPLOYER_PRIVATE_KEY not set" | Agregar en Environment variables |
| Build timeout | Esperar más tiempo (primera build ~10 min) |
| "Cannot connect to contract" | Verificar MEDICAL_REGISTRY_ADDRESS |

---

## 📱 URLs Importantes

- **Backend URL:** https://apu-backend.onrender.com
- **Health Check:** https://apu-backend.onrender.com/health
- **Render Dashboard:** https://dashboard.render.com
- **Smart Contract:** https://sepolia.etherscan.io/address/0x2819Cf40a952748014C56f393e1ffd16f4a377ff

---

## 🎉 Success Indicators

Deployment exitoso si ves:

```json
// GET /health
{
  "status": "healthy",
  "services": {
    "storage": "0G Storage",
    "compute": "0G Compute",
    "contract": "MedicalDataRegistry"
  },
  "network": {
    "contractAddress": "0x2819Cf40a952748014C56f393e1ffd16f4a377ff"
  }
}
```

Y en logs:
```
[Server] ✓ All services initialized
[MedicalContract] ✓ Connected to MedicalDataRegistry
Server running on port 3001
```

---

**Tiempo estimado:** 5-10 minutos
**Costo:** Gratis (Free Tier)
**Status:** ✅ Ready to Deploy
