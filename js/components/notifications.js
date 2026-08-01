/**
 * SavvySpend — Toast Notifications & Budget Alerts Component
 */
(function () {
  'use strict';

  window.SavvySpend = window.SavvySpend || {};
  window.SavvySpend.components = window.SavvySpend.components || {};

  var Notifications = {
    show: function (message, type) {
      var container = document.getElementById('toast-container');
      if (!container) return;

      type = type || 'info'; // success, warning, error, info
      
      var toast = document.createElement('div');
      toast.className = 'toast toast-' + type + ' flex flex-center gap-sm';
      
      var icon = 'info';
      if (type === 'success') icon = 'check-circle';
      else if (type === 'warning') icon = 'alert-triangle';
      else if (type === 'error') icon = 'x-circle';

      toast.innerHTML = `
        <i data-lucide="${icon}"></i>
        <span class="toast-message">${message}</span>
      `;

      container.appendChild(toast);
      
      // Init Lucide icon
      if (window.lucide) {
        lucide.createIcons();
      }

      // Add active class for transition
      requestAnimationFrame(function () {
        toast.classList.add('active');
      });

      // Auto remove after 3s
      setTimeout(function () {
        toast.classList.remove('active');
        // Wait for slide-out transition
        setTimeout(function () {
          if (toast.parentNode === container) {
            container.removeChild(toast);
          }
        }, 300);
      }, 3000);
    },

    checkBudgetAlerts: function () {
      var budgets = DataStore.getBudgets();
      var warnedBudgets = JSON.parse(localStorage.getItem('ss_warned_budgets') || '{}');
      var updated = false;

      // Category Budgets check
      budgets.forEach(function (b) {
        var pct = (b.spent / b.limit) * 100;
        var budgetKey = b.id + '_' + b.spent; // unique to current spent state

        if (pct >= 100) {
          if (!warnedBudgets[budgetKey + '_100']) {
            Notifications.show(`You have exceeded your ${b.name} budget!`, 'error');
            warnedBudgets[budgetKey + '_100'] = true;
            updated = true;
          }
        } else if (pct >= 80) {
          if (!warnedBudgets[budgetKey + '_80']) {
            Notifications.show(`You have spent ${Math.round(pct)}% of your ${b.name} budget.`, 'warning');
            warnedBudgets[budgetKey + '_80'] = true;
            updated = true;
          }
        }
      });

      // Weekly Budget check
      var wb = DataStore.getWeeklyBudget();
      if (wb && wb.limit > 0 && wb.startDate) {
        var txns = DataStore.getTransactions();
        var cycleSpent = txns
          .filter(function (t) {
            return !t.isBusiness && t.amount < 0 && t.date >= wb.startDate;
          })
          .reduce(function (sum, t) { return sum + Math.abs(t.amount); }, 0);

        var weeklyKey = 'weekly_' + wb.limit + '_' + cycleSpent;
        var weeklyPct = (cycleSpent / wb.limit) * 100;

        if (weeklyPct >= 100) {
          if (!warnedBudgets[weeklyKey + '_100']) {
            Notifications.show(`You have exceeded your weekly spending budget!`, 'error');
            warnedBudgets[weeklyKey + '_100'] = true;
            updated = true;
          }
        } else if (weeklyPct >= 80) {
          if (!warnedBudgets[weeklyKey + '_80']) {
            Notifications.show(`You have spent ${Math.round(weeklyPct)}% of your weekly spending budget.`, 'warning');
            warnedBudgets[weeklyKey + '_80'] = true;
            updated = true;
          }
        }

        // Today's allowance check
        var todayStr = new Date().toISOString().split('T')[0];
        var spentToday = txns
          .filter(function (t) { return !t.isBusiness && t.amount < 0 && t.date === todayStr; })
          .reduce(function (sum, t) { return sum + Math.abs(t.amount); }, 0);

        var start = new Date(wb.startDate);
        var today = new Date(todayStr);
        var currentDayIndex = Math.floor((today - start) / 86400000) + 1;
        if (currentDayIndex < 1) currentDayIndex = 1;
        if (currentDayIndex > 7) currentDayIndex = 7;
        var daysLeft = 8 - currentDayIndex;

        var spentBeforeToday = txns
          .filter(function (t) { return !t.isBusiness && t.amount < 0 && t.date >= wb.startDate && t.date < todayStr; })
          .reduce(function (sum, t) { return sum + Math.abs(t.amount); }, 0);

        var remainingWeeklyAllowance = Math.max(0, wb.limit - spentBeforeToday);
        var proposedDailyLimit = remainingWeeklyAllowance / daysLeft;
        
        if (proposedDailyLimit > 0 && spentToday >= proposedDailyLimit) {
          var todayKey = 'weekly_today_' + Math.round(proposedDailyLimit) + '_' + spentToday;
          if (!warnedBudgets[todayKey]) {
            Notifications.show(`You have exceeded today's proposed daily spending allowance!`, 'warning');
            warnedBudgets[todayKey] = true;
            updated = true;
          }
        }
      }

      if (updated) {
        localStorage.setItem('ss_warned_budgets', JSON.stringify(warnedBudgets));
      }
    }
  };

  window.SavvySpend.components.Notifications = Notifications;
})();
