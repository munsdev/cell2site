// Small page behaviours shared by every page: copy buttons and chip tab groups.
(function () {
  'use strict';

  // <button data-copy="#id"> copies that element's text. Clipboard can be refused (insecure
  // context, permissions); then the text is selected so Ctrl+C still works.
  document.addEventListener('click', async function (e) {
    var button = e.target.closest('[data-copy]');
    if (!button) return;
    var source = document.querySelector(button.getAttribute('data-copy'));
    if (!source) return;
    var label = button.textContent;
    try {
      await navigator.clipboard.writeText(source.value !== undefined ? source.value : source.textContent);
      button.textContent = 'Copied';
    } catch (err) {
      var range = document.createRange();
      range.selectNodeContents(source);
      getSelection().removeAllRanges();
      getSelection().addRange(range);
      button.textContent = 'Press Ctrl+C';
    }
    setTimeout(function () { button.textContent = label; }, 1600);
  });

  // [data-chips] holds [role=tab] buttons whose data-panel names a sibling panel to show.
  document.querySelectorAll('[data-chips]').forEach(function (group) {
    var tabs = Array.from(group.querySelectorAll('[role=tab]'));
    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      group.dispatchEvent(new CustomEvent('chips:select', { detail: tab }));
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!step) return;
        var next = tabs[(i + step + tabs.length) % tabs.length];
        next.focus();
        select(next);
      });
    });
    select(tabs.find(function (t) { return t.getAttribute('aria-selected') === 'true'; }) || tabs[0]);
  });
})();
