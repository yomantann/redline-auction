# Multiplayer Setup Guide

## Overview

The project now has Socket.IO infrastructure ready for real-time multiplayer functionality.

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
- ✅ Frontend UI unchanged

## Next Steps for Multiplayer

When ready to add game logic:

1. **Define Events** (server/routes.ts)
   ```typescript
   socket.on("join_lobby", (playerData) => { ... });
   socket.on("start_game", (gameSettings) => { ... });
   socket.on("player_bid", (bidData) => { ... });
   ```

2. **Rooms/Namespaces**
   ```typescript
   socket.join("game-room-123");
   io.to("game-room-123").emit("game_update", data);
   ```

3. **Client Integration**
   - Use `useSocket()` hook in game components
   - Emit player actions to server
   - Listen for game state updates
   - Handle reconnection logic

## Connection Status

Check connection state anywhere in the app:
```typescript
const { isConnected } = useSocket();
```

## Logs

- Server logs: Check workflow output for `[socket.io]` prefix
- Client logs: Open browser console for `[Socket.IO]` messages
