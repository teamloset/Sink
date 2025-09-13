interface Link {
  slug: string
  url: string
  comment?: string
  domain?: string
}

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
                domain: key.metadata.domain,
              })
            }
            else {
              const { metadata, value: link } = await KV.getWithMetadata(key.name, { type: 'json' })
              if (link) {
                list.push({
                  slug: key.name.replace(`link:${host}:`, ''),
                  url: link.url,
                  comment: link.comment,
                  domain: metadata?.domain || host,
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
