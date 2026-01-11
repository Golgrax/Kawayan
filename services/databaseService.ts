import { DatabaseConfig } from '../config/database';
import { User, BrandProfile, GeneratedPost } from '../types';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';
import { JWTService } from './jwtService';

export class DatabaseService {
  private dbConfig: DatabaseConfig;
  
  constructor() {
    this.dbConfig = new DatabaseConfig();
    this.initializeDefaultAdmin();
  }
  
  // --- Users (Auth) ---
  async createUser(email: string, password: string, role: 'user' | 'admin' = 'user', businessName?: string): Promise<User | null> {
    const db = this.dbConfig.getDatabase();
    
    try {
      // Check if user already exists
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existingUser) return null;
      
      // Validate password strength
      const passwordValidation = JWTService.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        throw new Error(`Password requirements: ${passwordValidation.errors.join(', ')}`);
      }
      
      // Hash password with JWT service
      const passwordHash = await JWTService.hashPassword(password);
      
      const newUser: User = {
        id: Date.now().toString(),
        email,
        passwordHash,
        role,
        businessName
      };
      
      db.prepare(`
        INSERT INTO users (id, email, password_hash, role, business_name)
        VALUES (?, ?, ?, ?, ?)
      `).run(newUser.id, newUser.email, newUser.passwordHash, newUser.role, newUser.businessName || null);
      
      logger.info('User created successfully', { userId: newUser.id, email, role });
      return newUser;
    } catch (error) {
      logger.logDatabaseError('createUser', error, email);
      return null;
    }
  }
  
