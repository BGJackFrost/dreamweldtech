import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { parse } from 'url';
import { IncomingMessage } from 'http';

interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping' | 'notification';
  userId?: number;
  data?: any;
}

interface AuthenticatedWebSocket extends WebSocket {
  userId?: number;
  isAlive?: boolean;
}

let wss: WebSocketServer | null = null;
const connectedClients = new Map<number, Set<AuthenticatedWebSocket>>();

export function setupWebSocket(server: Server) {
  wss = new WebSocketServer({ 
    server,
    path: '/api/ws/notifications',
  });

  wss.on('connection', (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
    console.log('[WebSocket] Client connected');
    
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'subscribe':
            if (message.userId) {
              ws.userId = message.userId;
              if (!connectedClients.has(message.userId)) {
                connectedClients.set(message.userId, new Set());
              }
              connectedClients.get(message.userId)?.add(ws);
              console.log(`[WebSocket] User ${message.userId} subscribed`);
              
              // Send confirmation
              ws.send(JSON.stringify({
                type: 'subscribed',
                userId: message.userId,
              }));
            }
            break;

          case 'unsubscribe':
            if (ws.userId) {
              connectedClients.get(ws.userId)?.delete(ws);
              console.log(`[WebSocket] User ${ws.userId} unsubscribed`);
            }
            break;

          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;

          default:
            console.warn(`[WebSocket] Unknown message type: ${message.type}`);
        }
      } catch (error) {
        console.error('[WebSocket] Error processing message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
        }));
      }
    });

    ws.on('close', () => {
      if (ws.userId) {
        connectedClients.get(ws.userId)?.delete(ws);
        console.log(`[WebSocket] User ${ws.userId} disconnected`);
      }
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
    });
  });

  // Heartbeat to detect dead connections
  const heartbeat = setInterval(() => {
    wss?.clients.forEach((ws: AuthenticatedWebSocket) => {
      if (ws.isAlive === false) {
        ws.terminate();
        return;
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000); // Every 30 seconds

  wss.on('close', () => {
    clearInterval(heartbeat);
  });

  return wss;
}

export function broadcastNotification(notification: {
  type: string;
  title: string;
  message: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  data?: any;
}) {
  if (!wss) return;

  wss.clients.forEach((client: AuthenticatedWebSocket) => {
    if (client.readyState === WebSocket.OPEN && client.userId) {
      client.send(JSON.stringify({
        ...notification,
        timestamp: new Date().toISOString(),
      }));
    }
  });
}

export function broadcastToUser(userId: number, notification: any) {
  const clients = connectedClients.get(userId);
  if (!clients) return;

  clients.forEach((client: AuthenticatedWebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        ...notification,
        timestamp: new Date().toISOString(),
      }));
    }
  });
}

export function getConnectedUsers(): number[] {
  return Array.from(connectedClients.keys());
}

export function getConnectedClientsCount(): number {
  return wss?.clients.size || 0;
}
