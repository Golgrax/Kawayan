console.log("Kawayan Instagram Injector Active");

chrome.storage.local.get(['pendingPost'], (result) => {
  if (result.pendingPost && result.pendingPost.platform === 'instagram') {
    const post = result.pendingPost;
    
    const box = document.createElement('div');
    box.style.cssText = "position:fixed;bottom:20px;right:20px;background:#E1306C;color:white;padding:15px;border-radius:12px;z-index:999999;font-family:sans-serif;box-shadow:0 10px 15px rgba(0,0,0,0.1);";
    box.innerHTML = `<b>Kawayan AI</b><br/>Click (+) Create to start...`;
    document.body.appendChild(box);

    const checkInterval = setInterval(() => {
      // Instagram Web Create Modal
      // We look for the caption area which appears AFTER selecting an image/filter
      const editor = document.querySelector('div[contenteditable="true"][aria-label="Write a caption..."]') || 
                     document.querySelector('textarea[aria-label="Write a caption..."]');

      if (editor) {
        // Only inject if empty
        if (editor.innerText.trim() === '') {
             clearInterval(checkInterval);
             box.innerHTML = `<b>Kawayan AI</b><br/>Injecting Caption...`;
             
             editor.focus();
             // User requested caption only for Instagram
             const fullText = post.caption;
             document.execCommand('insertText', false, fullText);
             
             box.innerHTML = `<b>Kawayan AI</b><br/>Caption Filled!`;
             chrome.storage.local.remove('pendingPost');
        }
      }
    }, 1000);

    setTimeout(() => clearInterval(checkInterval), 120000); // Wait longer for Insta (user workflow is slower)
  }
});
