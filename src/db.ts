import type { AppState } from './types'

const DATABASE = 'settlement-match'
const STORE = 'workspace'
const KEY = 'current'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function loadState(): Promise<AppState | undefined> {
  const db = await openDb()
  return new Promise<AppState | undefined>((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).get(KEY)
    request.onsuccess = () => resolve(request.result as AppState | undefined)
    request.onerror = () => reject(request.error)
  }).finally(() => db.close())
}

export async function saveState(state: AppState): Promise<void> {
  const db = await openDb()
  return new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE, 'readwrite').objectStore(STORE).put(state, KEY)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  }).finally(() => db.close())
}

export async function clearState(): Promise<void> {
  const db = await openDb()
  return new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE, 'readwrite').objectStore(STORE).clear()
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  }).finally(() => db.close())
}
