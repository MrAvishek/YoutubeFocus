const keys = [
  "hideShorts",
  "greyShorts", // added
  "hideSidebar",
  "hideComments",
  "hideHomepage",
  "hideChat",
  "hideChannelVideos",
  "hideEndscreen",
  "hideAnnotations",
  "subsOnlyHomepage"
];

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(keys, (data) => {
    keys.forEach(key => {
      document.getElementById(key).checked = data[key] || false;
    });
  });

  keys.forEach(key => {
    const checkbox = document.getElementById(key);
    checkbox.addEventListener("change", (e) => {
      const checked = e.target.checked;

      // Enforce mutual exclusivity for hideShorts and greyShorts
      if (key === "hideShorts" && checked) {
        document.getElementById("greyShorts").checked = false;
        chrome.storage.sync.set({ greyShorts: false });
      } else if (key === "greyShorts" && checked) {
        document.getElementById("hideShorts").checked = false;
        chrome.storage.sync.set({ hideShorts: false });
      }

      chrome.storage.sync.set({ [key]: checked });
    });
  });
});
