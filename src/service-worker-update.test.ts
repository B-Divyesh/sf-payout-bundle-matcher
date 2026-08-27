import { describe, expect, it, vi } from 'vitest'
import { activateWaitingWorker } from './service-worker-update'

describe('waiting service-worker updates', () => {
  it('messages the waiting worker and reloads only after it becomes controller', () => {
    const postMessage = vi.fn()
    const listeners = new Map<string, { listener: () => void; options?: AddEventListenerOptions | boolean }>()
    const serviceWorkers = {
      addEventListener: vi.fn((type: string, listener: () => void, options?: AddEventListenerOptions | boolean) => {
        listeners.set(type, { listener, options })
      })
    }
    const reload = vi.fn()
    const registration = { waiting: { postMessage } as unknown as ServiceWorker }

    expect(activateWaitingWorker(registration, serviceWorkers, reload)).toBe(true)
    expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })
    expect(reload).not.toHaveBeenCalled()
    expect(listeners.get('controllerchange')?.options).toEqual({ once: true })

    listeners.get('controllerchange')?.listener()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('does not claim an update when no worker is waiting', () => {
    const addEventListener = vi.fn()
    expect(activateWaitingWorker({ waiting: null }, { addEventListener }, vi.fn())).toBe(false)
    expect(addEventListener).not.toHaveBeenCalled()
  })
})
