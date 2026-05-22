# Walkthrough: LLM API Integration & Extension Packaging

This document details the completed changes for Kawayan AI, including integration of the custom Unsloth LLM API, packaging the browser extension, and guidance on retrieving all necessary service APIs.

---

## 1. LLM API Integration

The LLM logic in [geminiService.ts](file:///workspaces/Kawayan/services/geminiService.ts) was updated to use your specific OpenAI-compatible Unsloth completions endpoint instead of Google Gemini.

### Key Changes
- **Function Replacement**: Replaced `callGeminiDirect` with a proxied `callUnslothLLM` call.
- **API Endpoint & Token**: Configured on the Express backend [server.js](file:///workspaces/Kawayan/server.js) at `/api/ai/unsloth` to resolve all browser CORS issues.
- **Frontend Calls**: Frontend [geminiService.ts](file:///workspaces/Kawayan/services/geminiService.ts) fetches `/api/ai/unsloth` directly, routing traffic through the node server which bypasses the Same Origin Policy.
- **AI Integration**: The integration maps to the Colab-hosted Unsloth LLM endpoint via the backend proxy, eliminating local Ollama dependencies.
- **Image Generation**: Left intact to use the existing `pollinations.ai` setup as requested.

---

## 2. Browser Extension ZIP

The browser extension files located in the [extension](file:///workspaces/Kawayan/extension) directory have been packaged into a `.zip` archive:

- **Extension ZIP File**: [extension.zip](file:///workspaces/Kawayan/extension.zip)
- **Artifact Copy**: A copy of the zip has been placed directly in your artifacts folder at [extension.zip](file:///home/codespace/.gemini/antigravity-cli/brain/e9b7354e-3efd-4938-b43f-d6a0f359cd41/extension.zip).

To install:
1. Open Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in the top-right).
3. Unzip `extension.zip` into a directory.
4. Click **Load unpacked** and select the unzipped directory.

---

## 3. Where to Get APIs

Below is the directory of all APIs used in this system and where you can acquire credentials for them:

| API / Service | Purpose | Configuration Variable | Where to Obtain / Console Link |
| :--- | :--- | :--- | :--- |
| **Unsloth LLM** | Core text, caption, and schedule generation. | `UNSLOTH_API_URL`, `UNSLOTH_API_KEY` (Defaults hardcoded in [geminiService.ts](file:///workspaces/Kawayan/services/geminiService.ts)) | Hosted on your Google Colab instance / GPU backend. |
| **Google Gemini (Original)** | Legacy LLM provider. | `GEMINI_API_KEY` | [Google AI Studio Console](https://aistudio.google.com/app/apikey) |
| **Xendit** | Payment gateway invoices and ledger updates. | `XENDIT_SECRET_KEY`, `XENDIT_WEBHOOK_VERIFICATION_TOKEN` | [Xendit Dashboard](https://dashboard.xendit.co/) |
| **Meta (Facebook/Instagram)** | Social Auth and API statistics connections. | `VITE_FACEBOOK_APP_ID`, `VITE_INSTAGRAM_APP_ID` | [Meta for Developers Portal](https://developers.facebook.com/) |
| **TikTok** | Social Auth and API statistics connections. | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` | [TikTok for Developers Portal](https://developers.tiktok.com/) |

---

## 4. Verification

Verification steps performed:
1. Run `npx tsc --noEmit --skipLibCheck`: **Passed successfully** (verified typescript compiler output).
2. Packaged extension directory structure validation: **Passed successfully**.
