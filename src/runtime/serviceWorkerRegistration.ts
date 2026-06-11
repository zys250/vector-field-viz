import type { ServiceWorkerStatus } from '../store/useRuntimeStore'

interface RegisterOptions {
  onStatusChange: (status: ServiceWorkerStatus) => void
}

export function registerServiceWorker({ onStatusChange }: RegisterOptions) {
  if (!('serviceWorker' in navigator)) {
    onStatusChange('unsupported')
    return
  }

  const register = async () => {
    try {
      onStatusChange('installing')
      const scope = import.meta.env.BASE_URL
      const serviceWorkerUrl = new URL(`${scope}service-worker.js`, window.location.href)
      const registration = await navigator.serviceWorker.register(serviceWorkerUrl, { scope })

      if (registration.active) {
        onStatusChange('ready')
      }

      registration.addEventListener('updatefound', () => {
        const worker = registration.installing
        if (!worker) return

        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed') {
            onStatusChange(navigator.serviceWorker.controller ? 'updated' : 'ready')
          }
        })
      })

      await navigator.serviceWorker.ready
      onStatusChange('ready')
    } catch {
      onStatusChange('error')
    }
  }

  if (document.readyState === 'complete') {
    register()
  } else {
    window.addEventListener('load', register, { once: true })
  }
}
