console.log("Kawayan Facebook Injector Active");

chrome.storage.local.get(['pendingPost'], (result) => {
  if (result.pendingPost && result.pendingPost.platform === 'facebook') {
    const post = result.pendingPost;
    
    // Status Box (reused logic basically)
    const box = document.createElement('div');
    box.style.cssText = "position:fixed;bottom:20px;right:20px;background:#1877F2;color:white;padding:15px;border-radius:12px;z-index:999999;font-family:sans-serif;box-shadow:0 10px 15px rgba(0,0,0,0.1);";
    box.innerHTML = `<b>Kawayan AI</b><br/>Waiting for editor...`;
    document.body.appendChild(box);

    const checkInterval = setInterval(() => {
      // Facebook Business Suite / Creator Studio often uses these classes
      // They are dynamic, so looking for 'contenteditable' is safest.
      const editor = document.querySelector('div[contenteditable="true"][role="textbox"]') || 
                     document.querySelector('.notranslate._5rpu') || // Classic FB
                     document.querySelector('div[aria-label="Write a post..."]');

      if (editor) {
        clearInterval(checkInterval);
        box.innerHTML = `<b>Kawayan AI</b><br/>Editor Found! Injecting...`;
        
        editor.focus();
        
        // Construct Full Text (Title + Caption)
        const fullText = (post.title ? `${post.title}\n\n` : '') + post.caption;

        try {
          const success = document.execCommand('insertText', false, fullText);
          if (!success) {
            // Fallback for some React editors
             // This is hacky but often needed for FB
             const dataTransfer = new DataTransfer();
             dataTransfer.setData('text/plain', fullText);
             const pasteEvent = new ClipboardEvent('paste', { clipboardData: dataTransfer, bubbles: true });
             editor.dispatchEvent(pasteEvent);
          }
          box.innerHTML = `<b>Kawayan AI</b><br/>Done! Review your post.`;
          chrome.storage.local.remove('pendingPost');
        } catch (e) {
          box.innerHTML = `<b>Kawayan AI</b><br/>Injection Failed. Copy/Paste manually.`;
        }
      }
    }, 1000);

    setTimeout(() => clearInterval(checkInterval), 60000);
  }
});
