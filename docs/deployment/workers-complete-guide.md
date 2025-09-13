# Guía Completa de Despliegue en Cloudflare Workers

Esta guía te llevará paso a paso para desplegar Sink en Cloudflare Workers, incluyendo la configuración de dominios personalizados.

## 📋 Prerrequisitos

- Cuenta de Cloudflare activa
- Cuenta de GitHub
- Dominio administrado por Cloudflare (opcional, para dominios personalizados)

## 🚀 Paso 1: Preparar el Repositorio

### 1.1 Fork del Repositorio
1. Ve a [Sink en GitHub](https://github.com/ccbikai/Sink)
2. Haz clic en **Fork** para crear tu propia copia
3. Clona tu fork localmente:
   ```bash
   git clone https://github.com/TU_USUARIO/Sink.git
   cd Sink
   ```

### 1.2 Configurar Git (si es necesario)
```bash
git config user.name "TU_USUARIO"
git config user.email "tu@email.com"
```

## 🗄️ Paso 2: Configurar KV Namespace

### 2.1 Crear KV Namespace
1. Ve a tu [Dashboard de Cloudflare](https://dash.cloudflare.com/)
2. Selecciona tu cuenta
3. Ve a **Storage & Databases** → **KV**
4. Haz clic en **Create a namespace**
5. Dale un nombre descriptivo (ej: `sink-storage`)
6. Haz clic en **Add**
7. **Copia el Namespace ID** (lo necesitarás en el siguiente paso)

### 2.2 Actualizar wrangler.jsonc
1. Abre el archivo `wrangler.jsonc` en la raíz del proyecto
2. Encuentra la sección `kv_namespaces`:
   ```json
   "kv_namespaces": [
     {
       "binding": "KV",
       "id": "TU_NAMESPACE_ID_AQUI" // Reemplaza con tu ID real
     }
   ]
   ```
3. Reemplaza `TU_NAMESPACE_ID_AQUI` con el ID que copiaste en el paso anterior

## 📊 Paso 3: Configurar Analytics Engine

### 3.1 Habilitar Analytics Engine
1. En tu Dashboard de Cloudflare, ve a **Workers & Pages**
2. En el panel derecho, busca **Account details**
3. Localiza **Analytics Engine** y haz clic en **Set up**
4. Esto habilitará el tier gratuito

### 3.2 Crear Dataset
1. Ve a **Storage & Databases** → **Analytics Engine**
2. Haz clic en **+ Create Dataset**
3. Configura el dataset:
   - **Dataset Name**: `sink`
   - **Dataset Binding**: `ANALYTICS`
4. Haz clic en **Create Dataset**

## 🔧 Paso 4: Crear Proyecto en Cloudflare Workers

### 4.1 Crear Nuevo Proyecto
1. Ve a **Workers & Pages** en tu Dashboard de Cloudflare
2. Haz clic en **Create application**
3. Selecciona **Workers**
4. Haz clic en **Create Worker**

### 4.2 Configurar el Proyecto
1. **Nombre del Worker**: `sink` (o el que prefieras)
2. **Selecciona tu repositorio**: Elige tu fork de Sink
3. **Configurar comandos de build**:
   - **Build command**: `pnpm run build`
   - **Deploy command**: `npx wrangler deploy`
4. Haz clic en **Save and Deploy**

## 🔑 Paso 5: Configurar Variables de Entorno

### 5.1 Obtener Account ID
1. Ve a [Find Account and Zone IDs](https://developers.cloudflare.com/fundamentals/setup/find-account-and-zone-ids/)
2. Copia tu **Account ID**

### 5.2 Crear API Token
1. Ve a [Create API Token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)
2. Haz clic en **Create Token**
3. Selecciona **Custom token**
4. Configura los permisos:
   - **Account**: `Account Analytics:Read`
   - **Zone**: `Zone:Read` (si tienes dominios)
5. Copia el token generado

### 5.3 Configurar Variables en Workers
1. En tu proyecto de Workers, ve a **Settings** → **Variables and Secrets**
2. Haz clic en **+ Add** y configura:

   **Variable 1:**
   - **Name**: `NUXT_SITE_TOKEN`
   - **Value**: `tu_token_seguro_aqui` (mínimo 8 caracteres)
   - **Type**: `Plaintext`

   **Variable 2:**
   - **Name**: `NUXT_CF_ACCOUNT_ID`
   - **Value**: `tu_account_id_aqui`
   - **Type**: `Plaintext`

   **Variable 3:**
   - **Name**: `NUXT_CF_API_TOKEN`
   - **Value**: `tu_api_token_aqui`
   - **Type**: `Plaintext`

## 🚀 Paso 6: Desplegar la Aplicación

### 6.1 Commit y Push de Cambios
```bash
git add wrangler.jsonc
git commit -m "Configure KV namespace for deployment"
git push origin main
```

### 6.2 Redeploy
1. En tu proyecto de Workers, haz clic en **Deploy** o **Redeploy**
2. Espera a que el build se complete
3. Verifica que no haya errores en el log

## 🌐 Paso 7: Configurar Dominio Personalizado (Opcional)

### 7.1 Agregar Custom Domain
1. En tu proyecto de Workers, ve a **Settings** → **Domains & Routes**
2. Haz clic en **+ Add**
3. Ingresa tu dominio personalizado (ej: `link.tudominio.com`)
4. Haz clic en **Add Custom Domain**

### 7.2 Verificación Automática
- Si tu dominio está administrado por Cloudflare, la configuración DNS se hará automáticamente
- No necesitas crear registros CNAME manualmente
- Cloudflare manejará todo el enrutamiento

### 7.3 Dominios Múltiples
Puedes agregar múltiples dominios personalizados:
- `link.tudominio.com`
- `short.otrodominio.com`
- `s.tudominio.com`

Cada uno funcionará independientemente.

## ✅ Paso 8: Verificar el Despliegue

### 8.1 URLs de Acceso
Tu aplicación estará disponible en:
- **Workers URL**: `https://sink.tuaccount.workers.dev`
- **Dominio personalizado**: `https://link.tudominio.com` (si configuraste uno)

### 8.2 Acceso al Dashboard
1. Ve a tu URL de Sink
2. Haz clic en **Login** o ve a `/dashboard/login`
3. Ingresa tu `NUXT_SITE_TOKEN`
4. ¡Ya puedes usar tu acortador de enlaces!

## 🔄 Paso 9: Actualizaciones Futuras

### 9.1 Sincronizar con el Repositorio Original
```bash
# Agregar el repositorio original como upstream
git remote add upstream https://github.com/ccbikai/Sink.git

# Obtener las últimas actualizaciones
git fetch upstream

# Fusionar los cambios
git merge upstream/main

# Subir los cambios
git push origin main
```

### 9.2 Redeploy Automático
- Los cambios se desplegarán automáticamente cuando hagas push a tu repositorio
- O puedes hacer redeploy manual desde el dashboard de Cloudflare

## 🛠️ Solución de Problemas

### Error: KV namespace not found
- Verifica que el ID del namespace en `wrangler.jsonc` sea correcto
- Asegúrate de que el namespace existe en tu cuenta de Cloudflare

### Error: Analytics Engine not configured
- Verifica que Analytics Engine esté habilitado en tu cuenta
- Confirma que el dataset `sink` existe con binding `ANALYTICS`

### Error: Permission denied en Git
- Configura correctamente tu usuario de Git
- Usa un Personal Access Token para autenticación

### Dominio personalizado no funciona
- Verifica que el dominio esté administrado por Cloudflare
- Espera unos minutos para la propagación DNS
- Confirma que el custom domain esté agregado en Workers

## 📚 Recursos Adicionales

- [Documentación de Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Documentación de KV](https://developers.cloudflare.com/kv/)
- [Documentación de Analytics Engine](https://developers.cloudflare.com/analytics/)
- [API de Sink](./api.md)

## 🎉 ¡Listo!

Ahora tienes tu propio acortador de enlaces funcionando en Cloudflare Workers con:
- ✅ Almacenamiento en KV
- ✅ Analytics en tiempo real
- ✅ Dominio personalizado
- ✅ Escalabilidad automática
- ✅ Sin costos de servidor

¡Disfruta tu nuevo acortador de enlaces!
