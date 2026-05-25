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

      if (updated) {
        localStorage.setItem('ss_warned_budgets', JSON.stringify(warnedBudgets));
      }
    }
  };

  window.SavvySpend.components.Notifications = Notifications;
})();
