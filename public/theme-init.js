(function () {
  try {
    var saved = localStorage.getItem('json_link_theme');
    var isDark = saved === 'dark' || (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch {
    // Storage or matchMedia can throw in locked-down browsers; leave the default theme.
  }
})();
