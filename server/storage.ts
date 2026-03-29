import { type User, type InsertUser, type PlayerProfile } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Player profile (keyed by userId – ready for Replit Auth later)
  getPlayerProfile(userId: string): Promise<PlayerProfile | undefined>;
  upsertPlayerProfile(profile: PlayerProfile): Promise<PlayerProfile>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private playerProfiles: Map<string, PlayerProfile>;

  constructor() {
    this.users = new Map();
    this.playerProfiles = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getPlayerProfile(userId: string): Promise<PlayerProfile | undefined> {
    return this.playerProfiles.get(userId);
  }

  async upsertPlayerProfile(profile: PlayerProfile): Promise<PlayerProfile> {
    this.playerProfiles.set(profile.id, profile);
    return profile;
  }
}

export const storage = new MemStorage();
