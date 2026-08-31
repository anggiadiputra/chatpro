import { Server as SocketIOServer } from 'socket.io'
import type { Server as HTTPServer } from 'node:http'
import type { AuthenticatedSocket, WebSocketServerConfig } from './types.js'
import { authMiddleware } from './middleware/auth.js'
import { connectionManager } from './connection-manager.js'

let io: SocketIOServer | null = null

/**
 * Initialize WebSocket server with the HTTP server
 */
export function initializeWebSocket(httpServer: HTTPServer): SocketIOServer {
  // Get allowed origins from environment
  const corsOriginsEnv = process.env.CORS_ALLOWED_ORIGINS
  const frontendUrlEnv = process.env.FRONTEND_URL
  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3005',
    'https://app.prochat.work',
    'https://dash.prochat.work',
    'https://prochat.work',
    'https://www.prochat.work',
    'https://api.prochat.work',
    'https://kirim.chat',
    'https://api.kirim.chat'
  ]
  const envOrigins = [
    ...(corsOriginsEnv ? corsOriginsEnv.split(',').map(o => o.trim()) : []),
    ...(frontendUrlEnv ? [frontendUrlEnv.trim()] : [])
  ]
  const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins])).filter(Boolean)

  const config: WebSocketServerConfig = {
    cors: {
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin) return callback(null, true)
        if (allowedOrigins.includes(origin)) return callback(null, true)
        try {
          const url = new URL(origin)
          if (
            url.hostname === 'prochat.work' ||
            url.hostname.endsWith('.prochat.work') ||
            url.hostname === 'kirim.chat' ||
            url.hostname.endsWith('.kirim.chat') ||
            url.hostname === 'localhost' ||
            url.hostname === '127.0.0.1'
          ) {
            return callback(null, true)
          }
        } catch {}
        if (process.env.NODE_ENV !== 'production') return callback(null, true)
        callback(new Error('Not allowed by CORS'))
      },
      credentials: true
    },
    pingTimeout: Number(process.env.WEBSOCKET_PING_TIMEOUT) || 10000,
    pingInterval: Number(process.env.WEBSOCKET_PING_INTERVAL) || 30000
  }

  io = new SocketIOServer(httpServer, {
    cors: config.cors,
    pingTimeout: config.pingTimeout,
    pingInterval: config.pingInterval,
    transports: ['websocket', 'polling'],
    allowUpgrades: true
  })

  // Apply authentication middleware
  io.use(authMiddleware)

  // Handle connections
  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId
    const socketId = socket.id

    console.log(`[WebSocket] User ${userId} connected (socket: ${socketId})`)

    // Add connection to manager
    connectionManager.addConnection(userId, socketId, socket.userAgent)

    // Join user-specific room for targeted broadcasts
    socket.join(`user:${userId}`)

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`[WebSocket] User ${userId} disconnected (reason: ${reason})`)
      connectionManager.removeConnection(socketId)
    })

    // Handle errors
    socket.on('error', (error) => {
      console.error(`[WebSocket] Socket error for user ${userId}:`, error)
    })
  })

  console.log('✅ WebSocket server initialized')
  return io
}

/**
 * Get the Socket.IO server instance
 */
export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('WebSocket server not initialized. Call initializeWebSocket first.')
  }
  return io
}

/**
 * Check if WebSocket server is initialized
 */
export function isWebSocketInitialized(): boolean {
  return io !== null
}
