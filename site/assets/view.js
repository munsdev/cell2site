// The viewer: form ⇄ query string ⇄ rendered embed. All state lives in the URL, so the page
// address is the share link, and nothing about the sheet ever reaches a cell2site server.
(function () {
  'use strict';
  var VIEW = 'https://cell2site.com/view/';
  var DEMO = 'https://docs.google.com/spreadsheets/d/1wlr72cfR-Z0MlFsB_MxgjGVcd2UOv6ffdFyhTLpIzlQ/edit';
  var FORMATS = ['cards', 'list', 'table', 'map'];
  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search);
  var isEmbed = params.get('embed') === '1';

  // A bare ID or any docs.google.com/spreadsheets URL; the library accepts both.
  var validSheet = function (v) { return /^[\w-]{10,}$/.test(v) || /^https:\/\/docs\.google\.com\/spreadsheets\//.test(v); };
  var state = function () {
    return { sheet: $('sheet').value.trim(), tab: $('tab').value.trim(), format: $('format').value, title: $('titleInput').value.trim() };
  };

  // Empty values are left out so the link stays short.
  function query(s, extra) {
    var q = new URLSearchParams();
    ['sheet', 'tab', 'format', 'title'].forEach(function (k) { if (s[k]) q.set(k, s[k]); });
    Object.keys(extra || {}).forEach(function (k) { q.set(k, extra[k]); });
    return q.toString();
  }

  var attr = function (v) { return v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); };
  function snippets(s) {
    var version = document.querySelector('meta[name=c2-version]').content;
    var cdn = 'https://cdn.jsdelivr.net/gh/munsdev/cell2site@v' + version + '/cell2site.js';
    var div = '<div data-cell2-embed="' + attr(s.format) + '" data-cell2-id="' + attr(s.sheet) + '"' +
      (s.tab ? ' data-cell2-sheet="' + attr(s.tab) + '"' : '') + '></div>';
    return {
      share: location.origin + location.pathname + '?' + query(s),
      embed: div + '\n<script src="' + cdn + '"><\/script>',
      iframe: '<iframe src="' + attr(VIEW + '?' + query(s, { embed: '1' })) + '" width="100%" height="' +
        (s.format === 'map' ? 520 : 600) + '" style="border:0" loading="lazy" title="' + attr(s.title || 'Google Sheet') + '"></iframe>',
    };
  }

  function render(s) {
    var heading = $('title');
    heading.textContent = s.title;   // visitor text: textContent only, never markup
    heading.hidden = !s.title || isEmbed;
    window.c2consent.whenLibrary(function (cell2site) {
      cell2site.clearCache();   // a viewer is for checking edits, so never show stale rows
      var box = document.createElement('div');
      box.setAttribute('data-cell2-embed', s.format);
      box.setAttribute('data-cell2-id', s.sheet);
      if (s.tab) box.setAttribute('data-cell2-sheet', s.tab);
      $('result').replaceChildren(box);
      cell2site.init($('result'));
    });
  }

  function show(s) {
    render(s);
    history.replaceState(null, '', location.pathname + '?' + query(s, isEmbed ? { embed: '1' } : null));
    $('actions').hidden = false;
    $('snippet').hidden = true;
    $('copied').textContent = '';
  }

  function submit() {
    var s = state();
    var bad = !validSheet(s.sheet);
    $('sheet').setAttribute('aria-invalid', String(bad));
    $('error').textContent = bad ? 'Enter a Google Sheets link or a sheet ID.' : '';
    if (bad) return $('sheet').focus();
    show(s);
  }

  $('form').addEventListener('submit', function (e) { e.preventDefault(); submit(); });
  $('try-demo').addEventListener('click', function () {
    $('sheet').value = DEMO;
    $('tab').value = 'Museums';
    $('format').value = 'cards';
    $('titleInput').value = 'Museums worth a trip';
    submit();
  });

  // Clipboard can be refused; then the code is shown selected so Ctrl+C still works.
  document.querySelectorAll('[data-snippet]').forEach(function (button) {
    button.addEventListener('click', function () {
      var text = snippets(state())[button.getAttribute('data-snippet')];
      var box = $('snippet');
      box.value = text;
      box.hidden = false;
      navigator.clipboard.writeText(text).then(
        function () { $('copied').textContent = 'Copied.'; },
        function () { box.select(); $('copied').textContent = 'Copy failed. The code is selected; press Ctrl+C.'; });
    });
  });

  // A shared link renders at once.
  var initial = { sheet: params.get('sheet') || '', tab: params.get('tab') || '',
    format: FORMATS.indexOf(params.get('format')) >= 0 ? params.get('format') : 'cards', title: params.get('title') || '' };
  $('sheet').value = initial.sheet;
  $('tab').value = initial.tab;
  $('format').value = initial.format;
  $('titleInput').value = initial.title;
  if (validSheet(initial.sheet)) show(initial);
})();
