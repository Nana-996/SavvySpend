// js/app.js — SPA Router, Global Utilities, App Initialization
(function () {
  'use strict';

  // Preserve pages/components already registered by other modules
  window.SavvySpend = window.SavvySpend || {};
  const App = window.SavvySpend;
  App.pages = App.pages || {};
  App.components = App.components || {};

  let currentPage = null;
  let currentPageName = '';

  // ── Routing ──────────────────────────────────────────────

  App.currentRoute = '';

  App.initZoomBlocker = function () {
    // ── 1. Gesture Zoom Block (Mobile Safari/Chrome) ──
    // Prevent multi-touch pinch gestures
    document.addEventListener('touchstart', function (e) {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });

    // Prevent double-tap to zoom
    var lastTouchEnd = 0;
    document.addEventListener('touchend', function (e) {
      var now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, false);

    // Prevent pinch-zoom gestures during touch movement
    document.addEventListener('touchmove', function (e) {
      if (e.scale !== undefined && e.scale !== 1) {
        e.preventDefault();
      }
    }, { passive: false });

    // ── 2. Keyboard & Wheel Zoom Block (Desktop Web) ──
    // Block physical key codes and character keys associated with zooming
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey) {
        const blockCodes = ['Equal', 'Minus', 'Digit0', 'NumpadAdd', 'NumpadSubtract', 'Numpad0'];
        const blockKeys = ['+', '=', '-', '_', '0'];
        if (blockCodes.includes(e.code) || blockKeys.includes(e.key)) {
          e.preventDefault();
        }
      }
    });

    // Block mouse wheel pinch-zoom or Ctrl+scroll zooming
    document.addEventListener('wheel', function (e) {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    }, { passive: false });

    // ── 3. Dynamic Zoom Counteractor (Desktop/Web Scale Lock) ──
    // Establish a baseline Device Pixel Ratio (DPR) to compare against
    let baseDPR = parseFloat(sessionStorage.getItem('ss_base_dpr'));
    if (!baseDPR || isNaN(baseDPR)) {
      baseDPR = window.devicePixelRatio || 1;
      sessionStorage.setItem('ss_base_dpr', baseDPR);
    }

    function applyScaleLock() {
      const shellEl = document.getElementById('app-shell');
      if (!shellEl) return;

      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        // Clear any scale adjustments on mobile/simulated devices
        shellEl.style.transform = '';
        shellEl.style.transformOrigin = '';
        shellEl.style.width = '';
        shellEl.style.height = '';
        document.body.style.overflow = '';
        document.body.style.overflowX = 'hidden';
        document.documentElement.style.overflowX = 'hidden';
        return;
      }

      const currentDPR = window.devicePixelRatio || 1;
      const zoomFactor = currentDPR / baseDPR;

      if (Math.abs(zoomFactor - 1) > 0.01) {
        // Under zoom conditions, scale inverse to zoomFactor
        const scale = 1 / zoomFactor;
        
        shellEl.style.transform = `scale(${scale})`;
        shellEl.style.transformOrigin = 'top center';
        
        // Compensate dimensions to maintain layout filling the screen
        shellEl.style.width = `${100 * zoomFactor}%`;
        shellEl.style.height = `${100 * zoomFactor}vh`;
        
        // Hide browser scrollbars so that only the internal page-container scrolls
        document.body.style.overflow = 'hidden';
      } else {
        // Reset properties when at 100% zoom
        shellEl.style.transform = '';
        shellEl.style.transformOrigin = '';
        shellEl.style.width = '';
        shellEl.style.height = '';
        document.body.style.overflow = '';
      }

      document.body.style.overflowX = 'hidden';
      document.documentElement.style.overflowX = 'hidden';
    }

    // Monitor for resize and run check interval
    applyScaleLock();
    window.addEventListener('resize', applyScaleLock);
    setInterval(applyScaleLock, 500);
  };

  App.initKeyboardViewportHandler = function () {
    function updateViewportHeight() {
      const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      document.documentElement.style.setProperty('--app-height', `${height}px`);
      
      // Force window scroll back to 0,0 to prevent any automatic viewport shifts
      window.scrollTo(0, 0);
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
      window.visualViewport.addEventListener('scroll', updateViewportHeight);
    }
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);
    
    // Initial call to set the height
    updateViewportHeight();

    // Prevent default browser screen shifting during keyboard focus
    document.addEventListener('focusin', function (e) {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        setTimeout(function () {
          window.scrollTo(0, 0);
          e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 50);
      }
    });

    document.addEventListener('focusout', function (e) {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        setTimeout(function () {
          window.scrollTo(0, 0);
        }, 50);
      }
    });
  };

  App.init = function () {
    // Initialize zoom blockers and dynamic scaling
    App.initZoomBlocker();
    App.initKeyboardViewportHandler();

    // Apply persisted dark mode
    const settings = DataStore.getSettings();
    if (settings.darkMode) {
      document.body.classList.add('dark');
    }

    // Render bottom navbar
    const navbar = document.getElementById('bottom-navbar');
    if (App.components.Navbar) {
      navbar.innerHTML = App.components.Navbar.render();
      App.components.Navbar.init(navbar);
    }

    // Modal: close on backdrop click
    const overlay = document.getElementById('modal-overlay');
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) App.closeModal();
    });

    // Listen for hash changes
    window.addEventListener('hashchange', function () {
      App.handleRoute();
    });

    // Navigate to default route or current hash
    if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
      window.location.hash = '#/home';
    } else {
      App.handleRoute();
    }

    // Check budget alerts on launch
    setTimeout(function () {
      if (App.components.Notifications) {
        App.components.Notifications.checkBudgetAlerts();
      }
    }, 1500);
  };

  App.handleRoute = function () {
    const hash = window.location.hash || '#/home';
    App.currentRoute = hash;

    // Check if user is authenticated (profile exists and can be decrypted)
    var user = DataStore.getUser();
    var hasUser = localStorage.getItem('ss_user') !== null;

    if (hash === '#/welcome') {
      if (user && hasUser) {
        window.location.hash = '#/home';
        return;
      }
    } else {
      if (!user) {
        window.location.hash = '#/welcome';
        return;
      }
    }

    // Parse: #/goals/goal_abc → route='goals', param='goal_abc'
    const parts = hash.slice(2).split('/');
    const route = parts[0] || 'home';
    const param = parts.slice(1).join('/') || null;

    // Destroy previous page
    if (currentPage && currentPage.destroy) {
      currentPage.destroy();
    }

    // Route → Page mapping
    const routeMap = {
      home: 'Home',
      budgets: 'Budgets',
      analytics: 'Analytics',
      goals: 'Goals',
      goal: 'GoalDetail',
      transaction: 'Transaction',
      profile: 'Profile',
      journey: 'Journey',
      welcome: 'Welcome',
      modes: 'MoneyModes'
    };

    const pageName = routeMap[route] || 'Home';
    const page = App.pages[pageName];

    if (!page) {
      console.warn('[SavvySpend] Page not found:', pageName);
      return;
    }

    const container = document.getElementById('page-container');

    // Page exit animation
    container.classList.add('page-exit');

    setTimeout(function () {
      // Render page
      container.innerHTML = page.render(param);
      currentPage = page;
      currentPageName = pageName;

      // Page enter animation
      container.classList.remove('page-exit');
      container.classList.add('page-enter');
      setTimeout(function () {
        container.classList.remove('page-enter');
      }, 300);

      // Post-render lifecycle
      if (page.afterRender) {
        page.afterRender(param);
      }

      // Update navbar
      if (App.components.Navbar) {
        // Journey maps to profile in the navbar
        const navRoute = route === 'journey' ? 'profile' : route;
        App.components.Navbar.setActive(navRoute);
      }

      // Show/hide navbar for detail pages and welcome page
      const detailPages = ['goal', 'transaction', 'welcome', 'modes'];
      const navbarEl = document.getElementById('bottom-navbar');
      if (detailPages.includes(route)) {
        navbarEl.style.display = 'none';
        container.style.paddingBottom = 'calc(24px + env(safe-area-inset-bottom, 0px))';
      } else {
        navbarEl.style.display = '';
        container.style.paddingBottom = '';
      }

      // Initialize Lucide icons in new content
      if (window.lucide) {
        lucide.createIcons();
      }

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, 120);
  };

  App.navigate = function (hash) {
    window.location.hash = hash;
  };

  // ── Modal ────────────────────────────────────────────────

  App.showModal = function (html) {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    content.innerHTML = html;
    overlay.classList.remove('hidden');

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.add('active');
      });
    });

    document.body.style.overflow = 'hidden';

    // Init Lucide icons inside modal
    setTimeout(function () {
      if (window.lucide) lucide.createIcons();
    }, 60);
  };

  App.closeModal = function () {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('active');

    setTimeout(function () {
      overlay.classList.add('hidden');
      document.body.style.overflow = '';
      document.getElementById('modal-content').innerHTML = '';
    }, 300);
  };

  // ── Toast ────────────────────────────────────────────────

  App.showToast = function (message, type) {
    if (App.components.Notifications) {
      App.components.Notifications.show(message, type || 'info');
    }
  };

  // ── Formatting Utilities ─────────────────────────────────

  App.formatCurrency = function (amount) {
    const settings = DataStore.getSettings();
    const curr = CURRENCIES[settings.currency] || CURRENCIES.GHS;
    var absAmount = Math.abs(amount);
    if (curr.code === 'JPY') {
      absAmount = Math.round(absAmount * curr.rate);
    }
    var formatted = absAmount.toLocaleString('en-US', {
      minimumFractionDigits: curr.code === 'JPY' ? 0 : 2,
      maximumFractionDigits: curr.code === 'JPY' ? 0 : 2,
    });
    var sign = amount < 0 ? '-' : amount > 0 ? '+' : '';
    return sign + curr.symbol + formatted;
  };

  App.formatCurrencyPlain = function (amount) {
    const settings = DataStore.getSettings();
    const curr = CURRENCIES[settings.currency] || CURRENCIES.GHS;
    var absAmount = Math.abs(amount);
    if (curr.code === 'JPY') {
      absAmount = Math.round(absAmount * curr.rate);
    }
    var formatted = absAmount.toLocaleString('en-US', {
      minimumFractionDigits: curr.code === 'JPY' ? 0 : 2,
      maximumFractionDigits: curr.code === 'JPY' ? 0 : 2,
    });
    return curr.symbol + formatted;
  };

  App.formatDate = function (isoStr) {
    if (!isoStr) return '';
    var d = new Date(isoStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  App.formatDateShort = function (isoStr) {
    if (!isoStr) return '';
    var d = new Date(isoStr);
    var now = new Date();
    var diffMs = now - d;
    var diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7)
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  App.generateId = function () {
    return (
      Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
    );
  };

  // ── DOM Ready ────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      App.init();
    });
  } else {
    App.init();
  }
})();
