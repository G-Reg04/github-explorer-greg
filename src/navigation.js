// Handle navigation when clicking on site title
document.addEventListener('DOMContentLoaded', () => {
  const siteTitle = document.getElementById('siteTitle');
  
  if (siteTitle) {
    siteTitle.addEventListener('click', (e) => {
      e.preventDefault();
      const home = new URL('/', location.origin);
      location.replace(home.toString());
    });
  }
});
