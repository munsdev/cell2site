// Home page demo: each tab renders the code shown beneath it, once external media is allowed
// and the tab is first opened. A map built in a hidden panel would measure zero, hence lazily.
(function () {
  'use strict';
  var group = document.getElementById('demo');
  if (!group) return;
  function render(tab) {
    var key = tab.id.replace('demo-', '');
    var target = document.querySelector('[data-demo="' + key + '"]');
    if (!target || target.childElementCount) return;
    window.c2consent.whenLibrary(function (cell2site) {
      // The markup is this page's own fixed code sample, never visitor input.
      target.innerHTML = document.getElementById('demo-' + key + '-code').textContent;
      cell2site.init(target);
    });
  }
  group.addEventListener('chips:select', function (e) { render(e.detail); });
  render(group.querySelector('[aria-selected=true]'));
})();
