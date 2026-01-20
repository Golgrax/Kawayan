// Listen for messages from the dashboard content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'KAWAYAN_POST_REQUEST') {
    console.log("Background received post request:", request.data);

    // Store the data
    chrome.storage.local.set({ 'pendingPost': request.data }, () => {
      // Open the target social media tab
      let url = '';
      if (request.data.platform === 'tiktok') {
        url = 'https://www.tiktok.com/tiktokstudio/upload?lang=en';
      } else if (request.data.platform === 'facebook') {
        // Facebook Creator Studio or Business Suite is complex. 
        // Let's try the standard page composer if possible, or Business Suite.
        // Business Suite is usually: https://business.facebook.com/latest/composer
        url = 'https://business.facebook.com/latest/composer';
      } else if (request.data.platform === 'instagram') {
        // Instagram Web Create
        url = 'https://www.instagram.com/';
      }

      if (url) {
        chrome.tabs.create({ url: url });
      }
    });
  }
});