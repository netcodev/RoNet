document.addEventListener('DOMContentLoaded', function() {

  const links = {
    'settings-link': 'https://www.roblox.com/my/account?ronet=info#!/info',
    'github-link': 'https://github.com/netcodev/RoNet'
  };


  function addLinkListener(id, url) {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('click', () => chrome.tabs.create({ url }));
    }
  }

  for (const id in links) {
    addLinkListener(id, links[id]);
  }
});