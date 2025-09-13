export default eventHandler(async (event) => {
  const slug = getQuery(event).slug
  if (slug) {
    const { cloudflare } = event.context
    const { KV } = cloudflare.env
    const { caseSensitive } = useRuntimeConfig(event)
    const host = getRequestHost(event) // Obtener el dominio actual

    const getLink = async (key: string) =>
      await KV.getWithMetadata(`link:${key}`, { type: 'json' })

    const lowerCaseSlug = slug.toLowerCase()
    
    // Buscar enlace específico por dominio
    const domainSpecificKey = `${host}:${caseSensitive ? slug : lowerCaseSlug}`
    let { metadata, value: link } = await getLink(domainSpecificKey)

    // Fallback: buscar enlace global (sin dominio específico)
    if (!link) {
      const result = await getLink(caseSensitive ? slug : lowerCaseSlug)
      link = result.value
      metadata = result.metadata
    }

    // Fallback adicional para caseSensitive
    if (!caseSensitive && !link && lowerCaseSlug !== slug) {
      const domainSpecificKeyOriginal = `${host}:${slug}`
      const result = await getLink(domainSpecificKeyOriginal)
      link = result.value
      metadata = result.metadata
      
      if (!link) {
        const result2 = await getLink(slug)
        link = result2.value
        metadata = result2.metadata
      }
    }

    if (link) {
      return {
        ...metadata,
        ...link,
      }
    }
  }
  throw createError({
    status: 404,
    statusText: 'Not Found',
  })
})
