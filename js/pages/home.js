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

      // Recent Transactions (top 5)
      var recentTxns = txns.slice(0, 5);
      var txnsHtml = '';
      
      if (recentTxns.length === 0) {
        txnsHtml = `<p class="text-center text-secondary py-md">No transactions logged yet.</p>`;
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
        <div class="card bg-primary text-white p-lg mb-lg" style="background: linear-gradient(135deg, var(--primary-dark), var(--primary)); border: none; box-shadow: var(--shadow-lg);">
          <span class="text-xs text-white-50 uppercase tracking-wider font-semibold">Total Balance</span>
          <h1 class="text-3xl font-extrabold mt-xs mb-md" style="letter-spacing: -1px;">${formattedBalance}</h1>
          <div class="flex flex-between mt-md border-top pt-md" style="border-color: rgba(255,255,255,0.15);">
            <div>
              <span class="text-xs text-white-50">Monthly Spent</span>
              <h4 class="text-sm font-bold mt-xs">${formattedSpent}</h4>
            </div>
            <div class="text-right">
              <span class="text-xs text-white-50">Active Streak</span>
              <h4 class="text-sm font-bold mt-xs flex flex-center gap-xs justify-end" style="color: #FEE2E2;">
                <i data-lucide="flame" style="width: 14px; height: 14px; fill: #EF4444; stroke: #EF4444;"></i>
                ${game.streak} Days
              </h4>
            </div>
          </div>
        </div>

        ${modeBannerHtml}

        <!-- Quick Actions Grid -->
        <div class="quick-actions flex gap-md mb-lg">
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
        <div class="card p-md mb-lg flex flex-column gap-sm" style="cursor: pointer; background: linear-gradient(135deg, var(--bg-card), var(--bg-secondary)); border: 1px solid var(--border);" onclick="SavvySpend.navigate('#/journey')">
          <div class="flex flex-between">
            <div class="flex flex-center gap-xs">
              <i data-lucide="zap" style="color: var(--orange); fill: var(--orange); width: 18px; height: 18px;"></i>
              <span class="text-xs font-bold uppercase tracking-wider text-secondary">Level ${game.level} Journey</span>
            </div>
            <span class="text-xs font-semibold text-secondary">${game.xp} / ${game.xpToNextLevel} XP</span>
          </div>
          <div class="progress-bar w-full" style="height: 10px; background: var(--border);">
            <div class="progress-bar-fill xp-fill" style="width: ${xpPct}%; background: linear-gradient(90deg, var(--orange), var(--primary)); height: 100%; border-radius: var(--radius-full);"></div>
          </div>
          <div class="flex flex-between text-xs text-secondary mt-xs">
            <span>Rank #${game.rank} globally</span>
            <span class="flex flex-center gap-xs">Trophy Room <i data-lucide="chevron-right" style="width: 12px; height: 12px;"></i></span>
          </div>
        </div>

        <!-- Recent Transactions Section -->
        <div class="section-header flex flex-between mb-sm">
          <h3 class="section-title text-base font-bold">Recent Activity</h3>
          <button class="section-action btn-link text-xs font-semibold text-primary" id="btn-see-all-tx">See All</button>
        </div>
        <div class="card p-sm mb-lg" id="recent-transactions-container" style="border: 1px solid var(--border);">
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
      // Bind bell click
      var bell = document.getElementById('btn-bell');
      if (bell) {
        bell.addEventListener('click', function () {
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
          SavvySpend.components.Modals.addBudget();
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
    },

    destroy: function () {
      // Nothing to cleanup specifically
    }
  };

  window.SavvySpend.pages.Home = Home;
})();
