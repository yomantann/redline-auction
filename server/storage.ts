import { type User, type UpsertUser } from "@shared/schema";

// Legacy in-memory storage stub — actual user persistence is handled by Replit Auth
// (server/replit_integrations/auth/storage.ts).
export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const user: User = {
      id: userData.id ?? crypto.randomUUID(),
      email: userData.email ?? null,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      createdAt: userData.createdAt ?? new Date(),
      updatedAt: userData.updatedAt ?? new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }
}

export const storage = new MemStorage();
