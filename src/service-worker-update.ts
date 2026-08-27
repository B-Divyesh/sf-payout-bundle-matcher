/**
 * Ask the *waiting* service worker to activate and refresh only once it takes
 * control. Sending this to navigator.serviceWorker.controller would instead
 * message the old active worker and leave the update waiting forever.
 */
export function activateWaitingWorker(
  registration: Pick<ServiceWorkerRegistration, 'waiting'>,
  serviceWorkers: Pick<ServiceWorkerContainer, 'addEventListener'>,
  reload: () => void
): boolean {
  const waiting = registration.waiting
  if (!waiting) return false

  serviceWorkers.addEventListener('controllerchange', reload, { once: true })
  waiting.postMessage({ type: 'SKIP_WAITING' })
  return true
}
