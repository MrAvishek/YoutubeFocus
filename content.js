// Only run in the top-level window (skip if inside an iframe)
if (window.top === window.self) {

  function removeShortsElementsByText() {
    const nodeList = document.querySelectorAll("ytd-rich-section-renderer, ytd-reel-shelf-renderer, a, span, yt-formatted-string");

    nodeList.forEach(node => {
      if (node.textContent?.trim().toLowerCase() === "shorts") {
        const parent = node.closest("ytd-rich-section-renderer, ytd-reel-shelf-renderer, ytd-item-section-renderer, a");
        if (parent) parent.remove();
      }
    });

    // Also remove anchor links to Shorts
    document.querySelectorAll('a[href*="/shorts"]').forEach(el => el.remove());
  }

  function applyFocusSettings(settings, dynamicPath) {
    const body = document.body;
    const path = dynamicPath || location.pathname;

    // Clear Shorts-related classes first
    body.classList.remove("ytf-hide-shorts", "ytf-grey-shorts");

    // 🧹 UI Toggles via <body> classes
    body.classList.toggle("ytf-hide-sidebar", settings.hideSidebar);
    body.classList.toggle("ytf-hide-comments", settings.hideComments);
    body.classList.toggle("ytf-hide-chat", settings.hideChat);
    body.classList.toggle("ytf-hide-endscreen", settings.hideEndscreen);
    body.classList.toggle("ytf-hide-annotations", settings.hideAnnotations);

    // 📦 Channel video hiding
    const isChannelVideoPage = /^\/@[^\/]+\/videos/.test(path);
    body.classList.toggle("ytf-hide-channel-videos", isChannelVideoPage && settings.hideChannelVideos);

    // 🏠 Homepage feed hiding
    if (path === "/") {
      body.classList.toggle("ytf-hide-homepage", settings.hideHomepage);

      // 📺 Redirect to subscriptions if enabled
      if (settings.subsOnlyHomepage) {
        window.location.href = "https://www.youtube.com/feed/subscriptions";
        return;
      }
    } else {
      body.classList.remove("ytf-hide-homepage");
    }

    // 🚫 Shorts logic
    if (settings.hideShorts) {
      body.classList.add("ytf-hide-shorts");

      // Redirect away from Shorts pages (main or channel shorts tab)
      if (path.startsWith("/shorts") || /^\/@[^\/]+\/shorts/.test(path)) {
        window.location.href = "https://www.youtube.com";
        return;
      }

      // 💥 Remove shorts-related visual elements
      removeShortsElementsByText();

    } else if (settings.greyShorts) {
      body.classList.add("ytf-grey-shorts");
    }
  }

  function init() {
    if (!document.body) {
      console.warn("⏳ Body not yet available. Retrying...");
      return setTimeout(init, 200);
    }

    try {
      if (!chrome.runtime?.id) return;

      chrome.storage.sync.get(null, (settings) => {
        if (chrome.runtime?.lastError) {
          console.warn("YouTube Focus Mode: Runtime error", chrome.runtime.lastError);
          return;
        }
        applyFocusSettings(settings, location.pathname);
      });
    } catch (err) {
      console.error("YouTube Focus Mode: Init error", err);
    }

    // 🔁 Observe DOM changes (with throttling)
    let timeoutId = null;
    const observer = new MutationObserver(() => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        try {
          if (!chrome.runtime?.id) {
            console.warn("YouTube Focus Mode: Extension context invalidated. Observer stopped.");
            observer.disconnect();
            return;
          }

          chrome.storage.sync.get(null, (settings) => {
            if (chrome.runtime?.lastError) {
              console.warn("YouTube Focus Mode: Runtime error", chrome.runtime.lastError);
              return;
            }
            applyFocusSettings(settings, location.pathname);
          });
        } catch (err) {
          console.warn("YouTube Focus Mode: Observer error", err);
        }
      }, 300);
    });

    // Observe a higher-level container for increased reliability
    const targetNode = document.querySelector("ytd-app") || document.body;
    observer.observe(targetNode, { childList: true, subtree: true });

    // 🧼 Clean up on page unload
    window.addEventListener("unload", () => {
      observer.disconnect();
    });
  }

  // Start the extension
  init();

} else {
  console.log("YouTube Focus Mode: Skipping iframe context.");
}
