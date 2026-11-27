(function () {
  try {
    var theme = localStorage.getItem('tf-theme') || 'dark';
    document.documentElement.dataset.theme = theme;
  } catch (_e) {}
})();
