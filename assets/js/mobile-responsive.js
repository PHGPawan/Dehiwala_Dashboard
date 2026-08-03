(function () {
  'use strict';

  const PHONE_BREAKPOINT = 900;
  const menuButton = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const pageWrap = document.querySelector('.page-wrap');

  function isPhoneLayout() {
    return window.innerWidth <= PHONE_BREAKPOINT;
  }

  function syncNavigationState() {
    const open = Boolean(sidebar && sidebar.classList.contains('open') && isPhoneLayout());
    document.body.classList.toggle('mobile-nav-open', open);
    if (menuButton) {
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
    if (overlay) overlay.setAttribute('aria-hidden', String(!open));
  }

  function closeNavigation() {
    if (!sidebar || !overlay) return;
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
    syncNavigationState();
  }

  function resizeVisuals() {
    const activePage = document.querySelector('.page.active');
    if (
      activePage &&
      activePage.id === 'page-overview' &&
      window.__overviewMap &&
      typeof window.__overviewMap.invalidateSize === 'function'
    ) {
      window.__overviewMap.invalidateSize({ pan: false, animate: false });
    }
    if (typeof window.__resizeActiveRealMap === 'function') {
      window.__resizeActiveRealMap();
    }
    if (window.Chart && window.Chart.instances) {
      Object.values(window.Chart.instances).forEach(function (chart) {
        if (!chart || typeof chart.resize !== 'function') return;
        const canvas = chart.canvas;
        const page = canvas && canvas.closest('.page');
        if (!page || page.classList.contains('active')) chart.resize();
      });
    }
  }

  document.querySelectorAll('.page table').forEach(function (table) {
    if (table.parentElement && table.parentElement.classList.contains('mobile-table-scroll')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'mobile-table-scroll';
    wrapper.setAttribute('role', 'region');
    wrapper.setAttribute('aria-label', 'Scrollable data table');
    wrapper.setAttribute('tabindex', '0');
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });

  document.querySelectorAll('.pro-command-btn[data-label]').forEach(function (button) {
    button.setAttribute('type', 'button');
    button.setAttribute('aria-label', button.dataset.label);
    button.setAttribute('title', button.dataset.label);
  });

  document.querySelectorAll('.pro-close').forEach(function (button) {
    const container = button.closest('.pro-drawer, .pro-modal');
    const heading = container && container.querySelector('h2');
    button.setAttribute('aria-label', heading ? 'Close ' + heading.textContent.trim() : 'Close panel');
  });

  document.querySelectorAll('.pro-switch').forEach(function (button) {
    const row = button.closest('.pro-access-row');
    const label = row && row.querySelector('span');
    const syncSwitch = function () {
      button.setAttribute('aria-checked', String(button.classList.contains('on')));
    };
    button.setAttribute('role', 'switch');
    if (label) button.setAttribute('aria-label', label.textContent.trim());
    new MutationObserver(syncSwitch).observe(button, {
      attributes: true,
      attributeFilter: ['class']
    });
    syncSwitch();
  });

  document.querySelectorAll('.ip-tree-filter').forEach(function (button) {
    const syncFilter = function () {
      button.setAttribute('aria-pressed', String(button.classList.contains('active')));
    };
    new MutationObserver(syncFilter).observe(button, {
      attributes: true,
      attributeFilter: ['class']
    });
    syncFilter();
  });

  document.querySelectorAll('.ip-tree-node-main').forEach(function (button) {
    const node = button.closest('.ip-tree-node');
    const title = button.querySelector('.ip-tree-title');
    const syncNode = function () {
      button.setAttribute('aria-expanded', String(Boolean(node && node.classList.contains('open'))));
    };
    if (title) button.setAttribute('aria-label', title.textContent.trim());
    if (node) {
      new MutationObserver(syncNode).observe(node, {
        attributes: true,
        attributeFilter: ['class']
      });
    }
    syncNode();
  });

  function enhanceGeneratedIssueControls() {
    document.querySelectorAll('.ip-tree-filter:not([data-mobile-a11y])').forEach(function (button) {
      button.dataset.mobileA11y = 'true';
      const syncFilter = function () {
        button.setAttribute('aria-pressed', String(button.classList.contains('active')));
      };
      new MutationObserver(syncFilter).observe(button, {
        attributes: true,
        attributeFilter: ['class']
      });
      syncFilter();
    });

    document.querySelectorAll('.ip-tree-node-main:not([data-mobile-a11y])').forEach(function (button) {
      button.dataset.mobileA11y = 'true';
      const node = button.closest('.ip-tree-node');
      const title = button.querySelector('.ip-tree-title');
      const syncNode = function () {
        button.setAttribute('aria-expanded', String(Boolean(node && node.classList.contains('open'))));
      };
      if (title) button.setAttribute('aria-label', title.textContent.trim());
      if (node) {
        new MutationObserver(syncNode).observe(node, {
          attributes: true,
          attributeFilter: ['class']
        });
      }
      syncNode();
    });
  }

  function enhanceGeneratedProfessionalControls() {
    document.querySelectorAll('.pro-command-btn[data-label]:not([data-mobile-a11y])').forEach(function (button) {
      button.dataset.mobileA11y = 'true';
      button.setAttribute('type', 'button');
      button.setAttribute('aria-label', button.dataset.label);
      button.setAttribute('title', button.dataset.label);
    });

    document.querySelectorAll('.pro-close:not([data-mobile-a11y])').forEach(function (button) {
      button.dataset.mobileA11y = 'true';
      const container = button.closest('.pro-drawer, .pro-modal');
      const heading = container && container.querySelector('h2');
      button.setAttribute('aria-label', heading ? 'Close ' + heading.textContent.trim() : 'Close panel');
    });

    document.querySelectorAll('.pro-switch:not([data-mobile-a11y])').forEach(function (button) {
      button.dataset.mobileA11y = 'true';
      const row = button.closest('.pro-access-row');
      const label = row && row.querySelector('span');
      const syncSwitch = function () {
        button.setAttribute('aria-checked', String(button.classList.contains('on')));
      };
      button.setAttribute('role', 'switch');
      if (label) button.setAttribute('aria-label', label.textContent.trim());
      new MutationObserver(syncSwitch).observe(button, {
        attributes: true,
        attributeFilter: ['class']
      });
      syncSwitch();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    requestAnimationFrame(function () {
      enhanceGeneratedIssueControls();
      enhanceGeneratedProfessionalControls();
    });
  });
  window.setTimeout(enhanceGeneratedIssueControls, 0);
  window.setTimeout(enhanceGeneratedProfessionalControls, 0);

  if (menuButton) {
    menuButton.setAttribute('aria-controls', 'sidebar');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.addEventListener('click', function () {
      requestAnimationFrame(syncNavigationState);
    });
  }

  if (overlay) {
    overlay.setAttribute('aria-hidden', 'true');
    overlay.addEventListener('click', function () {
      requestAnimationFrame(syncNavigationState);
    });
  }

  if (sidebar) {
    new MutationObserver(syncNavigationState).observe(sidebar, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  document.querySelectorAll('.nav-item[data-page]').forEach(function (item) {
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        item.click();
      }
    });
    item.addEventListener('click', function () {
      closeNavigation();
      requestAnimationFrame(function () {
        if (pageWrap) pageWrap.scrollTop = 0;
        resizeVisuals();
        window.setTimeout(resizeVisuals, 180);
        if (item.dataset.page === 'overview') {
          window.setTimeout(function () {
            if (typeof window.__fitOverviewMap === 'function') window.__fitOverviewMap(0);
          }, 220);
        }
      });
    });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && document.body.classList.contains('mobile-nav-open')) {
      closeNavigation();
      if (menuButton) menuButton.focus();
    }
  });

  let resizeTimer = 0;
  window.addEventListener('resize', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      if (!isPhoneLayout()) closeNavigation();
      syncNavigationState();
    }, 100);
  }, { passive: true });

  syncNavigationState();
  window.setTimeout(function () {
    resizeVisuals();
    if (typeof window.__fitOverviewMap === 'function') window.__fitOverviewMap(0);
  }, 240);
  document.documentElement.classList.add('mobile-responsive-ready');
})();
