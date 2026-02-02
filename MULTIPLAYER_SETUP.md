# Multiplayer Setup Guide

## Overview

The project has a complete Socket.IO lobby system for real-time multiplayer functionality.

## Architecture

### Server (`server/routes.ts`)

```typescript
import { io } from "./routes"; // Socket.IO instance exported for use

// The io instance is ready to add event handlers:
io.on("connection", (socket) => {
  // Handle custom events here
  socket.on("your_event", (data) => {
    // Process game logic
    // Emit responses back to clients
  });
});
```

### Client (`client/src/lib/socket.tsx`)

```typescript
import { useSocket } from "@/lib/socket";

function YourComponent() {
  const { socket, isConnected } = useSocket();
  
  useEffect(() => {
    if (!socket) return;
    
    // Listen for events from server
    socket.on("server_event", (data) => {
      console.log("Received from server:", data);
    });
    
    // Send events to server
    socket.emit("client_event", { your: "data" });
    
    // Cleanup
    return () => {
      socket.off("server_event");
    };
  }, [socket]);
}
```

## Current State

- ✅ Socket.IO server initialized
- ✅ Client auto-connects on app load
- ✅ Connection/disconnection logging active
- ✅ Socket instance exported for expansion
- ✅ Lobby system fully implemented

## Lobby System

### Server Events (server/routes.ts)

| Event | Description | Payload |
|-------|-------------|---------|
| `create_lobby` | Create a new lobby | `{ playerName: string }` |
| `join_lobby` | Join existing lobby | `{ code: string, playerName: string }` |
| `leave_lobby` | Leave current lobby | none |
| `toggle_ready` | Toggle ready status | none |
| `lobby_update` | Server broadcasts updates | Lobby state object |

### Client Integration (Game.tsx)

The multiplayer lobby phase handles:
- Creating a lobby (generates 4-char code)
- Joining by code
- Displaying players list in real-time
- Ready/not ready toggle
- Host controls (start game when all ready)
- Leave lobby functionality

### Data Structures

```typescript
interface LobbyPlayer {
  id: string;
  socketId: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
}

interface Lobby {
  code: string;
  hostSocketId: string;
  players: LobbyPlayer[];
  maxPlayers: number; // default 8
  status: 'waiting' | 'starting' | 'in_game';
}
```

## Next Steps for Game Sync

When ready to sync actual gameplay:

1. **Game State Events**
   ```typescript
   socket.on("start_game", (gameSettings) => { ... });
   socket.on("player_bid", (bidData) => { ... });
   socket.on("round_end", (results) => { ... });
   ```

2. **Broadcast to Lobby**
   ```typescript
   io.to(lobbyCode).emit("game_update", gameState);
   ```

## Connection Status

Check connection state anywhere in the app:
```typescript
const { socket, isConnected } = useSocket();
```

## Logs

- Server logs: Check workflow output for `[socket.io]` and `[lobby]` prefixes
- Client logs: Open browser console for `[Socket.IO]` and `[Lobby]` messages
