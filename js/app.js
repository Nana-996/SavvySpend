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

      // Never touch body overflow when a modal is open
      var modalOverlay = document.getElementById('modal-overlay');
      var modalIsOpen = modalOverlay && !modalOverlay.classList.contains('hidden');

      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        // Clear any scale adjustments on mobile/simulated devices
        shellEl.style.transform = '';
        shellEl.style.transformOrigin = '';
        shellEl.style.width = '';
        shellEl.style.height = '';
        if (!modalIsOpen) {
          document.body.style.overflow = '';
        }
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
        if (!modalIsOpen) {
          document.body.style.overflow = '';
        }
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
      var height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      document.documentElement.style.setProperty('--app-height', height + 'px');
      
      // Force window scroll back to 0,0 to prevent any automatic viewport shifts
      // BUT only if no modal is open (we don't want to fight modal scrolling)
      var overlay = document.getElementById('modal-overlay');
      var modalOpen = overlay && !overlay.classList.contains('hidden');
      if (!modalOpen) {
        window.scrollTo(0, 0);
      }
    }

    // No-op: we no longer manipulate overlay position with JS.
    // The CSS fixed position handles everything correctly.
    App.updateModalOverlayPosition = function () {};

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
      window.visualViewport.addEventListener('scroll', updateViewportHeight);
    }
    
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);
    
    // Prevent document/layout viewport from scrolling (diagonal shifts)
    // BUT allow scroll when a modal is open (so the modal-sheet can scroll)
    window.addEventListener('scroll', function () {
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
    });

    // Initial call to set the height
    updateViewportHeight();

    // When an input inside the modal is focused, scroll it into view
    // WITHIN the modal-sheet scroll container, not the window.
    document.addEventListener('focusin', function (e) {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) {
        setTimeout(function () {
          // Keep window locked
          window.scrollTo(0, 0);
          
          // Scroll the modal-sheet so the focused input is visible
          var sheet = e.target.closest('.modal-sheet');
          if (sheet) {
            var inputRect = e.target.getBoundingClientRect();
            var sheetRect = sheet.getBoundingClientRect();
            // If the input is below the visible area of the sheet
            if (inputRect.bottom > sheetRect.bottom - 20) {
              sheet.scrollTop += (inputRect.bottom - sheetRect.bottom + 60);
            }
            // If the input is above the visible area of the sheet
            if (inputRect.top < sheetRect.top + 20) {
              sheet.scrollTop -= (sheetRect.top - inputRect.top + 60);
            }
          }
        }, 100);
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

    // Init ambient particles
    App.initParticles();
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
      modes: 'MoneyModes',
      business: 'BusinessHub'
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

      // Global post-render animations
      setTimeout(function () {
        App.observeRevealElements();
        App.animateProgressBars();
        App.initBalanceCardEffects();
      }, 50);

      // Update navbar
      if (App.components.Navbar) {
        // Journey maps to profile in the navbar
        const navRoute = route === 'journey' ? 'profile' : route;
        App.components.Navbar.setActive(navRoute);
      }

      // Show/hide navbar for detail pages and welcome page
      const detailPages = ['goal', 'transaction', 'welcome', 'modes', 'business'];
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

      // Scroll page container to top (smooth)
      container.scrollTop = 0;
      window.scrollTo({ top: 0, behavior: 'instant' });

      // Add stagger-in animation to list containers
      var staggerTargets = container.querySelectorAll('.transaction-list, .budgets-list, .goals-list, .invoices-list, .clients-list');
      staggerTargets.forEach(function (el) {
        el.classList.add('stagger-in');
      });
    }, 120);
  };

  App.navigate = function (hash) {
    window.location.hash = hash;
  };

  // ── Modal ────────────────────────────────────────────────

  App.showModal = function (html) {
    var overlay = document.getElementById('modal-overlay');
    var content = document.getElementById('modal-content');
    var sheet = overlay.querySelector('.modal-sheet');
    content.innerHTML = html;
    overlay.classList.remove('hidden');

    // Reset scroll position of the sheet to the top
    if (sheet) sheet.scrollTop = 0;

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
    var overlay = document.getElementById('modal-overlay');
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

  // ── Custom Dialog (replaces native alert/confirm) ────────

  App.showDialog = function (options) {
    var opts = options || {};
    var title = opts.title || '';
    var message = opts.message || '';
    var type = opts.type || 'alert';
    var danger = opts.danger || false;
    var confirmText = opts.confirmText || (type === 'alert' ? 'OK' : 'Confirm');
    var cancelText = opts.cancelText || 'Cancel';
    var placeholder = opts.placeholder || '';
    var defaultValue = opts.defaultValue || '';

    var html = '<div class="dialog-container">' +
      '<div class="dialog-backdrop" id="dialog-backdrop"></div>' +
      '<div class="dialog-box">' +
      (title ? '<h3 class="dialog-title">' + SavvySpend.escapeHtml(title) + '</h3>' : '') +
      (message ? '<p class="dialog-message">' + message + '</p>' : '') +
      (type === 'prompt' ? '<input class="form-input dialog-prompt-input" type="text" placeholder="' + SavvySpend.escapeHtml(placeholder) + '" value="' + SavvySpend.escapeHtml(defaultValue) + '">' : '') +
      '<div class="dialog-actions">' +
      (type !== 'alert' ? '<button class="btn btn-outline dialog-cancel-btn">' + SavvySpend.escapeHtml(cancelText) + '</button>' : '') +
      '<button class="btn ' + (danger ? 'btn-danger' : 'btn-primary') + ' dialog-confirm-btn">' + SavvySpend.escapeHtml(confirmText) + '</button>' +
      '</div></div></div>';

    var wrapper = document.createElement('div');
    wrapper.id = 'app-dialog-wrapper';
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);

    requestAnimationFrame(function () {
      wrapper.classList.add('active');
    });

    if (type === 'prompt') {
      setTimeout(function () {
        var inp = wrapper.querySelector('.dialog-prompt-input');
        if (inp) inp.focus();
      }, 100);
    }

    function closeDialog() {
      wrapper.classList.remove('active');
      setTimeout(function () {
        if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
      }, 250);
    }

    var confirmBtn = wrapper.querySelector('.dialog-confirm-btn');
    var cancelBtn = wrapper.querySelector('.dialog-cancel-btn');
    var backdrop = wrapper.querySelector('#dialog-backdrop');

    confirmBtn.addEventListener('click', function () {
      var value = null;
      if (type === 'prompt') {
        value = wrapper.querySelector('.dialog-prompt-input').value;
      }
      closeDialog();
      if (opts.onConfirm) opts.onConfirm(value);
    });

    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        closeDialog();
        if (opts.onCancel) opts.onCancel();
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', function () {
        closeDialog();
        if (opts.onCancel) opts.onCancel();
      });
    }
  };

  // ── Animated Counter Utility ──────────────────────────────

  App.animateNumber = function (element, targetValue, duration, prefix, suffix) {
    prefix = prefix || '';
    suffix = suffix || '';
    duration = duration || 600;
    var startValue = 0;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = startValue + (targetValue - startValue) * eased;
      if (typeof targetValue === 'number' && targetValue % 1 !== 0) {
        element.textContent = prefix + current.toFixed(2) + suffix;
      } else {
        element.textContent = prefix + Math.round(current).toLocaleString() + suffix;
      }
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  };

  // ── Haptic-like Visual Feedback ────────────────────────────

  App.addRipple = function (element) {
    element.addEventListener('pointerdown', function (e) {
      var rect = element.getBoundingClientRect();
      var ripple = document.createElement('span');
      ripple.className = 'touch-ripple';
      ripple.style.left = (e.clientX - rect.left) + 'px';
      ripple.style.top = (e.clientY - rect.top) + 'px';
      element.style.position = element.style.position || 'relative';
      element.style.overflow = 'hidden';
      element.appendChild(ripple);
      setTimeout(function () {
        if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
      }, 600);
    });
  };

  // ── Scroll Reveal Observer ──────────────────────────────────

  App.initScrollReveal = function () {
    if (App._revealObserver) return App._revealObserver;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });
    App._revealObserver = observer;
    return observer;
  };

  App.observeRevealElements = function () {
    var observer = App.initScrollReveal();
    var selectors = ['.reveal', '.reveal-left', '.reveal-right', '.reveal-scale'];
    selectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (!el.classList.contains('reveal-visible')) {
          observer.observe(el);
        }
      });
    });
  };

  // ── Animated Progress Bars ─────────────────────────────────

  App.animateProgressBars = function () {
    var bars = document.querySelectorAll('.progress-bar-fill-animated');
    if (!bars.length) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var targetWidth = entry.target.getAttribute('data-target-width');
          if (targetWidth) {
            requestAnimationFrame(function () {
              entry.target.style.width = targetWidth;
              entry.target.classList.add('progress-filled');
            });
          }
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    bars.forEach(function (bar) { observer.observe(bar); });
  };

  // ── Confetti Celebration ──────────────────────────────────

  App.fireConfetti = function (options) {
    options = options || {};
    var canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var colors = options.colors || ['#3d8279', '#705fa4', '#c88242', '#c25953', '#4b7ca7', '#F59E0B', '#EF4444', '#10B981'];
    var particles = [];
    var count = options.count || 80;
    var originX = options.x || canvas.width / 2;
    var originY = options.y || canvas.height / 3;

    for (var i = 0; i < count; i++) {
      particles.push({
        x: originX,
        y: originY,
        vx: (Math.random() - 0.5) * 15,
        vy: Math.random() * -12 - 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 3,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        gravity: 0.3 + Math.random() * 0.2,
        drag: 0.98 + Math.random() * 0.015,
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
        opacity: 1
      });
    }

    var frame = 0;
    var maxFrames = 120;
    function animate() {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var alive = false;
      particles.forEach(function (p) {
        if (p.opacity <= 0) return;
        alive = true;
        p.vy += p.gravity;
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        if (frame > maxFrames * 0.6) p.opacity -= 0.02;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
      if (alive && frame < maxFrames) {
        requestAnimationFrame(animate);
      } else {
        canvas.remove();
      }
    }
    requestAnimationFrame(animate);
  };

  // ── Floating Ambient Particles ─────────────────────────────

  App.initParticles = function () {
    var existing = document.getElementById('ambient-particles');
    if (existing) return;
    var container = document.createElement('div');
    container.id = 'ambient-particles';
    container.className = 'particles-container';
    var colors = ['rgba(61,130,121,0.12)', 'rgba(112,95,164,0.08)', 'rgba(200,130,66,0.08)'];
    for (var i = 0; i < 8; i++) {
      var p = document.createElement('div');
      p.className = 'particle';
      var size = 4 + Math.random() * 12;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.left = Math.random() * 100 + '%';
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.animationDuration = (15 + Math.random() * 25) + 's';
      p.style.animationDelay = (Math.random() * 15) + 's';
      container.appendChild(p);
    }
    document.body.appendChild(container);
  };

  // ── Button Loading State ──────────────────────────────────

  App.setButtonLoading = function (btn, loading) {
    if (!btn) return;
    if (loading) {
      btn.classList.add('btn-loading');
      btn.setAttribute('disabled', 'true');
    } else {
      btn.classList.remove('btn-loading');
      btn.removeAttribute('disabled');
    }
  };

  // ── Balance Card Shimmer Init ──────────────────────────────

  App.initBalanceCardEffects = function () {
    var card = document.querySelector('.balance-card-shimmer');
    if (!card) return;
    // 3D tilt on pointermove
    card.addEventListener('pointermove', function (e) {
      var rect = card.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = 'perspective(800px) rotateY(' + (x * 6) + 'deg) rotateX(' + (-y * 6) + 'deg)';
    });
    card.addEventListener('pointerleave', function () {
      card.style.transform = '';
    });
  };

  // ── Swipe Gesture Helper ──────────────────────────────────

  App.initSwipeable = function (containerSelector, onDelete) {
    var container = document.querySelector(containerSelector);
    if (!container) return;
    var items = container.querySelectorAll('.swipeable-item');
    items.forEach(function (item) {
      var content = item.querySelector('.swipeable-content');
      if (!content) return;
      var startX = 0, currentX = 0, isDragging = false;
      var threshold = 80;

      content.addEventListener('touchstart', function (e) {
        startX = e.touches[0].clientX;
        isDragging = true;
        item.classList.add('swiping');
      }, { passive: true });

      content.addEventListener('touchmove', function (e) {
        if (!isDragging) return;
        currentX = e.touches[0].clientX - startX;
        if (currentX > 0) currentX = 0; // only swipe left
        if (currentX < -150) currentX = -150;
        content.style.transform = 'translateX(' + currentX + 'px)';
      }, { passive: true });

      content.addEventListener('touchend', function () {
        isDragging = false;
        item.classList.remove('swiping');
        if (currentX < -threshold) {
          content.style.transform = 'translateX(-80px)';
          // Show delete button behind
          var actions = item.querySelector('.swipe-actions-right');
          if (!actions) {
            actions = document.createElement('div');
            actions.className = 'swipe-actions swipe-actions-right';
            actions.innerHTML = '<button class="swipe-action-btn"><i data-lucide="trash-2" style="width:18px;height:18px;"></i></button>';
            item.insertBefore(actions, content);
            actions.querySelector('.swipe-action-btn').addEventListener('click', function () {
              var id = item.getAttribute('data-id');
              content.style.transform = 'translateX(-100%)';
              content.style.opacity = '0';
              setTimeout(function () {
                if (onDelete) onDelete(id, item);
              }, 300);
            });
            if (window.lucide) lucide.createIcons();
          }
          actions.style.opacity = '1';
        } else {
          content.style.transform = '';
          var actions = item.querySelector('.swipe-actions-right');
          if (actions) actions.style.opacity = '0';
        }
        currentX = 0;
      });
    });
  };

  // ── Global Override: Replace native alert/confirm ─────────

  window.alert = function (msg) {
    App.showDialog({
      title: 'SavvySpend',
      message: String(msg).replace(/\n/g, '<br>'),
      type: 'alert'
    });
  };

  window.confirm = function (msg) {
    // Since dialogs are async, we use a promise-like approach
    // For synchronous confirm calls, we show the dialog and handle via callback
    // This works because most confirm() usages are inside event handlers
    var result = false;
    App.showDialog({
      title: 'Confirm',
      message: String(msg),
      type: 'confirm',
      danger: String(msg).toLowerCase().indexOf('delete') !== -1 || String(msg).toLowerCase().indexOf('caution') !== -1,
      confirmText: 'Yes',
      cancelText: 'No',
      onConfirm: function () {
        // Trigger the original action
        if (window._confirmCallback) {
          window._confirmCallback(true);
          window._confirmCallback = null;
        }
      },
      onCancel: function () {
        if (window._confirmCallback) {
          window._confirmCallback(false);
          window._confirmCallback = null;
        }
      }
    });
    // Return false to prevent immediate execution; the callback handles the action
    return false;
  };

  // Helper: wraps confirm logic with callback pattern
  App.confirmAction = function (message, onConfirm, onCancel) {
    App.showDialog({
      title: 'Confirm',
      message: message,
      type: 'confirm',
      danger: message.toLowerCase().indexOf('delete') !== -1 || message.toLowerCase().indexOf('caution') !== -1 || message.toLowerCase().indexOf('erase') !== -1,
      confirmText: 'Yes',
      cancelText: 'No',
      onConfirm: onConfirm,
      onCancel: onCancel || function () {}
    });
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

  App.escapeHtml = function (str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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
