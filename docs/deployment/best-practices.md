# Mejores Prácticas para Despliegue en Cloudflare Workers

## 🔐 Seguridad

### Tokens y Variables de Entorno
- **NUXT_SITE_TOKEN**: Usa un token fuerte de al menos 12 caracteres con números, letras y símbolos
- **NUXT_CF_API_TOKEN**: Crea tokens con permisos mínimos necesarios
- **Rotación de tokens**: Cambia los tokens periódicamente por seguridad

### Configuración de KV
- Usa namespaces separados para diferentes entornos (desarrollo, producción)
- Considera usar `preview_id` para desarrollo local

## 🌐 Dominios Personalizados

### Configuración Multi-Dominio
```json
// En wrangler.jsonc - ejemplo de múltiples dominios
{
  "routes": [
    { "pattern": "link.tudominio.com/*" },
    { "pattern": "short.otrodominio.com/*" },
    { "pattern": "s.tudominio.com/*" }
  ]
}
```

### Mejores Prácticas de Dominios
- Usa subdominios cortos y memorables: `s.tudominio.com`, `link.tudominio.com`
- Evita caracteres especiales en subdominios
- Considera usar dominios de nivel superior para casos de uso específicos

## 📊 Analytics y Monitoreo

### Configuración de Analytics Engine
- El dataset `sink` se crea automáticamente con la configuración correcta
- Los datos se almacenan por 3 meses en el tier gratuito
- Considera exportar datos importantes periódicamente

### Métricas Importantes a Monitorear
- Número de enlaces creados por día
- Clicks por enlace
- Ubicaciones geográficas de los usuarios
- Dispositivos y navegadores más utilizados

## 🚀 Optimización de Rendimiento

### Configuración de Workers
- Usa `compatibility_date` actualizada en `wrangler.jsonc`
- Habilita `nodejs_compat` si usas librerías de Node.js
- Considera usar `keep_vars: true` para mantener variables entre requests

### Optimización de KV
- Usa operaciones batch cuando sea posible
- Implementa cache local para datos frecuentemente accedidos
- Considera usar TTL para datos temporales

## 🔄 Gestión de Versiones

### Estrategia de Deployment
```bash
# Para cambios menores
git add .
git commit -m "feat: add new feature"
git push origin main

# Para cambios mayores
git checkout -b feature/nueva-funcionalidad
# ... hacer cambios ...
git commit -m "feat: major feature update"
git push origin feature/nueva-funcionalidad
# Crear Pull Request
```

### Rollback
- Mantén versiones estables en branches separados
- Usa tags de Git para marcar versiones importantes
- Cloudflare Workers mantiene historial de deployments automáticamente

## 🛠️ Desarrollo Local

### Configuración de Desarrollo
```bash
# Instalar dependencias
pnpm install

# Desarrollo local
pnpm dev

# Build local
pnpm build

# Preview local
pnpm preview
```

### Variables de Entorno Locales
Crea un archivo `.env.local`:
```env
NUXT_SITE_TOKEN=tu_token_desarrollo
NUXT_CF_ACCOUNT_ID=tu_account_id
NUXT_CF_API_TOKEN=tu_api_token_desarrollo
```

## 📈 Escalabilidad

### Límites de Cloudflare Workers
- **Requests**: 100,000 por día (tier gratuito)
- **CPU time**: 10ms por request (tier gratuito)
- **KV operations**: 1,000 por día (tier gratuito)
- **Analytics Engine**: 10,000 eventos por día (tier gratuito)

### Optimizaciones para Alto Tráfico
- Implementa rate limiting
- Usa cache agresivo para datos estáticos
- Considera usar D1 para datos relacionales complejos
- Implementa CDN para assets estáticos

## 🔍 Debugging y Logs

### Habilitar Logs
1. Ve a **Workers & Pages** → **Settings** → **Observability**
2. Habilita **Workers Logs**
3. Configura **Logpush** para logs persistentes

### Debugging en Producción
```javascript
// En tu código Worker
console.log('Debug info:', { request, env });
```

### Monitoreo de Errores
- Usa `console.error()` para errores importantes
- Implementa alertas para errores críticos
- Monitorea métricas de performance regularmente

## 🔧 Mantenimiento

### Tareas Regulares
- **Semanal**: Revisar logs de errores
- **Mensual**: Verificar uso de cuotas
- **Trimestral**: Rotar tokens de seguridad
- **Anual**: Revisar y actualizar dependencias

### Backup de Datos
- Exporta datos importantes de KV periódicamente
- Mantén backups de configuración en Git
- Documenta cambios importantes

## 🆘 Solución de Problemas Comunes

### Error: "KV namespace not found"
```bash
# Verificar namespace ID
wrangler kv:namespace list

# Verificar configuración
cat wrangler.jsonc | grep -A 3 kv_namespaces
```

### Error: "Analytics Engine not configured"
1. Verificar que Analytics Engine esté habilitado
2. Confirmar que el dataset existe
3. Verificar binding en wrangler.jsonc

### Error: "Permission denied"
1. Verificar API token permissions
2. Confirmar Account ID correcto
3. Verificar que el worker tenga acceso a recursos

### Performance Issues
1. Revisar métricas de CPU time
2. Optimizar queries a KV
3. Implementar cache local
4. Considerar upgrade de plan

## 📚 Recursos Adicionales

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [KV Documentation](https://developers.cloudflare.com/kv/)
- [Analytics Engine Documentation](https://developers.cloudflare.com/analytics/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)

## 💡 Consejos Finales

1. **Empieza simple**: Usa la configuración básica primero
2. **Monitorea desde el inicio**: Configura logs y métricas temprano
3. **Documenta todo**: Mantén notas de configuración y cambios
4. **Prueba regularmente**: Haz tests de funcionalidad periódicamente
5. **Mantén actualizado**: Actualiza dependencias y configuración regularmente

¡Con estas mejores prácticas tendrás un despliegue robusto y escalable de Sink!
