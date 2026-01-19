export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  type: 'CREDIT' | 'DEBIT';
}

export interface Wallet {
  balance: number;
  currency: string;
  transactions: Transaction[];
  subscription: 'FREE' | 'PRO' | 'ENTERPRISE';
}

class PaymentService {
  private getAuthHeader() {
    const token = localStorage.getItem('kawayan_jwt');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  private getUserId() {
    const session = localStorage.getItem('kawayan_session');
    if (!session) return null;
    return JSON.parse(session).id;
  }

  // Get current state
  async getWalletData(): Promise<Wallet> {
    const userId = this.getUserId();
    if (!userId) throw new Error("Not authenticated");

    const response = await fetch(`/api/wallet/${userId}`, {
      headers: this.getAuthHeader()
    });
    
    if (!response.ok) throw new Error("Failed to fetch wallet");
    return response.json();
  }

  // Initiate Top-up (Returns info for manual payment or gateway)
  async initiateTopUp(amount: number, method: 'GCASH' | 'MAYA' | 'CARD'): Promise<{ checkoutUrl: string, referenceId: string, recipientNumber?: string }> {
    const userId = this.getUserId();
    if (!userId) throw new Error("Not authenticated");

    const referenceId = `txn_${Date.now()}`;
    const recipientNumber = (import.meta as any).env.VITE_PAYMENT_RECIPIENT_NUMBER || '09562734369';

    // For manual GCash/Maya, we return the recipient number
    // In a real automated setup, this would call Xendit API
    return {
      checkoutUrl: `https://checkout.xendit.co/web/${referenceId}`, 
      referenceId,
      recipientNumber
    };
  }

  // Confirm Payment (Used after manual verification or webhook)
  async confirmPayment(referenceId: string, amount: number): Promise<boolean> {
    const userId = this.getUserId();
    if (!userId) throw new Error("Not authenticated");

    const response = await fetch('/api/wallet/topup', {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify({
        userId,
        amount,
        description: `Wallet Top-up (${referenceId})`
      })
    });

    return response.ok;
  }

  async purchaseSubscription(plan: 'PRO' | 'ENTERPRISE', cost: number): Promise<boolean> {
    const userId = this.getUserId();
    if (!userId) throw new Error("Not authenticated");

    const response = await fetch('/api/wallet/purchase', {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify({
        userId,
        amount: cost,
        description: `Subscription Upgrade: ${plan}`,
        plan
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Purchase failed");
    }

    return true;
  }

  async cancelSubscription(): Promise<boolean> {
    const userId = this.getUserId();
    if (!userId) throw new Error("Not authenticated");

    const response = await fetch('/api/wallet/cancel', {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify({ userId })
    });

    return response.ok;
  }
}

export const paymentService = new PaymentService();
