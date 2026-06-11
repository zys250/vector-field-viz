import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { registerServiceWorker } from './runtime/serviceWorkerRegistration'
import { useRuntimeStore } from './store/useRuntimeStore'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (import.meta.env.PROD) {
  registerServiceWorker({
    onStatusChange: useRuntimeStore.getState().setServiceWorkerStatus,
  })
} else {
  useRuntimeStore.getState().setServiceWorkerStatus('disabled')
}
