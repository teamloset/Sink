/**
 * Script de migración para convertir enlaces existentes a formato específico por dominio
 * 
 * Uso:
 * 1. Configura las variables de entorno
 * 2. Ejecuta: node scripts/migrate-to-domain-specific.js
 */

// Configuración
const NAMESPACE_ID = '5ed696e58a6a490483ffcdd60fc19af8' // Tu namespace ID
const DOMAINS = ['link.goup.to', 'link.guerrero.pro'] // Dominios que quieres migrar

async function migrateExistingLinks() {
  console.log('🚀 Iniciando migración de enlaces a formato específico por dominio...')
  
  try {
    // Listar todos los enlaces existentes
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/${NAMESPACE_ID}/keys`, {
      headers: {
        'Authorization': `Bearer ${process.env.CF_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(`Error al obtener enlaces: ${data.errors?.[0]?.message}`)
    }
    
    const keys = data.result.filter(key => key.name.startsWith('link:') && !key.name.includes(':'))
    console.log(`📋 Encontrados ${keys.length} enlaces para migrar`)
    
    let migrated = 0
    let errors = 0
    
    for (const key of keys) {
      try {
        // Obtener el enlace original
        const linkResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/${NAMESPACE_ID}/values/${encodeURIComponent(key.name)}`, {
          headers: {
            'Authorization': `Bearer ${process.env.CF_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        })
        
        const linkData = await linkResponse.json()
        
        if (!linkData.success) {
          console.error(`❌ Error al obtener enlace ${key.name}:`, linkData.errors?.[0]?.message)
          errors++
          continue
        }
        
        const link = JSON.parse(linkData.result)
        const slug = key.name.replace('link:', '')
        
        // Crear copias para cada dominio
        for (const domain of DOMAINS) {
          const newKey = `link:${domain}:${slug}`
          
          const putResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/${NAMESPACE_ID}/values/${encodeURIComponent(newKey)}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${process.env.CF_API_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(link)
          })
          
          const putData = await putResponse.json()
          
          if (putData.success) {
            console.log(`✅ Migrado: ${slug} → ${domain}`)
            migrated++
          } else {
            console.error(`❌ Error al migrar ${slug} para ${domain}:`, putData.errors?.[0]?.message)
            errors++
          }
        }
        
        // Opcional: eliminar el enlace original después de la migración
        // const deleteResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/${NAMESPACE_ID}/values/${encodeURIComponent(key.name)}`, {
        //   method: 'DELETE',
        //   headers: {
        //     'Authorization': `Bearer ${process.env.CF_API_TOKEN}`
        //   }
        // })
        
      } catch (error) {
        console.error(`❌ Error procesando ${key.name}:`, error.message)
        errors++
      }
    }
    
    console.log(`\n🎉 Migración completada:`)
    console.log(`✅ Enlaces migrados: ${migrated}`)
    console.log(`❌ Errores: ${errors}`)
    console.log(`📊 Total procesados: ${keys.length}`)
    
  } catch (error) {
    console.error('💥 Error durante la migración:', error.message)
    process.exit(1)
  }
}

// Verificar variables de entorno
if (!process.env.CF_ACCOUNT_ID || !process.env.CF_API_TOKEN) {
  console.error('❌ Error: Configura las variables de entorno CF_ACCOUNT_ID y CF_API_TOKEN')
  console.log('Ejemplo:')
  console.log('export CF_ACCOUNT_ID="tu_account_id"')
  console.log('export CF_API_TOKEN="tu_api_token"')
  process.exit(1)
}

// Ejecutar migración
migrateExistingLinks()
