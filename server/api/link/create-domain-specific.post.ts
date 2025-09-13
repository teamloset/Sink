import { LinkSchema } from '@@/schemas/link'

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
