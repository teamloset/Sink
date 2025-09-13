# Enlaces Específicos por Dominio en Sink

Esta guía explica cómo modificar Sink para soportar enlaces cortos específicos por dominio, permitiendo que el mismo slug apunte a diferentes URLs dependiendo del dominio desde el cual se accede.

## 🎯 Objetivo

Permitir que:
- `link.goup.to/uno` → `uno.com`
- `link.guerrero.pro/uno` → `dos.com`

## 🔧 Modificaciones Necesarias

### 1. Modificar el Schema de Enlaces

Actualizar `schemas/link.ts` para incluir el dominio:

```typescript
export const LinkSchema = z.object({
  id: z.string().trim().max(26).default(nanoid(10)),
  url: z.string().trim().url().max(2048),
  slug: z.string().trim().max(2048).regex(new RegExp(slugRegex)).default(nanoid()),
  domain: z.string().trim().max(255).optional(), // Nuevo campo
  comment: z.string().trim().max(2048).optional(),
  createdAt: z.number().int().safe().default(() => Math.floor(Date.now() / 1000)),
  updatedAt: z.number().int().safe().default(() => Math.floor(Date.now() / 1000)),
  expiration: z.number().int().safe().refine(expiration => expiration > Math.floor(Date.now() / 1000), {
    message: 'expiration must be greater than current time',
    path: ['expiration'],
  }).optional(),
  title: z.string().trim().max(2048).optional(),
  description: z.string().trim().max(2048).optional(),
  image: z.string().trim().url().max(2048).optional(),
})
```

### 2. Modificar el Middleware de Redirección

Actualizar `server/middleware/1.redirect.ts`:

```typescript
export default eventHandler(async (event) => {
  const { pathname: slug } = parsePath(event.path.replace(/^\/|\/$/g, ''))
  const { slugRegex, reserveSlug } = useAppConfig(event)
  const { homeURL, linkCacheTtl, redirectWithQuery, caseSensitive } = useRuntimeConfig(event)
  const { cloudflare } = event.context

  if (event.path === '/' && homeURL)
    return sendRedirect(event, homeURL)

  if (slug && !reserveSlug.includes(slug) && slugRegex.test(slug) && cloudflare) {
    const { KV } = cloudflare.env
    const host = getRequestHost(event) // Obtener el dominio actual

    let link: z.infer<typeof LinkSchema> | null = null

    const getLink = async (key: string) =>
      await KV.get(`link:${key}`, { type: 'json', cacheTtl: linkCacheTtl })

    const lowerCaseSlug = slug.toLowerCase()
    
    // Buscar enlace específico por dominio
    const domainSpecificKey = `${host}:${caseSensitive ? slug : lowerCaseSlug}`
    link = await getLink(domainSpecificKey)

    // Fallback: buscar enlace global (sin dominio específico)
    if (!link) {
      link = await getLink(caseSensitive ? slug : lowerCaseSlug)
    }

    // Fallback adicional para caseSensitive
    if (!caseSensitive && !link && lowerCaseSlug !== slug) {
      const domainSpecificKeyOriginal = `${host}:${slug}`
      link = await getLink(domainSpecificKeyOriginal)
      
      if (!link) {
        link = await getLink(slug)
      }
    }

    if (link) {
      event.context.link = link
      try {
        await useAccessLog(event)
      }
      catch (error) {
        console.error('Failed write access log:', error)
      }
      const target = redirectWithQuery ? withQuery(link.url, getQuery(event)) : link.url
      return sendRedirect(event, target, +useRuntimeConfig(event).redirectStatusCode)
    }
  }
})
```

### 3. Modificar la Creación de Enlaces

Actualizar `server/api/link/create.post.ts`:

