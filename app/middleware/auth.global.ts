import { getAuthToken, initAuthSync } from '~/utils/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server)
    return

  // Inicializar sincronización de autenticación
  initAuthSync()

  if (to.path.startsWith('/dashboard') && to.path !== '/dashboard/login') {
    if (!getAuthToken())
      return navigateTo('/dashboard/login')
  }

  if (to.path === '/dashboard/login') {
    try {
      await useAPI('/api/verify')
      return navigateTo('/dashboard')
    }
    catch (e) {
      console.warn(e)
    }
  }
})
