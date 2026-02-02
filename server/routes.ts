import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { log } from "./index";

// Socket.IO instance - exported for later expansion
export let io: SocketIOServer;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Initialize Socket.IO
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "production" 
        ? false 
        : ["http://localhost:5000", "http://0.0.0.0:5000"],
      credentials: true
    }
  });

  // Socket.IO connection handling
  io.on("connection", (socket) => {
    log(`Client connected: ${socket.id}`, "socket.io");

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      log(`Client disconnected: ${socket.id} (reason: ${reason})`, "socket.io");
    });

    // Placeholder for future game logic events
    // socket.on("join_game", (data) => { ... });
    // socket.on("player_action", (data) => { ... });
  });

  log("Socket.IO initialized and ready for connections", "socket.io");

  // API routes will go here
  // prefix all routes with /api
  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  return httpServer;
}
