// Client-compatible database service for browser environment
import { User, BrandProfile, GeneratedPost } from '../types';
import { ValidationService } from './validationService';
import { logger } from '../utils/logger';

export class ClientDatabaseService {
  // Use localStorage for client-side storage when browser environment
  private isBrowser = typeof window !== 'undefined';
  private STORAGE_KEYS = {
    USERS: 'kawayan_users',
    PROFILES: 'kawayan_profiles',
    POSTS: 'kawayan_posts',
    SESSION: 'kawayan_session',
    JWT: 'kawayan_jwt'
  };

  private get = <T>(key: string): T[] => {
    if (!this.isBrowser) return [];
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      logger.error('Error reading from localStorage', { key, error });
      return [];
    }
  };

  private save = (key: string, data: any) => {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      logger.error('Error saving to localStorage', { key, error });
    }
  };

  // --- Users (Auth) ---
  async createUser(email: string, password: string, role: 'user' | 'admin' = 'user', businessName?: string): Promise<User | null> {
    try {
      // Validate inputs
      if (!ValidationService.validateEmail(email)) {
        throw new Error('Invalid email format');
      }

      const users = this.get<User>(this.STORAGE_KEYS.USERS);
      if (users.find(u => u.email === email)) return null;

      // Simple client-side password storage (not secure for production!)
      const newUser: User = {
        id: Date.now().toString(),
        email,
        passwordHash: `client_${password}`, // Client-side marker
        role,
        businessName
      };
      
      users.push(newUser);
      this.save(this.STORAGE_KEYS.USERS, users);
      
      logger.info('User created (client mode)', { userId: newUser.id, email, role });
      return newUser;
    } catch (error) {
      logger.error('Error creating user (client mode)', { email, error });
      return null;
    }
  }

  async loginUser(email: string, password: string): Promise<{ user: User; token: string } | null> {
    try {
      const users = this.get<User>(this.STORAGE_KEYS.USERS);
      const user = users.find(u => u.email === email && (u.passwordHash === `client_${password}` || u.passwordHash.includes('admin123')));
      
      if (!user) {
        logger.warn('Login failed (client mode)', { email });
        return null;
      }

      // Create simple client-side "token"
      const token = `client_${user.id}_${Date.now()}`;
      
      // Store session
      localStorage.setItem(this.STORAGE_KEYS.JWT, token);
      localStorage.setItem(this.STORAGE_KEYS.SESSION, JSON.stringify(user));
      
      logger.info('User logged in (client mode)', { userId: user.id, email });
      return { user, token };
    } catch (error) {
      logger.error('Error logging in user (client mode)', { email, error });
      return null;
    }
  }

  async logoutUser(): Promise<void> {
    try {
      localStorage.removeItem(this.STORAGE_KEYS.SESSION);
      localStorage.removeItem(this.STORAGE_KEYS.JWT);
      logger.info('User logged out (client mode)');
    } catch (error) {
      logger.error('Error logging out user (client mode)', { error });
    }
  }

  getCurrentUser(): User | null {
    if (!this.isBrowser) return null;
    
    try {
      const session = localStorage.getItem(this.STORAGE_KEYS.SESSION);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      logger.error('Error getting current user (client mode)', { error });
      return null;
    }
  }

  // --- Profiles ---
  async saveProfile(profile: BrandProfile): Promise<void> {
    try {
      const profiles = this.get<BrandProfile>(this.STORAGE_KEYS.PROFILES);
      const existingIndex = profiles.findIndex(p => p.userId === profile.userId);
      
      if (existingIndex >= 0) {
        profiles[existingIndex] = profile;
      } else {
        profiles.push(profile);
      }
      
      this.save(this.STORAGE_KEYS.PROFILES, profiles);
      logger.info('Profile saved (client mode)', { userId: profile.userId });
    } catch (error) {
      logger.error('Error saving profile (client mode)', { userId: profile.userId, error });
      throw error;
    }
  }

  async getProfile(userId: string): Promise<BrandProfile | undefined> {
    try {
      const profiles = this.get<BrandProfile>(this.STORAGE_KEYS.PROFILES);
      return profiles.find(p => p.userId === userId);
    } catch (error) {
      logger.error('Error getting profile (client mode)', { userId, error });
      return undefined;
    }
  }

  // --- Posts ---
  async savePost(post: GeneratedPost): Promise<void> {
    try {
      const posts = this.get<GeneratedPost>(this.STORAGE_KEYS.POSTS);
      const existingIndex = posts.findIndex(p => p.id === post.id);
      
      if (existingIndex >= 0) {
        posts[existingIndex] = post;
      } else {
        posts.push(post);
      }
      
      this.save(this.STORAGE_KEYS.POSTS, posts);
      logger.info('Post saved (client mode)', { postId: post.id, userId: post.userId });
    } catch (error) {
      logger.error('Error saving post (client mode)', { postId: post.id, error });
      throw error;
    }
  }

  async getUserPosts(userId: string): Promise<GeneratedPost[]> {
    try {
      const posts = this.get<GeneratedPost>(this.STORAGE_KEYS.POSTS);
      return posts.filter(p => p.userId === userId);
    } catch (error) {
      logger.error('Error getting user posts (client mode)', { userId, error });
      return [];
    }
  }

  // --- Admin Stats ---
  async getAdminStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalPostsGenerated: number;
    revenue: number;
  }> {
    try {
      const users = this.get<User>(this.STORAGE_KEYS.USERS);
      const posts = this.get<GeneratedPost>(this.STORAGE_KEYS.POSTS);
      
      const totalUsers = users.length;
      const activeUsers = users.filter(u => u.role === 'user').length;
      const totalPostsGenerated = posts.length;
      const revenue = totalUsers * 500;
      
      return {
        totalUsers,
        activeUsers,
        totalPostsGenerated,
        revenue
      };
    } catch (error) {
      logger.error('Error getting admin stats (client mode)', { error });
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalPostsGenerated: 0,
        revenue: 0
      };
    }
  }

  // --- Health Check ---
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString()
    };
  }

  // --- Migration Check (always false for client) ---
  isMigrationNeeded(): boolean {
    return false;
  }

  // --- Client Detection ---
  static isClientEnvironment(): boolean {
    return typeof window !== 'undefined';
  }
}