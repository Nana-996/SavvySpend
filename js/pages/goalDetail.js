/**
 * SavvySpend — Goal Detail Page
 */
(function () {
  'use strict';

  window.SavvySpend = window.SavvySpend || {};
  window.SavvySpend.pages = window.SavvySpend.pages || {};

  var GoalDetail = {
    render: function (goalId) {
      var goal = DataStore.getGoal(goalId);
      if (!goal) {
        return `
          <div class="page-header mt-sm mb-lg flex flex-center gap-md">
            <button class="btn-icon" onclick="SavvySpend.navigate('#/goals')"><i data-lucide="arrow-left"></i></button>
            <h2 class="page-title text-base font-bold">Goal Not Found</h2>
          </div>
          <div class="card p-lg text-center">
            <p class="text-secondary text-sm">The selected savings goal does not exist.</p>
            <button class="btn btn-primary mt-md" onclick="SavvySpend.navigate('#/goals')">Back to Goals</button>
          </div>
        `;
      }

      var pct = Math.round((goal.current / goal.target) * 100);
      var fillPct = Math.min(pct, 100);
      var remaining = Math.max(0, goal.target - goal.current);
      var deadlineFormatted = SavvySpend.formatDate(goal.deadline);

      var priorityBadgeHtml = '';
      if (goal.priority) {
        var badgeColor = '#9CA3AF'; // low / default
        var badgeText = 'Low';
        var iconName = 'clock';
        if (goal.priority === 'high') {
          badgeColor = '#EF4444'; // red
          badgeText = 'High Priority';
          iconName = 'flame';
        } else if (goal.priority === 'medium') {
          badgeColor = '#F59E0B'; // orange
          badgeText = 'Medium Priority';
          iconName = 'zap';
        }
        priorityBadgeHtml = `
          <span class="status-badge flex flex-center gap-xs px-sm py-xs" style="background: ${badgeColor}15; color: ${badgeColor}; border: 1px solid ${badgeColor}30; font-weight: 700; border-radius: var(--radius-full); font-size: 0.75rem; display: flex; align-items: center; gap: 4px;">
            <i data-lucide="${iconName}" style="width: 12px; height: 12px;"></i>
            ${badgeText}
          </span>
        `;
      }

      // Contributions list
      var contributionsHtml = '';
      if (!goal.contributions || goal.contributions.length === 0) {
        contributionsHtml = `<p class="text-center text-secondary py-md text-xs">No contributions made yet.</p>`;
      } else {
        contributionsHtml = goal.contributions.map(function (c) {
          var formattedAmount = SavvySpend.formatCurrency(c.amount);
          var formattedDate = SavvySpend.formatDate(c.date);
          var icon = c.type === 'auto' ? 'refresh-cw' : 'plus-circle';
          var typeText = c.type === 'auto' ? 'Auto Savings' : 'Manual Deposit';

          return `
            <div class="contribution-item flex flex-between py-sm" style="border-bottom: 1px solid var(--border-light);">
              <div class="flex flex-center gap-md">
                <div class="flex flex-center" style="width: 32px; height: 32px; border-radius: 50%; background: var(--bg-secondary); color: ${goal.color};">
                  <i data-lucide="${icon}" style="width: 16px; height: 16px;"></i>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-primary-text" style="margin: 0;">${typeText}</h4>
                  <span class="text-xxs text-secondary" style="font-size: 0.65rem;">${c.source} • ${formattedDate}</span>
                </div>
              </div>
              <span class="text-xs font-bold text-positive">+${formattedAmount}</span>
            </div>
          `;
        }).join('');
      }

      // Projection calculation
      var projectionText = '';
      if (goal.current >= goal.target) {
        projectionText = "Congratulations! You have fully funded this savings goal!";
      } else if (goal.contributions && goal.contributions.length > 0) {
        // Average contribution rate
        var totalCont = goal.contributions.reduce(function (sum, c) { return sum + c.amount; }, 0);
        var avgCont = totalCont / goal.contributions.length;
        var contributionsNeeded = Math.ceil(remaining / avgCont);
        projectionText = `Based on your average contribution of <strong>${SavvySpend.formatCurrencyPlain(avgCont)}</strong>, you will reach this goal in about <strong>${contributionsNeeded}</strong> more deposits!`;
      } else {
        projectionText = "Add your first contribution to see savings projections and stay on track!";
      }

      return `
        <!-- Goal Detail Header -->
        <div class="page-header mt-sm mb-lg flex flex-between flex-center">
          <div class="flex flex-center gap-md">
            <button class="btn-icon" id="btn-back-goals"><i data-lucide="arrow-left"></i></button>
            <div>
              <h2 class="page-title text-lg font-extrabold" style="margin: 0;">${goal.name}</h2>
              <span class="text-xs text-secondary">Savings Goal</span>
            </div>
          </div>
          <div style="width: 36px; height: 36px; border-radius: 50%; background: ${goal.color}15; color: ${goal.color}; display: flex; align-items: center; justify-content: center;">
            <i data-lucide="${goal.icon}" style="width: 18px; height: 18px;"></i>
          </div>
        </div>

        <!-- Goal Balance Card -->
        <div class="card p-lg mb-lg bg-card" style="border: 1px solid var(--border); box-shadow: var(--shadow-md);">
          <div class="flex flex-between flex-center mb-sm" style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span class="text-xs text-secondary uppercase font-semibold">Total Saved</span>
              <h1 class="text-3xl font-extrabold mt-xs text-primary-text" style="letter-spacing: -0.5px;">${SavvySpend.formatCurrencyPlain(goal.current)}</h1>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
              <span class="status-badge flex flex-center gap-xs px-sm py-xs" style="background: ${goal.color}15; color: ${goal.color}; font-weight: 700; border-radius: var(--radius-full); font-size: 0.75rem; display: flex; align-items: center; gap: 4px;">
                <i data-lucide="check-circle" style="width: 12px; height: 12px;"></i>
                ${pct}% Saved
              </span>
              ${priorityBadgeHtml}
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="progress-bar w-full mt-md mb-md" style="height: 10px; background: var(--bg-secondary); border-radius: var(--radius-full); overflow: hidden;">
            <div class="progress-bar-fill" style="width: ${fillPct}%; background: ${goal.color}; height: 100%; border-radius: var(--radius-full);"></div>
          </div>

          <div class="flex flex-between text-xs text-secondary">
            <span>Remaining: <strong>${SavvySpend.formatCurrencyPlain(remaining)}</strong></span>
            <span>Target: <strong>${deadlineFormatted}</strong></span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-md mb-lg">
          <button class="btn btn-primary w-full flex flex-center gap-xs" id="btn-goal-add-funds" style="background: ${goal.color}; border: none;">
            <i data-lucide="plus"></i> Add Funds
          </button>
          <button class="btn btn-outline w-full flex flex-center gap-xs text-negative" id="btn-goal-delete" style="background: var(--bg-card); border-color: var(--border);">
            <i data-lucide="x"></i> Delete Goal
          </button>
        </div>

        <!-- Savings Projections Insight -->
        <div class="card p-md mb-lg insight-card" style="border-left: 4px solid ${goal.color}; background: var(--bg-secondary);">
          <div class="flex gap-md">
            <i data-lucide="trending-up" style="width: 20px; height: 20px; color: ${goal.color};"></i>
            <div>
              <h4 class="text-xs font-bold text-secondary uppercase tracking-wider mb-xs">Forecast</h4>
              <p class="text-sm text-primary-text font-medium" style="margin: 0; line-height: 1.4;">${projectionText}</p>
            </div>
          </div>
        </div>

        <!-- Recent Contributions List -->
        <div class="mb-xl">
          <h3 class="section-title text-sm font-bold text-secondary uppercase tracking-wider mb-sm">Contribution History</h3>
          <div class="card p-md bg-card" style="border: 1px solid var(--border);">
            ${contributionsHtml}
          </div>
        </div>
      `;
    },

    afterRender: function (goalId) {
      var goal = DataStore.getGoal(goalId);
      if (!goal) return;

      // Back navigation
      document.getElementById('btn-back-goals').addEventListener('click', function () {
        SavvySpend.navigate('#/goals');
      });

      // Add Funds
      document.getElementById('btn-goal-add-funds').addEventListener('click', function () {
        if (SavvySpend.components.Modals) {
          SavvySpend.components.Modals.addFunds(goalId);
        }
      });

      // Delete Goal
      document.getElementById('btn-goal-delete').addEventListener('click', function () {
        if (confirm(`Are you sure you want to delete the "${goal.name}" savings goal? This cannot be undone.`)) {
          DataStore.deleteGoal(goalId);
          SavvySpend.showToast('Savings goal deleted.', 'info');
          SavvySpend.navigate('#/goals');
        }
      });
    },

    destroy: function () {
      // Cleanup
    }
  };

  window.SavvySpend.pages.GoalDetail = GoalDetail;
})();