async loginUser(email: string, password: string): Promise<{ user: User; token: string } | null> {
    const db = this.dbConfig.getDatabase();
    
    try {
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User;
      
      if (!user) return null;
      
      // Verify password with JWT service
      const isValidPassword = await JWTService.verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        logger.logAuthAttempt(email, false);
        return null;
      }
      
      // Create JWT session
      const token = await this.createSession(user.id);
      
      logger.logAuthAttempt(email, true, user.id);
      return { user, token };
    } catch (error) {
      logger.logDatabaseError('loginUser', error, email);
      return null;
    }
  }

  
  async logoutUser(): Promise<void> {
    const db = this.dbConfig.getDatabase();
    
    try {
      // Delete current session (simplified - in production you'd use session token)
      if (typeof window !== 'undefined') {
        const sessionData = localStorage.getItem('kawayan_session');
        if (sessionData) {
          const user = JSON.parse(sessionData) as User;
          db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
        }
      }
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('kawayan_session');
      }
    } catch (error) {
      console.error('Error logging out user:', error);
    }
  }
  
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const session = localStorage.getItem('kawayan_session');
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
  
  private async createSession(userId: string): Promise<string> {
    const db = this.dbConfig.getDatabase();
    
    try {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User;
      
      // Generate JWT token
      const jwtToken = JWTService.generateToken(user);
      
      // Store session in database for tracking
      const sessionId = Date.now().toString();
      const tokenHash = await bcrypt.hash(jwtToken, 10);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour session
      
      db.prepare(`
        INSERT INTO sessions (id, user_id, token, expires_at)
        VALUES (?, ?, ?, ?)
      `).run(sessionId, userId, tokenHash, expiresAt.toISOString());
      
      // Store JWT in localStorage for client-side access
      if (typeof window !== 'undefined') {
        localStorage.setItem('kawayan_jwt', jwtToken);
        localStorage.setItem('kawayan_session', JSON.stringify(user));
      }
      
      return jwtToken;
    } catch (error) {
      logger.error('Error creating session', { userId, error });
      throw error;
    }
  }
  
  // --- Profiles ---
  async saveProfile(profile: BrandProfile): Promise<void> {
    const db = this.dbConfig.getDatabase();
    
    try {
      const existingProfile = db.prepare('SELECT id FROM brand_profiles WHERE user_id = ?').get(profile.userId);
      
      if (existingProfile) {
        // Update existing profile
        db.prepare(`
          UPDATE brand_profiles 
          SET business_name = ?, industry = ?, target_audience = ?, brand_voice = ?, key_themes = ?
          WHERE user_id = ?
        `).run(
          profile.businessName,
          profile.industry,
          profile.targetAudience,
          profile.brandVoice,
          profile.keyThemes,
          profile.userId
        );
      } else {
        // Insert new profile
        db.prepare(`
          INSERT INTO brand_profiles (id, user_id, business_name, industry, target_audience, brand_voice, key_themes)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          profile.id || Date.now().toString(),
          profile.userId,
          profile.businessName,
          profile.industry,
          profile.targetAudience,
          profile.brandVoice,
          profile.keyThemes
        );
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  }
  
  async getProfile(userId: string): Promise<BrandProfile | undefined> {
    const db = this.dbConfig.getDatabase();
    
    try {
      const profile = db.prepare('SELECT * FROM brand_profiles WHERE user_id = ?').get(userId) as BrandProfile;
      return profile;
    } catch (error) {
      console.error('Error getting profile:', error);
      return undefined;
    }
  }
  
  // --- Posts ---
  async savePost(post: GeneratedPost): Promise<void> {
    const db = this.dbConfig.getDatabase();
    
    try {
      const existingPost = db.prepare('SELECT id FROM generated_posts WHERE id = ?').get(post.id);
      
      if (existingPost) {
        // Update existing post
        db.prepare(`
          UPDATE generated_posts 
          SET date = ?, topic = ?, caption = ?, image_prompt = ?, image_url = ?, 
              status = ?, virality_score = ?, virality_reason = ?, format = ?
          WHERE id = ?
        `).run(
          post.date,
          post.topic,
          post.caption,
          post.imagePrompt,
          post.imageUrl || null,
          post.status,
          post.viralityScore || null,
          post.viralityReason || null,
          post.format || null,
          post.id
        );
      } else {
        // Insert new post
        db.prepare(`
          INSERT INTO generated_posts (id, user_id, date, topic, caption, image_prompt, image_url, status, virality_score, virality_reason, format)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          post.id,
          post.userId,
          post.date,
          post.topic,
          post.caption,
          post.imagePrompt,
          post.imageUrl || null,
          post.status,
          post.viralityScore || null,
          post.viralityReason || null,
          post.format || null
        );
      }
    } catch (error) {
      console.error('Error saving post:', error);
      throw error;
    }
  }
  
  async getUserPosts(userId: string): Promise<GeneratedPost[]> {
    const db = this.dbConfig.getDatabase();
    
    try {
      const posts = db.prepare('SELECT * FROM generated_posts WHERE user_id = ? ORDER BY date DESC').all(userId) as GeneratedPost[];
      return posts;
    } catch (error) {
      console.error('Error getting user posts:', error);
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
    const db = this.dbConfig.getDatabase();
    
    try {
      const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
      const activeUsers = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'").get() as { count: number }).count;
      const totalPostsGenerated = (db.prepare('SELECT COUNT(*) as count FROM generated_posts').get() as { count: number }).count;
      const revenue = totalUsers * 500; // Mock revenue: 500 PHP per user
      
      return {
        totalUsers,
        activeUsers,
        totalPostsGenerated,
        revenue
      };
    } catch (error) {
      console.error('Error getting admin stats:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalPostsGenerated: 0,
        revenue: 0
      };
    }
  }
  
  // --- Helper Methods ---
  private async initializeDefaultAdmin(): Promise<void> {
    const db = this.dbConfig.getDatabase();
    
    try {
      // Check if admin user exists
      const existingAdmin = db.prepare("SELECT id FROM users WHERE email = 'admin@kawayan.ph'").get();
      
      if (!existingAdmin) {
        // Create default admin user
        const adminId = Date.now().toString();
        const passwordHash = await bcrypt.hash('admin123', 10);
        
        db.prepare(`
          INSERT INTO users (id, email, password_hash, role, business_name)
          VALUES (?, ?, ?, ?, ?)
        `).run(adminId, 'admin@kawayan.ph', passwordHash, 'admin', 'Kawayan Admin');
        
        console.log('Default admin user created');
      }
    } catch (error) {
      console.error('Error initializing default admin:', error);
    }
  }
  
  // --- Database Management ---
  async close(): Promise<void> {
    this.dbConfig.close();
  }
  
  // Transaction helper
  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    return this.dbConfig.transaction(async () => {
      return await fn();
    });
  }
  
  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const db = this.dbConfig.getDatabase();
    
    try {
      const result = db.prepare('SELECT 1 as test').get();
      return {
        status: result ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      };
    }
  }
}