```typescript
export default eventHandler(async (event) => {
  const link = await readValidatedBody(event, LinkSchema.parse)
  const { caseSensitive } = useRuntimeConfig(event)
  const host = getRequestHost(event) // Obtener el dominio actual

  if (!caseSensitive) {
    link.slug = link.slug.toLowerCase()
  }

  const { cloudflare } = event.context
  const { KV } = cloudflare.env
  
  // Crear clave específica por dominio
  const domainSpecificKey = `${host}:${link.slug}`
  const existingLink = await KV.get(`link:${domainSpecificKey}`)
  
  if (existingLink) {
    throw createError({
      status: 409,
      statusText: 'Link already exists for this domain',
    })
  }

  const expiration = getExpiration(event, link.expiration)

  await KV.put(`link:${domainSpecificKey}`, JSON.stringify(link), {
    expiration,
    metadata: {
      expiration,
      url: link.url,
      comment: link.comment,
      domain: host, // Agregar dominio a metadata
    },
  })
  
  setResponseStatus(event, 201)
  const shortLink = `${getRequestProtocol(event)}://${host}/${link.slug}`
  return { link, shortLink }
})
```

### 4. Modificar la Búsqueda de Enlaces

Actualizar `server/api/link/search.get.ts`:

```typescript
export default eventHandler(async (event) => {
  const { cloudflare } = event.context
  const { KV } = cloudflare.env
  const host = getRequestHost(event) // Obtener el dominio actual
  const list: Link[] = []
  let finalCursor: string | undefined

  try {
    while (true) {
      // Buscar enlaces específicos del dominio
      const { keys, list_complete, cursor } = await KV.list({
        prefix: `link:${host}:`,
        limit: 1000,
        cursor: finalCursor,
      })

      finalCursor = cursor

      if (Array.isArray(keys)) {
        for (const key of keys) {
          try {
            if (key.metadata?.url) {
              list.push({
                slug: key.name.replace(`link:${host}:`, ''),
                url: key.metadata.url,
                comment: key.metadata.comment,
              })
            }
            else {
              const { metadata, value: link } = await KV.getWithMetadata(key.name, { type: 'json' })
              if (link) {
                list.push({
                  slug: key.name.replace(`link:${host}:`, ''),
                  url: link.url,
                  comment: link.comment,
                })
                await KV.put(key.name, JSON.stringify(link), {
                  expiration: metadata?.expiration,
                  metadata: {
                    ...metadata,
                    url: link.url,
                    comment: link.comment,
                    domain: host,
                  },
                })
              }
            }
          }
          catch (err) {
            console.error(`Error processing key ${key.name}:`, err)
            continue
          }
        }
      }

      if (!keys || list_complete) {
        break
      }
    }
    return list
  }
  catch (err) {
    console.error('Error fetching link list:', err)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch link list',
    })
  }
})
```

## 🚀 Implementación Paso a Paso

### Paso 1: Backup de Datos
```bash
# Exportar enlaces existentes antes de la migración
wrangler kv:key list --namespace-id=TU_NAMESPACE_ID
```

### Paso 2: Aplicar Modificaciones
1. Actualizar los archivos según las modificaciones mostradas
2. Hacer commit y push de los cambios
3. Redeploy el worker

### Paso 3: Migración de Datos Existentes
Crear un script de migración para mover enlaces existentes:

```typescript
// Script de migración (ejecutar una vez)
const migrateExistingLinks = async () => {
  const { keys } = await KV.list({ prefix: 'link:' })
  
  for (const key of keys) {
    if (!key.name.includes(':')) { // Enlaces sin dominio específico
      const link = await KV.get(key.name, { type: 'json' })
      if (link) {
        // Crear copias para cada dominio configurado
        const domains = ['link.goup.to', 'link.guerrero.pro']
        
        for (const domain of domains) {
          const newKey = `link:${domain}:${key.name.replace('link:', '')}`
          await KV.put(newKey, JSON.stringify(link), {
            metadata: {
              ...key.metadata,
              domain,
            },
          })
        }
      }
    }
  }
}
```

## ✅ Resultado Final

Después de implementar estas modificaciones:

- ✅ `link.goup.to/uno` → `uno.com`
- ✅ `link.guerrero.pro/uno` → `dos.com`
- ✅ Enlaces existentes siguen funcionando
- ✅ Analytics separados por dominio
- ✅ Dashboard muestra enlaces por dominio

## 🔧 Configuración Adicional

### Variables de Entorno
Agregar en `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      supportedDomains: ['link.goup.to', 'link.guerrero.pro']
    }
  }
})
```

### Validación de Dominios
Agregar validación para asegurar que solo dominios permitidos puedan crear enlaces:

```typescript
const validateDomain = (host: string) => {
  const supportedDomains = useRuntimeConfig().public.supportedDomains
  return supportedDomains.includes(host)
}
```

## 🎉 ¡Listo!

Con estas modificaciones tendrás un sistema de acortamiento de URLs completamente multi-dominio donde cada dominio puede tener sus propios enlaces cortos independientes.
