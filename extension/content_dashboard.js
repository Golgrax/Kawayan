console.log("Kawayan Dashboard Listener Active (v5)");

// Listen for window messages (works across isolated worlds)
window.addEventListener('message', (event) => {
  // We only accept messages from ourselves
  if (event.source !== window) return;

  if (event.data.type && event.data.type === 'KAWAYAN_POST_REQUEST') {
    console.log("Extension received message from Dashboard:", event.data.data);
    
    // Check if chrome runtime is available
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        try {
            chrome.runtime.sendMessage({
                type: 'KAWAYAN_POST_REQUEST',
                data: event.data.data
            });
        } catch (e) {
            console.error("Extension context invalid (Orphaned). Please Refresh the Page.", e);
            alert("Please REFRESH this page to reconnect to the updated extension.");
        }
    } else {
        console.error("Chrome API not found. Extension might not be running.");
        alert("Extension error: Please refresh the page.");
    }
  }
});
