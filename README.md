# Kawayan AI - Philippine SME Content Manager

Kawayan AI is an intelligent social media content generation platform tailored specifically for Philippine MSMEs (Micro, Small, and Medium Enterprises). It uses Google's Gemini 2.5 Flash to generate culturally resonant "Taglish" content, images, and schedules.

## Features

- **Taglish Content Generation:** Creates captions that sound natural to Filipinos (combining English and Tagalog).
- **Virality Scoring:** AI analyzes drafted content and predicts how "patok" (viral) it will be.
- **Smart Scheduling:** Generates monthly content plans based on industry and brand voice.
- **Image Generation:** Creates high-quality visual prompts and images using Gemini 2.5 Flash Image.
- **Admin Dashboard:** Tracks MRR, Churn, and User growth.

## Development

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Set Environment Variable:**
    Create a `.env` file (or set in your shell) with your Google Gemini API Key:
    ```bash
    export API_KEY="your_google_api_key_here"
    ```

3.  **Run Locally:**
    ```bash
    npm run dev
    ```

## 🚀 How to Deploy on Render (Free Tier)

This application can be deployed as a **Static Site** on Render.

1.  **Push to GitHub:**
    Ensure your code is pushed to a public or private GitHub repository.

2.  **Create Service on Render:**
    *   Go to [dashboard.render.com](https://dashboard.render.com/).
    *   Click **New +** and select **Static Site**.
    *   Connect your GitHub repository.

3.  **Configure Build Settings:**
    *   **Name:** `kawayan-ai` (or your choice)
    *   **Branch:** `main` (or `master`)
    *   **Build Command:** `npm install && npm run build`
    *   **Publish Directory:** `dist`

4.  **Add API Key (CRITICAL):**
    *   Scroll down to the **Environment Variables** section.
    *   Click **Add Environment Variable**.
    *   **Key:** `API_KEY`
    *   **Value:** Paste your Google Gemini API Key here.
    *   *Note: Since this is a client-side React app, the key will be embedded in the build. For a production enterprise app, you would use a proxy server, but for this demo/hackathon tier, this method works.*

5.  **Deploy:**
    *   Click **Create Static Site**.
    *   Wait for the build to finish. Render will provide you with a `.onrender.com` URL.

## Technologies

*   React + TypeScript
*   Google GenAI SDK (Gemini 2.5 Flash)
*   Tailwind CSS
*   Recharts
*   Lucide Icons
