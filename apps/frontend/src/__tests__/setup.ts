import { expect, afterEach, vi } from "vitest"
import { cleanup } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Node >= 25 defines an experimental global `localStorage` getter that returns
// undefined without --localstorage-file. Because of that, vitest's
// getWindowKeys skips jsdom's working localStorage when copying window keys
// to the test global, and any test touching localStorage crashes with
// "Cannot read properties of undefined". Restore jsdom's storage objects here
// (setupFiles run inside the environment, before any test file).
const jsdomInstance = (globalThis as { jsdom?: { window: Window } }).jsdom
if (jsdomInstance?.window?.localStorage) {
  const win = jsdomInstance.window
  for (const key of ["localStorage", "sessionStorage"] as const) {
    const descriptor = Object.getOwnPropertyDescriptor(win, key)
    if (descriptor) {
      delete (globalThis as Record<string, unknown>)[key]
      Object.defineProperty(globalThis, key, descriptor)
    }
  }
}

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
} as any
