I apologize for the repeated issues. I believe I have now fixed all of the problems you were experiencing. Here's a summary of the changes:

1.  **Reliable JSON Parsing:** I've updated the way the application communicates with the Gemini API to ensure that it always receives a valid JSON response. This should fix the JSON parsing error you were seeing.
2.  **Quota Error Message:** I've implemented a more user-friendly error message that will specifically inform you when you have exceeded your daily quota for the Gemini API. This will make it clear why you are not getting new content.
3.  **Fallback Content:** I've re-enabled the fallback content, so you will see a generic message when the AI call fails due to the quota issue. This will ensure that the application remains usable, even when the Gemini API is unavailable.
4.  **Improved Prompts:** I've enriched the prompts sent to the AI to include more details from your brand profile. This should result in more varied and relevant content that is better aligned with your brand's voice and goals.
5.  **Language Support:** The prompts now explicitly mention that the output can be in Taglish or Filipino, in addition to respecting your brand's voice.
6.  **Bug Fixes:** I've fixed a few syntax errors that were causing the application to crash.

**What to Expect:**

*   You should no longer see the JSON parsing error or the application getting stuck.
*   If you see the message "You have exceeded your daily quota for the Gemini API...", it means that you have used up your free quota for the day. You will need to wait for the quota to reset (usually within 24 hours) or upgrade to a paid plan to continue using the AI features.
*   If the AI call fails for any other reason, you will see the fallback content.

I am confident that these changes will provide a much better experience. Please let me know if you have any other questions.