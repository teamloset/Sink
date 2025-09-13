/**
 * Utilidades para autenticación cross-domain
 * Permite compartir el token de autenticación entre dominios
 */

// Lista de dominios configurados
const CONFIGURED_DOMAINS = ['link.goup.to', 'link.guerrero.pro']

/**
 * Obtiene el token de autenticación desde localStorage o cookies
 */
export function getAuthToken(): string | null {
  // Primero intentar desde localStorage (dominio actual)
  const localToken = localStorage.getItem('SinkSiteToken')
  if (localToken) {
    return localToken
  }

  // Si no hay token local, intentar sincronizar desde otros dominios
  return syncTokenFromOtherDomains()
}

/**
 * Guarda el token de autenticación en localStorage y cookies
 */
export function setAuthToken(token: string): void {
  // Guardar en localStorage del dominio actual
  localStorage.setItem('SinkSiteToken', token)
  
  // Guardar en cookies para compartir entre dominios
  setCookie('SinkSiteToken', token, {
    domain: '.goup.to', // Dominio padre para compartir
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 días
  })
}

/**
 * Elimina el token de autenticación
 */
export function removeAuthToken(): void {
  localStorage.removeItem('SinkSiteToken')
  deleteCookie('SinkSiteToken', { domain: '.goup.to' })
}

/**
 * Sincroniza el token desde otros dominios configurados
 */
function syncTokenFromOtherDomains(): string | null {
  // Intentar obtener desde cookies
  const cookieToken = getCookie('SinkSiteToken')
  if (cookieToken) {
    // Guardar en localStorage del dominio actual
    localStorage.setItem('SinkSiteToken', cookieToken)
    return cookieToken
  }

  return null
}

/**
 * Utilidades para manejar cookies
 */
function setCookie(name: string, value: string, options: any = {}): void {
  let cookieString = `${name}=${value}`
  
  if (options.domain) cookieString += `; domain=${options.domain}`
  if (options.path) cookieString += `; path=${options.path}`
  if (options.maxAge) cookieString += `; max-age=${options.maxAge}`
  if (options.secure) cookieString += `; secure`
  if (options.sameSite) cookieString += `; samesite=${options.sameSite}`
  
  document.cookie = cookieString
}

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }
  return null
}

function deleteCookie(name: string, options: any = {}): void {
  setCookie(name, '', {
    ...options,
    maxAge: -1
  })
}

/**
 * Verifica si el usuario está autenticado
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken()
}

/**
 * Sincroniza la autenticación al cargar la página
 */
export function initAuthSync(): void {
  // Sincronizar token al cargar
  syncTokenFromOtherDomains()
  
  // Escuchar cambios en localStorage (para sincronización entre pestañas)
  window.addEventListener('storage', (e) => {
    if (e.key === 'SinkSiteToken') {
      if (e.newValue) {
        setAuthToken(e.newValue)
      } else {
        removeAuthToken()
      }
    }
  })
}
