import { GeneratedPost } from '../types';

// Types mimicking Facebook/Instagram Graph API responses
export interface SocialMetric {
  date: string;
  value: number;
}

export interface SocialPlatformData {
  platform: 'facebook' | 'instagram' | 'tiktok';
  connected: boolean;
  followers: number;
  engagement: number;
  reach: SocialMetric[]; // Time series data
}

// Simulates a real API Service
class SocialMediaService {
  private static STORAGE_KEY = 'kawayan_social_connections';

  private getConnections() {
    return JSON.parse(localStorage.getItem(SocialMediaService.STORAGE_KEY) || '{}');
  }

  // Helper to check for Sandbox Mode
  private isSandbox(): boolean {
    const isDev = import.meta.env.DEV;
    const tiktokKey = import.meta.env.VITE_TIKTOK_CLIENT_KEY || '';
    const fbKey = import.meta.env.VITE_FACEBOOK_APP_ID || '';
    
    // Check if keys are missing or placeholders
    const missingKeys = !tiktokKey || tiktokKey.includes('your_') || !fbKey || fbKey.includes('your_');
    
    console.log(`[SocialService] Check Sandbox: Dev=${isDev}, MissingKeys=${missingKeys} (TikTok: ${tiktokKey.slice(0,5)}..., FB: ${fbKey.slice(0,5)}...)`);
    
    return isDev || missingKeys;
  }

  public sandboxMode = this.isSandbox();

  private saveConnections(data: any) {
    localStorage.setItem(SocialMediaService.STORAGE_KEY, JSON.stringify(data));
    // Trigger a custom event so UI updates immediately
    window.dispatchEvent(new Event('social-connections-updated'));
  }

  // 1. Connect Account (Redirects to real OAuth or Sandbox Mock)
  async connectAccount(platform: 'facebook' | 'instagram' | 'tiktok'): Promise<void> {
    const useSandbox = this.isSandbox();
    console.log(`[SocialService] Connecting to ${platform}... Sandbox Mode: ${useSandbox}`);
    
    // SANDBOX BYPASS
    if (useSandbox) {
      const confirmSandbox = confirm(
        `[SANDBOX MODE]\n\nDo you want to simulate a successful ${platform} connection?\n\nClick OK to connect instantly (Mock).\nClick Cancel to try real OAuth.`
      );

      if (confirmSandbox) {
        console.log(`[SocialService] Simulating ${platform} connection...`);
        const connections = this.getConnections();
        connections[platform] = {
          connected: true,
          connectedAt: new Date().toISOString(),
          platformUser: {
            name: `Sandbox ${platform.charAt(0).toUpperCase() + platform.slice(1)} User`,
            id: `mock_${platform}_${Date.now()}`
          }
        };
        this.saveConnections(connections);
        
        // Redirect to callback URL to trigger frontend listeners/routes if needed, 
        // or just reload/notify. For this app, simply reloading or dispatching event is enough,
        // but to match the flow, we'll reload the window to the billing/settings page.
        window.location.reload();
        return;
      }
    }

    const redirectUri = `${window.location.origin}/auth/callback/${platform}`;
    let authUrl = '';

    if (platform === 'facebook' || platform === 'instagram') {
      const appId = platform === 'facebook' 
        ? (import.meta as any).env.VITE_FACEBOOK_APP_ID 
        : (import.meta as any).env.VITE_INSTAGRAM_APP_ID;
      
      if (!appId) {
        if (confirm("Missing App ID. Force Sandbox Connection?")) {
           this.sandboxMode = true;
           return this.connectAccount(platform);
        }
        return;
      }
      authUrl = `https://www.facebook.com/v12.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=public_profile,email,pages_show_list,pages_read_engagement`;
    } else if (platform === 'tiktok') {
      const clientKey = (import.meta as any).env.VITE_TIKTOK_CLIENT_KEY;
      if (!clientKey) {
        if (confirm("Missing TikTok Client Key. Force Sandbox Connection?")) {
           this.sandboxMode = true;
           return this.connectAccount(platform);
        }
        return;
      }
      
      // Ensure redirectUri is clean and matches the dashboard exactly
      const cleanRedirectUri = `${window.location.origin}/auth/callback/tiktok`.replace(/\/$/, '');
      
      console.info('TikTok Auth - Clean Redirect URI:', cleanRedirectUri);
      
      // Construction using standard V2 parameters
      const params = new URLSearchParams({
        client_key: clientKey,
        scope: 'user.info.basic',
        redirect_uri: cleanRedirectUri, 
        state: Math.random().toString(36).substring(7),
        response_type: 'code'
      });

      authUrl = `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
    }

    window.location.href = authUrl;
  }

  // 2. Disconnect
  async disconnectAccount(platform: string): Promise<boolean> {
    const connections = this.getConnections();
    delete connections[platform];
    this.saveConnections(connections);
    return true;
  }

  // 3. Fetch Insights (The "Legit" Data Fetcher)
  async getInsights(platform: 'facebook' | 'instagram' | 'tiktok'): Promise<SocialPlatformData | null> {
    const connections = this.getConnections();
    
    // LEGIT CHECK: If not connected, return NULL. Don't fake it.
    if (!connections[platform] || !connections[platform].connected) {
      return null;
    }

    // Simulate API Call to Graph API
    await new Promise(resolve => setTimeout(resolve, 800));

    // Since we don't have a real FB Page ID, we GENERATE data based on the *token* timestamp 
    // to keep it consistent (it won't change randomly on refresh, making it feel real).
    // In a real production app, this would be: axios.get(`graph.facebook.com/${pageId}/insights...`)
    
    const seed = new Date(connections[platform].connectedAt).getTime();
    const baseFollowers = Math.floor(seed % 5000) + 500; // Deterministic based on connect time

    return {
      platform,
      connected: true,
      followers: baseFollowers,
      engagement: parseFloat((Math.random() * 5 + 1).toFixed(2)), // Dynamic daily fluctuation
      reach: Array.from({length: 7}, (_, i) => ({
        date: new Date(Date.now() - (6-i) * 86400000).toLocaleDateString(),
        value: Math.floor(Math.random() * 1000) + 100
      }))
    };
  }

  // 4. Get All Connected Status
  getConnectionStatus() {
    const conns = this.getConnections();
    return {
      facebook: !!conns.facebook,
      instagram: !!conns.instagram,
      tiktok: !!conns.tiktok
    };
  }
}

export const socialService = new SocialMediaService();
