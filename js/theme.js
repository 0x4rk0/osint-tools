(function() {
  var STORAGE_KEY = 'osint-theme';
  var toggle = document.getElementById('theme-toggle');
  var root = document.documentElement;

  function applyTheme(theme) {
    if (theme === 'dark' || theme === 'light') {
      root.setAttribute('data-theme', theme);
    } else {
      root.removeAttribute('data-theme');
    }
    if (toggle) {
      var isDark = root.getAttribute('data-theme') === 'dark';
      toggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      toggle.querySelector('.theme-toggle__icon').textContent = isDark ? '☀️' : '🌙';
      toggle.title = isDark ? 'Switch to system theme' : 'Switch to dark mode';
    }
  }

  function getStoredTheme() {
    return localStorage.getItem(STORAGE_KEY);
  }

  function setStoredTheme(theme) {
    if (theme) {
      localStorage.setItem(STORAGE_KEY, theme);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  function init() {
    var stored = getStoredTheme();
    applyTheme(stored);

    if (toggle) {
      toggle.addEventListener('click', function() {
        var current = root.getAttribute('data-theme');
        if (current === 'dark') {
          setStoredTheme(null);
          applyTheme(null);
        } else {
          setStoredTheme('dark');
          applyTheme('dark');
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
