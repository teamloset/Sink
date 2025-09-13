import type { LinkSchema } from '@@/schemas/link'
import type { z } from 'zod'
import { parsePath, withQuery } from 'ufo'

export default eventHandler(async (event) => {
  const { pathname: slug } = parsePath(event.path.replace(/^\/|\/$/g, '')) // remove leading and trailing slashes
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
