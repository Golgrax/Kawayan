# Kawayan AI - Payment Setup Guide (Legit)

This guide explains how to manage the manual payment system and how to transition to an automated gateway.

## 1. Manual GCash Verification (Current Setup)

Currently, the system is configured for **Manual Verification** to ensure security and prevent "fake" simulated credits.

### How it works:
1.  **User Side:** The user enters an amount and sees your GCash number (`09562734369`).
2.  **Submission:** When they click "OK", a transaction is created in the database with status `PENDING`. Their balance **does not** increase yet.
3.  **Admin Verification:** You (the admin) check your GCash app for the incoming transfer matching the Reference ID.
4.  **Approval:** You approve the transaction via the database or an admin API call, which then moves the status to `COMPLETED` and adds the balance.

### How to Approve a Transaction Manually:
You can use the built-in admin endpoint:
```bash
# Replace <JWT_TOKEN> with your admin token and <TXN_ID> with the txn_... id from the history
curl -X POST http://localhost:3001/api/admin/wallet/approve \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"transactionId": "txn_123456789"}'
```

---

## 2. Transitioning to Automated Payments (Xendit / PayMongo)

To remove the manual step and have balance credited instantly upon payment, follow these steps:

### Step A: Get API Keys
Sign up for [Xendit](https://www.xendit.co/) or [PayMongo](https://www.paymongo.com/) and get your **Secret Key**.

### Step B: Add to `.env`
```env
XENDIT_SECRET_KEY=xnd_development_...
PAYMENT_WEBHOOK_SECRET=your_webhook_signing_secret
```

### Step C: Update `paymentService.ts`
Replace the `initiateTopUp` logic to call the Xendit Invoice API instead of showing a static number.

### Step D: Implement Webhook
Create a new route `app.post('/api/webhooks/payments', ...)` in `server.js` that listens for Xendit's "Invoice Paid" event and calls `dbService.approveTransaction()` automatically.

---

## 3. Configuration Summary
- **Recipient Number:** Set in `.env` as `VITE_PAYMENT_RECIPIENT_NUMBER`.
- **Default Status:** All top-ups start as `PENDING`.
- **Subscription Cost:** Hardcoded as `499 PHP` in `Billing.tsx`.
