/**
 * SavvySpend — Home / Dashboard Page
 */
(function () {
  'use strict';

  window.SavvySpend = window.SavvySpend || {};
  window.SavvySpend.pages = window.SavvySpend.pages || {};

  var tips = [
    "Try the 50/30/20 rule: 50% Needs, 30% Wants, and 20% Savings.",
    "Making coffee at home can save you over GH₵1,000 a month!",
    "Review your subscriptions. Are you actually using that service?",
    "Wait 24 hours before buying non-essential items to curb impulse spending.",
    "Save automatically on payday. If you don't see it, you won't spend it!",
    "Setting a specific budget for eating out is the easiest way to save.",
    "Unsubscribe from retailer emails to reduce temptation."
  ];

  var Home = {
    render: function (param) {
      var user = DataStore.getUser();
      var game = DataStore.getGameState();
      var txns = DataStore.getTransactions();

      // Calculate total balance (sum of all transactions)
      var balance = txns.reduce(function (sum, t) { return sum + t.amount; }, 0);
      var formattedBalance = SavvySpend.formatCurrencyPlain(balance);

      // Monthly spending (sum of negative transactions this month)
      var currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
      var monthlySpent = txns
        .filter(function (t) { return t.amount < 0 && t.date.startsWith(currentMonth); })
        .reduce(function (sum, t) { return sum + Math.abs(t.amount); }, 0);
      
      var formattedSpent = SavvySpend.formatCurrencyPlain(monthlySpent);

      // Select a random tip or active mode guidance
      var settings = DataStore.getSettings();
      var activeMode = null;
      if (settings.activeModeId && settings.activeModeId !== 'none') {
        var modes = DataStore.getMoneyModes();
        activeMode = modes.find(function (m) { return m.id === settings.activeModeId; });
      }

      var tipIndex = Math.floor(Math.random() * tips.length);
      var dailyTip = activeMode ? activeMode.guidanceTip : tips[tipIndex];
      var tipTitle = activeMode ? `Mode Guidance: ${activeMode.name}` : 'Savings Tip of the Day';

      var modeBannerHtml = '';
      if (activeMode) {
        modeBannerHtml = `
          <!-- Active Money Mode Banner -->
          <div class="card p-md mb-lg flex flex-between flex-center" style="border: 1px solid var(--primary); background: var(--primary-light); cursor: pointer;" onclick="SavvySpend.navigate('#/modes')">
            <div class="flex flex-center gap-md">
              <div class="flex flex-center" style="width: 38px; height: 38px; border-radius: 50%; background: var(--primary); color: white;">
                <i data-lucide="pocket" style="width: 20px; height: 20px;"></i>
              </div>
              <div>
                <h4 class="text-xs font-bold text-primary uppercase tracking-wider mb-xs">Active Money Mode</h4>
                <p class="text-sm font-semibold text-primary-dark" style="margin: 0;">${activeMode.name}</p>
              </div>
            </div>
            <div class="flex flex-center" style="color: var(--primary);">
              <span class="text-xs font-semibold mr-xs">Manage</span>
              <i data-lucide="chevron-right" style="width: 16px; height: 16px;"></i>
            </div>
          </div>
        `;
      }

      var businessBannerHtml = '';
      if (settings.businessModeEnabled) {
        var plStats = DataStore.getBusinessPL();
        var bizProfit = plStats.netProfit;
        
        businessBannerHtml = `
          <!-- Business P&L Dashboard Quick Banner -->
          <div class="card p-md mb-lg flex flex-between flex-center" style="border: 1px solid var(--orange); background: var(--orange-light); cursor: pointer;" onclick="SavvySpend.navigate('#/business')">
            <div class="flex flex-center gap-md">
              <div class="flex flex-center" style="width: 38px; height: 38px; border-radius: 50%; background: var(--orange); color: white;">
                <i data-lucide="briefcase" style="width: 18px; height: 18px;"></i>
              </div>
              <div>
                <h4 class="text-xs font-bold text-orange uppercase tracking-wider mb-xs" style="color: var(--orange);">Business Performance</h4>
                <p class="text-sm font-semibold mt-xxs" style="margin: 0; color: var(--text-primary);">
                  Net Profit: <strong style="color: ${bizProfit >= 0 ? 'var(--primary)' : 'var(--red)'};">${SavvySpend.formatCurrency(bizProfit)}</strong>
                </p>
              </div>
            </div>
            <div class="flex flex-center" style="color: var(--orange);">
              <span class="text-xs font-semibold mr-xs">Hub</span>
              <i data-lucide="chevron-right" style="width: 16px; height: 16px;"></i>
            </div>
          </div>
        `;
      }

      // Recent Transactions (top 5)
      var recentTxns = txns.slice(0, 5);
      var txnsHtml = '';
      
      if (recentTxns.length === 0) {
        txnsHtml = `<div class="text-center py-lg"><span class="empty-state-pulse"><i data-lucide="inbox" style="width: 32px; height: 32px; stroke: var(--text-tertiary); margin: 0 auto 8px; display: block;"></i></span><p class="text-secondary text-xs" style="margin: 0;">No transactions logged yet.</p><div class="empty-state-dots mt-sm"><span></span><span></span><span></span></div></div>`;
      } else {
        txnsHtml = recentTxns.map(function (t) {
          var cat = window.CATEGORIES[t.category] || window.CATEGORIES.other;
          var amountClass = t.amount > 0 ? 'text-positive font-semibold' : 'font-semibold';
          var amountPrefix = t.amount > 0 ? '+' : '';
          var amountFormatted = SavvySpend.formatCurrency(t.amount);
          var dateLabel = SavvySpend.formatDateShort(t.date);

          return `
            <div class="transaction-item flex flex-between" data-id="${t.id}" style="cursor: pointer; padding: 12px; margin-bottom: 8px; border-bottom: 1px solid var(--border-light); border-radius: var(--radius-sm); transition: background-color 0.2s;">
              <div class="flex flex-center gap-md">
                <div class="transaction-icon flex flex-center" style="width: 40px; height: 40px; border-radius: var(--radius-full); background: var(--bg-secondary); color: ${cat.color};">
                  <i data-lucide="${cat.icon}" style="width: 20px; height: 20px;"></i>
                </div>
                <div>
                  <h4 class="text-sm font-semibold" style="margin: 0;">${t.merchant}</h4>
                  <span class="text-xs text-secondary">${cat.name} • ${dateLabel}</span>
                </div>
              </div>
              <div class="${amountClass}">
                ${amountFormatted}
              </div>
            </div>
          `;
        }).join('');
      }

      // XP Progress Percentage
      var xpPct = Math.round((game.xp / game.xpToNextLevel) * 100);

      return `
        <!-- Pull-to-refresh indicator -->
        <div class="ptr-indicator" id="ptr-indicator">
          <span class="ptr-spinner"></span> Pull to refresh
        </div>

        <!-- App Header -->
        <header class="app-header flex flex-between mt-sm mb-md">
          <div class="flex flex-center gap-md" style="cursor: pointer;" onclick="SavvySpend.navigate('#/profile')">
            <img class="avatar avatar-sm" src="${user.avatarUrl}" alt="${user.name}">
            <div>
              <span class="text-xs text-secondary">Welcome back</span>
              <h3 class="text-sm font-bold" style="margin: 0;">Hi, ${user.name.split(' ')[0]}!</h3>
            </div>
          </div>
          <button class="btn-icon" id="btn-bell" style="position: relative;">
            <i data-lucide="bell"></i>
            <span class="pulse-indicator" style="position: absolute; top: 4px; right: 4px; width: 8px; height: 8px; background: var(--red); border-radius: 50%;"></span>
          </button>
        </header>

        <!-- Balance Card (Fintech Gradient Card) -->
        <div class="card balance-card-shimmer balance-card-glow bg-primary text-white p-lg mb-lg" style="background: linear-gradient(135deg, var(--primary-dark), var(--primary)); border: none; box-shadow: var(--shadow-lg);">
          <span class="text-xs text-white-50 uppercase tracking-wider font-semibold">Total Balance</span>
          <h1 class="text-3xl font-extrabold mt-xs mb-md" id="home-balance-display" style="letter-spacing: -1px;" data-value="${balance}">${formattedBalance}</h1>
          <div class="flex flex-between mt-md border-top pt-md" style="border-color: rgba(255,255,255,0.15);">
            <div>
              <span class="text-xs text-white-50">Monthly Spent</span>
              <h4 class="text-sm font-bold mt-xs">${formattedSpent}</h4>
            </div>
            <div class="text-right">
              <span class="text-xs text-white-50">Active Streak</span>
              <h4 class="text-sm font-bold mt-xs flex flex-center gap-xs justify-end" style="color: #FEE2E2;">
                <span class="flame-icon"><i data-lucide="flame" style="width: 14px; height: 14px; fill: #EF4444; stroke: #EF4444;"></i></span>
                ${game.streak} Days
              </h4>
            </div>
          </div>
        </div>

        ${modeBannerHtml}
        ${businessBannerHtml}

        <!-- Quick Actions Grid -->
        <div class="quick-actions flex gap-md mb-lg reveal-scale reveal-d1">
          <button class="btn btn-primary flex flex-center flex-column gap-xs p-md" id="action-add-txn" style="flex: 1; border-radius: var(--radius-md); height: 72px;">
            <i data-lucide="plus"></i>
            <span class="text-xs">Add Cash</span>
          </button>
          <button class="btn btn-outline flex flex-center flex-column gap-xs p-md" id="action-set-bud" style="flex: 1; border-radius: var(--radius-md); height: 72px; background: var(--bg-card);">
            <i data-lucide="wallet" style="color: var(--primary);"></i>
            <span class="text-xs">Set Budget</span>
          </button>
          <button class="btn btn-outline flex flex-center flex-column gap-xs p-md" id="action-new-goal" style="flex: 1; border-radius: var(--radius-md); height: 72px; background: var(--bg-card);">
            <i data-lucide="target" style="color: var(--purple);"></i>
            <span class="text-xs">New Goal</span>
          </button>
        </div>

        <!-- Gamification Progress Card -->
        <div class="card p-md mb-lg flex flex-column gap-sm reveal reveal-d2" style="cursor: pointer; background: linear-gradient(135deg, var(--bg-card), var(--bg-secondary)); border: 1px solid var(--border);" onclick="SavvySpend.navigate('#/journey')">
          <div class="flex flex-between">
            <div class="flex flex-center gap-xs">
              <i data-lucide="zap" style="color: var(--orange); fill: var(--orange); width: 18px; height: 18px;"></i>
              <span class="text-xs font-bold uppercase tracking-wider text-secondary">Level ${game.level} Journey</span>
            </div>
            <span class="text-xs font-semibold text-secondary">${game.xp} / ${game.xpToNextLevel} XP</span>
          </div>
          <div class="progress-bar w-full" style="height: 10px; background: var(--border);">
            <div class="progress-bar-fill-animated" data-target-width="${xpPct}%" style="background: linear-gradient(90deg, var(--orange), var(--primary)); height: 100%; border-radius: var(--radius-full);"></div>
          </div>
          <div class="flex flex-between text-xs text-secondary mt-xs">
            <span>Rank #${game.rank} globally</span>
            <span class="flex flex-center gap-xs">Trophy Room <i data-lucide="chevron-right" style="width: 12px; height: 12px;"></i></span>
          </div>
        </div>

        <!-- Recent Transactions Section -->
        <div class="section-header flex flex-between mb-sm reveal-left">
          <h3 class="section-title text-base font-bold">Recent Activity</h3>
          <button class="section-action btn-link text-xs font-semibold text-primary" id="btn-see-all-tx">See All</button>
        </div>
        <div class="transaction-list" id="recent-transactions-container" style="border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden;">
          ${txnsHtml}
        </div>

        <div class="card p-md mb-md insight-card" style="border-left: 4px solid var(--primary); background: var(--bg-secondary);">
          <div class="flex gap-md flex-center">
            <div class="flex flex-center" style="width: 36px; height: 36px; border-radius: 50%; background: var(--orange-light); color: var(--orange); flex-shrink: 0;">
              <i data-lucide="lightbulb" style="width: 20px; height: 20px;"></i>
            </div>
            <div>
              <h4 class="text-xs font-bold text-secondary uppercase tracking-wider mb-xs">${tipTitle}</h4>
              <p class="text-sm text-primary-text font-medium" style="margin: 0; line-height: 1.4;">${dailyTip}</p>
            </div>
          </div>
        </div>
      `;
    },

    afterRender: function () {
      // Pull-to-refresh
      var ptrIndicator = document.getElementById('ptr-indicator');
      var pageContainer = document.getElementById('page-container');
      var ptrStartY = 0;
      var ptrThreshold = 60;
      var ptrActive = false;

      if (pageContainer && ptrIndicator) {
        pageContainer.addEventListener('touchstart', function (e) {
          if (pageContainer.scrollTop === 0 && e.touches.length === 1) {
            ptrStartY = e.touches[0].clientY;
            ptrActive = true;
          }
        }, { passive: true });

        pageContainer.addEventListener('touchmove', function (e) {
          if (!ptrActive) return;
          var diff = e.touches[0].clientY - ptrStartY;
          if (diff > 20 && pageContainer.scrollTop === 0) {
            ptrIndicator.classList.add('ptr-visible');
            ptrIndicator.style.transform = 'translateY(' + Math.min(diff * 0.4, ptrThreshold) + 'px)';
          }
        }, { passive: true });

        pageContainer.addEventListener('touchend', function () {
          if (ptrIndicator.classList.contains('ptr-visible')) {
            ptrIndicator.classList.add('ptr-refreshing');
            ptrIndicator.style.transform = 'translateY(0)';
            // Refresh the page
            setTimeout(function () {
              SavvySpend.handleRoute();
              SavvySpend.showToast('Dashboard refreshed!', 'success');
            }, 500);
          }
          ptrActive = false;
          ptrIndicator.classList.remove('ptr-visible');
          ptrIndicator.style.transform = '';
        }, { passive: true });
      }

      // Animate balance number
      var balanceEl = document.getElementById('home-balance-display');
      if (balanceEl) {
        var rawVal = parseFloat(balanceEl.getAttribute('data-value')) || 0;
        var settings = DataStore.getSettings();
        var curr = window.CURRENCIES[settings.currency] || window.CURRENCIES.GHS;
        SavvySpend.animateNumber(balanceEl, rawVal, 800, curr.symbol);
      }

      // Add card entrance animations
      var cards = document.querySelectorAll('#page-container .card');
      cards.forEach(function (card, i) {
        card.classList.add('card-animate');
        if (i < 6) card.classList.add('stagger-delay-' + (i + 1));
      });
      // Bind bell click
      var bell = document.getElementById('btn-bell');
      if (bell) {
        bell.addEventListener('click', function () {
          // Add bell ring animation
          bell.classList.add('bell-ring');
          setTimeout(function () { bell.classList.remove('bell-ring'); }, 800);

          // Hide notification indicator dot
          var ind = bell.querySelector('.pulse-indicator');
          if (ind) ind.style.display = 'none';

          if (SavvySpend.components.Notifications) {
            SavvySpend.components.Notifications.show('No new alerts. Your spending is looking healthy!', 'info');
            SavvySpend.components.Notifications.checkBudgetAlerts();
          }
        });
      }

      // Bind Quick Actions
      document.getElementById('action-add-txn').addEventListener('click', function () {
        if (SavvySpend.components.Modals) {
          SavvySpend.components.Modals.addTransaction();
        }
      });
      document.getElementById('action-set-bud').addEventListener('click', function () {
        if (SavvySpend.components.Modals) {
          SavvySpend.components.Modals.setWeeklyBudget();
        }
      });
      document.getElementById('action-new-goal').addEventListener('click', function () {
        if (SavvySpend.components.Modals) {
          SavvySpend.components.Modals.addGoal();
        }
      });

      // See all transactions goes to analytics page or filters recent transactions
      document.getElementById('btn-see-all-tx').addEventListener('click', function () {
        SavvySpend.navigate('#/analytics');
      });

      // Bind transaction detail click
      var items = document.querySelectorAll('.transaction-item');
      items.forEach(function (item) {
        item.addEventListener('click', function () {
          var id = item.getAttribute('data-id');
          SavvySpend.navigate('#/transaction/' + id);
        });
        
        // Add hover background class
        item.addEventListener('mouseenter', function () {
          item.style.backgroundColor = 'var(--bg-secondary)';
        });
        item.addEventListener('mouseleave', function () {
          item.style.backgroundColor = '';
        });
      });

      // Add button micro-interactions to quick actions
      var quickBtns = document.querySelectorAll('.quick-actions .btn');
      quickBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          btn.classList.add('icon-pulse');
          setTimeout(function () { btn.classList.remove('icon-pulse'); }, 300);
        });
      });
    },

    destroy: function () {
      // Nothing to cleanup specifically
    }
  };

  window.SavvySpend.pages.Home = Home;
})();
