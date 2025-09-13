import { defu } from 'defu'
import { toast } from 'vue-sonner'
import { getAuthToken, removeAuthToken } from './auth'

export function useAPI(api: string, options?: object): Promise<unknown> {
  return $fetch(api, defu(options || {}, {
    headers: {
      Authorization: `Bearer ${getAuthToken() || ''}`,
    },
  })).catch((error) => {
    if (error?.status === 401) {
      removeAuthToken()
      navigateTo('/dashboard/login')
    }
    if (error?.data?.statusMessage) {
      toast(error?.data?.statusMessage)
    }
    return Promise.reject(error)
  })
}
