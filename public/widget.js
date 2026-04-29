/**
 * Vext Embeddable Widget — v1.0.0
 * Usage: <script src="https://vext.so/widget.js" data-card="p4FgH2"></script>
 *
 * Zero dependencies. Vanilla JS. Self-contained.
 * Injects a live card preview wherever the script tag is placed.
 */
(function () {
  'use strict';

  var BASE_URL = 'https://vext.so';

  // ── Style injection (once per page) ──────────────────────────────────────
  var STYLE_ID = '__vext_widget_styles__';
  if (!document.getElementById(STYLE_ID)) {
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.vext-widget{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;box-sizing:border-box;all:initial;display:block}',
      '.vext-widget *{box-sizing:border-box;margin:0;padding:0}',
      '.vext-card{background:#141417;border:1px solid #2a2a32;border-radius:16px;overflow:hidden;position:relative;transition:border-color .2s,box-shadow .2s;max-width:480px;width:100%}',
      '.vext-card:hover{border-color:#3a3a46;box-shadow:0 8px 32px rgba(0,0,0,.4)}',
      '.vext-card-top{height:3px;background:linear-gradient(90deg,#00ff88,#00d4ff,#b084ff)}',
      '.vext-card-body{padding:20px}',
      '.vext-card-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}',
      '.vext-badge{font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;padding:3px 10px;border-radius:5px;border:1px solid}',
      '.vext-title{font-size:15px;font-weight:700;color:#f0f0f4;line-height:1.4;margin-bottom:12px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}',
      '.vext-meta{display:flex;align-items:center;gap:8px;margin-bottom:14px}',
      '.vext-meta-item{font-size:11px;color:#5a5a6a;display:flex;align-items:center;gap:4px}',
      '.vext-steps{list-style:none;margin-bottom:14px}',
      '.vext-step{display:flex;gap:8px;margin-bottom:8px;align-items:flex-start}',
      '.vext-step-num{flex-shrink:0;width:20px;height:20px;border-radius:50%;background:#00ff881a;border:1px solid #00ff8830;color:#00ff88;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px}',
      '.vext-step-text{font-size:12px;color:#d0d0da;line-height:1.5}',
      '.vext-more{font-size:11px;color:#5a5a6a;margin-bottom:14px}',
      '.vext-footer{display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid #1a1a1e}',
      '.vext-cta{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:8px;background:linear-gradient(135deg,#00ff88,#00d4ff);font-size:12px;font-weight:700;color:#000;text-decoration:none;transition:opacity .15s}',
      '.vext-cta:hover{opacity:.85}',
      '.vext-powered{font-size:10px;color:#3a3a46}',
      '.vext-powered a{color:#5a5a6a;text-decoration:none}',
      '.vext-powered a:hover{color:#00ff88}',
      '.vext-loading{padding:24px;text-align:center;color:#5a5a6a;font-size:13px}',
      '.vext-error{padding:20px;text-align:center;color:#ff6b35;font-size:12px;border:1px solid #ff6b3520;border-radius:12px;background:#ff6b350a}',
      '.vext-logo{display:flex;align-items:center;gap:6px;text-decoration:none}',
      '.vext-logo-mark{width:24px;height:24px;border-radius:6px;background:linear-gradient(135deg,#00ff88,#00d4ff);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#000}',
      '.vext-logo-text{font-size:13px;font-weight:700;color:#f0f0f4}',
    ].join('');
    document.head.appendChild(style);
  }

  // ── Badge palette ─────────────────────────────────────────────────────────
  var BADGES = {
    'setup/tutorial':     { color: '#00ff88', bg: '#00ff881a', border: '#00ff8830', label: 'Setup / Tutorial' },
    'strategy/framework': { color: '#00d4ff', bg: '#00d4ff1a', border: '#00d4ff30', label: 'Strategy / Framework' },
    'tool demo':          { color: '#b084ff', bg: '#b084ff1a', border: '#b084ff30', label: 'Tool Demo' },
    'finance/setup':      { color: '#ffd60a', bg: '#ffd60a1a', border: '#ffd60a30', label: 'Finance / Setup' },
    'product teardown':   { color: '#ff6b35', bg: '#ff6b351a', border: '#ff6b3530', label: 'Product Teardown' },
    'interview/talk':     { color: '#00ff88', bg: '#00ff881a', border: '#00ff8830', label: 'Interview / Talk' },
    'research/paper':     { color: '#00d4ff', bg: '#00d4ff1a', border: '#00d4ff30', label: 'Research / Paper' },
    'debate/discussion':  { color: '#b084ff', bg: '#b084ff1a', border: '#b084ff30', label: 'Debate / Discussion' },
  };

  // ── HTML builder ──────────────────────────────────────────────────────────
  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function buildPreviewItems(classification, output) {
    var items = [];
    switch (classification) {
      case 'setup/tutorial':
        items = (output.steps || []).slice(0, 4);
        break;
      case 'strategy/framework':
        items = (output.keyPrinciples || []).slice(0, 4);
        break;
      case 'tool demo':
        items = (output.features || []).slice(0, 4);
        break;
      case 'finance/setup':
        items = output.riskParameters
          ? Object.entries(output.riskParameters).slice(0, 4).map(function (e) { return e[0] + ': ' + e[1]; })
          : [];
        break;
      case 'product teardown':
        items = (output.strengths || []).slice(0, 3).concat((output.weaknesses || []).slice(0, 1));
        break;
      case 'interview/talk':
        items = (output.keyTakeaways || []).slice(0, 4);
        break;
      case 'research/paper':
        items = [output.hypothesis, output.methodology].filter(Boolean).map(function (s) {
          return String(s).slice(0, 80);
        });
        break;
      case 'debate/discussion':
        items = (output.viewpoints || []).slice(0, 3).map(function (vp) { return vp.position || ''; });
        break;
      default:
        items = [];
    }
    return items.filter(Boolean);
  }

  function renderCard(data) {
    var card = data;
    var badge = BADGES[card.classification] || BADGES['setup/tutorial'];
    var cardUrl = BASE_URL + '/card/' + esc(card.shareId);
    var items = buildPreviewItems(card.classification, card.output || {});
    var date = card.createdAt
      ? new Date(card.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '';

    var stepsHtml = items.slice(0, 3).map(function (item, i) {
      return '<li class="vext-step">'
        + '<span class="vext-step-num">' + (i + 1) + '</span>'
        + '<span class="vext-step-text">' + esc(item) + '</span>'
        + '</li>';
    }).join('');

    var moreHtml = items.length > 3
      ? '<p class="vext-more">+' + (items.length - 3) + ' more — <a href="' + esc(cardUrl) + '" target="_blank" rel="noopener" style="color:#00d4ff;text-decoration:none;">view all</a></p>'
      : '';

    return '<div class="vext-card">'
      + '<div class="vext-card-top"></div>'
      + '<div class="vext-card-body">'
      + '<div class="vext-card-header">'
      + '<a class="vext-logo" href="' + BASE_URL + '" target="_blank" rel="noopener">'
      + '<div class="vext-logo-mark">V</div>'
      + '<span class="vext-logo-text">Vext</span>'
      + '</a>'
      + '<span class="vext-badge" style="color:' + badge.color + ';background:' + badge.bg + ';border-color:' + badge.border + '">'
      + esc(badge.label)
      + '</span>'
      + '</div>'
      + '<div class="vext-title">' + esc(card.title || 'Video Intelligence Card') + '</div>'
      + (date ? '<div class="vext-meta"><span class="vext-meta-item">📅 ' + esc(date) + '</span></div>' : '')
      + (stepsHtml ? '<ul class="vext-steps">' + stepsHtml + '</ul>' : '')
      + moreHtml
      + '<div class="vext-footer">'
      + '<a class="vext-cta" href="' + esc(cardUrl) + '" target="_blank" rel="noopener">'
      + 'View Full Card →'
      + '</a>'
      + '<div class="vext-powered">Powered by <a href="' + BASE_URL + '?ref=widget" target="_blank" rel="noopener">vext.so</a></div>'
      + '</div>'
      + '</div>'
      + '</div>';
  }

  // ── Track referrer click-through ─────────────────────────────────────────
  function trackImpression(shareId) {
    try {
      var referer = window.location.href;
      // Fire-and-forget impression ping
      fetch(BASE_URL + '/api/share-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareId: shareId, referer: referer, type: 'widget_impression' }),
        keepalive: true,
      }).catch(function () {});
    } catch (e) {}
  }

  // ── Mount a single widget ─────────────────────────────────────────────────
  function mountWidget(scriptEl) {
    var shareId = scriptEl.getAttribute('data-card');
    if (!shareId) return;

    // Create wrapper
    var wrapper = document.createElement('div');
    wrapper.className = 'vext-widget';
    wrapper.setAttribute('data-vext-card', shareId);

    // Loading state
    wrapper.innerHTML = '<div class="vext-card"><div class="vext-card-top"></div><div class="vext-loading">Loading Vext card…</div></div>';

    // Insert immediately after script tag
    scriptEl.parentNode.insertBefore(wrapper, scriptEl.nextSibling);

    // Fetch card data
    fetch(BASE_URL + '/api/card/' + encodeURIComponent(shareId), {
      headers: { 'Accept': 'application/json' },
      cache: 'force-cache',
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Card not found');
        return res.json();
      })
      .then(function (data) {
        wrapper.innerHTML = renderCard(data);
        trackImpression(shareId);
      })
      .catch(function (err) {
        wrapper.innerHTML = '<div class="vext-error">Could not load card preview.<br>'
          + '<a href="' + BASE_URL + '/card/' + encodeURIComponent(shareId) + '" target="_blank" rel="noopener" style="color:#00d4ff">View on Vext →</a>'
          + '</div>';
      });
  }

  // ── Find and mount all Vext widget scripts on the page ──────────────────
  function init() {
    // Find all script tags pointing to widget.js with data-card attr
    var scripts = document.querySelectorAll('script[data-card][src*="vext.so/widget"]');
    if (scripts.length === 0) {
      // Fallback: find by data attribute on any element
      scripts = document.querySelectorAll('[data-vext-card]');
      scripts.forEach(function (el) {
        var shareId = el.getAttribute('data-vext-card');
        if (shareId && !el.hasAttribute('data-vext-mounted')) {
          el.setAttribute('data-vext-mounted', '1');
          var wrapper = document.createElement('div');
          wrapper.className = 'vext-widget';
          el.appendChild(wrapper);
          fetch(BASE_URL + '/api/card/' + encodeURIComponent(shareId))
            .then(function (r) { return r.json(); })
            .then(function (d) { wrapper.innerHTML = renderCard(d); })
            .catch(function () {});
        }
      });
      return;
    }

    scripts.forEach(function (el) {
      if (!el.hasAttribute('data-vext-mounted')) {
        el.setAttribute('data-vext-mounted', '1');
        mountWidget(el);
      }
    });
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
