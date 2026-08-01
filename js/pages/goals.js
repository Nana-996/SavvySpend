/**
 * SavvySpend — Savings Goals Page
 */
(function () {
  'use strict';

  window.SavvySpend = window.SavvySpend || {};
  window.SavvySpend.pages = window.SavvySpend.pages || {};

  var Goals = {
    render: function (param) {
      var goals = DataStore.getGoals().filter(function (g) { return !g.isBusiness; });

      // Calculate totals
      var totalTarget = goals.reduce(function (sum, g) { return sum + g.target; }, 0);
      var totalSaved = goals.reduce(function (sum, g) { return sum + g.current; }, 0);
      var overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

      var totalTargetFormatted = SavvySpend.formatCurrencyPlain(totalTarget);
      var totalSavedFormatted = SavvySpend.formatCurrencyPlain(totalSaved);

      // Render Goals List
      var goalsHtml = '';
      if (goals.length === 0) {
        goalsHtml = `
          <div class="text-center py-xl bg-card card" style="border: 1px dashed var(--border);">
            <span class="empty-state-icon"><i data-lucide="target" style="width: 48px; height: 48px; stroke: var(--text-tertiary); margin: 0 auto 12px;"></i></span>
            <h4 class="text-base font-bold text-primary-text">No savings goals yet</h4>
            <p class="text-xs text-secondary mt-xs px-lg">Saving for a vacation, emergency fund, or a new laptop? Create a goal to track your progress!</p>
            <div class="empty-state-dots mt-md"><span></span><span></span><span></span></div>
            <button class="btn btn-primary btn-sm mt-md" id="btn-add-goal-empty">Create Savings Goal</button>
          </div>
        `;
      } else {
        goalsHtml = goals.map(function (g) {
          var pct = Math.round((g.current / g.target) * 100);
          var fillPct = Math.min(pct, 100);
          var remaining = g.target - g.current;
          var deadlineFormatted = SavvySpend.formatDate(g.deadline);

          var priorityBadgeHtml = '';
          if (g.priority) {
            var badgeColor = '#9CA3AF'; // low / default
            var badgeText = 'Low';
            var iconName = 'clock';
            if (g.priority === 'high') {
              badgeColor = '#EF4444'; // red
              badgeText = 'High Priority';
              iconName = 'flame';
            } else if (g.priority === 'medium') {
              badgeColor = '#F59E0B'; // orange
              badgeText = 'Medium Priority';
              iconName = 'zap';
            }
            priorityBadgeHtml = `
              <span class="status-badge" style="background: ${badgeColor}15; color: ${badgeColor}; border: 1px solid ${badgeColor}30; font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
                <i data-lucide="${iconName}" style="width: 10px; height: 10px;"></i>
                <span>${badgeText}</span>
              </span>
            `;
          }

          return `
            <div class="card p-md mb-md goal-card reveal reveal-d${(goals.indexOf(g) % 6) + 1}" data-id="${g.id}" style="cursor: pointer; border: 1px solid var(--border); transition: transform 0.2s, box-shadow 0.2s;">
              <div class="flex flex-between mb-sm">
                <div class="flex flex-center gap-md">
                  <span style="width: 44px; height: 44px; background: ${g.color}15; color: ${g.color}; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;">
                    <i data-lucide="${g.icon}" style="width: 24px; height: 24px;"></i>
                  </span>
                  <div>
                    <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                      <h4 class="text-sm font-bold" style="margin: 0;">${g.name}</h4>
                      ${priorityBadgeHtml}
                    </div>
                    <span class="text-xs text-secondary">Target: ${deadlineFormatted}</span>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-sm font-bold text-primary-text" style="color: ${g.color};">${pct}%</span>
                  <span class="text-xs text-secondary" style="display: block;">saved</span>
                </div>
              </div>

              <!-- Progress bar -->
              <div class="progress-bar w-full mt-xs" style="height: 8px; background: var(--bg-secondary); border-radius: var(--radius-full); overflow: hidden;">
                <div class="progress-bar-fill-animated" data-target-width="${fillPct}%" style="background: ${g.color}; height: 100%; border-radius: var(--radius-full);"></div>
              </div>

              <div class="flex flex-between text-xs mt-sm text-secondary">
                <span>Current: <strong>${SavvySpend.formatCurrencyPlain(g.current)}</strong></span>
                <span>Goal: <strong>${SavvySpend.formatCurrencyPlain(g.target)}</strong></span>
              </div>
            </div>
          `;
        }).join('');
      }

      return `
        <div class="page-header mt-sm mb-lg">
          <h2 class="page-title text-2xl font-bold hero-title">Savings Goals</h2>
          <p class="page-subtitle text-xs text-secondary hero-subtitle">Save for what matters most</p>
        </div>

        <!-- Goals Summary -->
        <div class="card p-lg mb-lg bg-card" style="border: 1px solid var(--border);">
          <div class="flex flex-between mb-sm">
            <div>
              <span class="text-xs text-secondary uppercase font-semibold">Total Savings Goal Progress</span>
              <h3 class="text-xl font-extrabold mt-xs text-primary-text">${totalSavedFormatted} <span class="text-sm font-normal text-secondary">/ ${totalTargetFormatted}</span></h3>
            </div>
            <div class="flex flex-center" style="width: 52px; height: 52px; border-radius: 50%; background: var(--primary-light); color: var(--primary-dark); font-weight: 700; font-size: 1.1rem;">
              ${overallPct}%
            </div>
          </div>
          <div class="progress-bar w-full" style="height: 8px; background: var(--bg-secondary); border-radius: var(--radius-full); overflow: hidden;">
            <div class="progress-bar-fill-animated" data-target-width="${Math.min(overallPct, 100)}%" style="background: var(--primary); height: 100%; border-radius: var(--radius-full);"></div>
          </div>
        </div>

        <!-- Goals List Header -->
        <div class="flex flex-between flex-center mb-sm">
          <h3 class="section-title text-sm font-bold text-secondary uppercase tracking-wider">Active Goals</h3>
          ${goals.length > 0 ? `<button class="btn btn-outline btn-sm flex flex-center gap-xs" id="btn-add-goal-top" style="padding: 4px 10px; font-size: 0.75rem;"><i data-lucide="plus" style="width: 14px; height: 14px;"></i> New Goal</button>` : ''}
        </div>

        <!-- Goals Container -->
        <div class="goals-container mb-xl">
          ${goalsHtml}
        </div>

        <!-- Floating Add Button -->
        ${goals.length > 0 ? `
          <button class="fab btn-primary flex flex-center" id="fab-add-goal" style="position: fixed; bottom: 80px; right: 20px; z-index: 50; width: 56px; height: 56px; border-radius: 50%; box-shadow: var(--shadow-lg);">
            <i data-lucide="plus" style="width: 24px; height: 24px;"></i>
          </button>
        ` : ''}
      `;
    },

    afterRender: function () {
      var goals = DataStore.getGoals().filter(function (g) { return !g.isBusiness; });
      // Bind Add buttons
      var fab = document.getElementById('fab-add-goal');
      if (fab) {
        fab.classList.add('fab-rotate');
        fab.addEventListener('click', function () {
          fab.classList.add('fab-bounce');
          setTimeout(function () { fab.classList.remove('fab-bounce'); }, 400);
          if (SavvySpend.components.Modals) SavvySpend.components.Modals.addGoal();
        });
      }

      var btnAddTop = document.getElementById('btn-add-goal-top');
      if (btnAddTop) {
        btnAddTop.addEventListener('click', function () {
          if (SavvySpend.components.Modals) SavvySpend.components.Modals.addGoal();
        });
      }

      var btnAddEmpty = document.getElementById('btn-add-goal-empty');
      if (btnAddEmpty) {
        btnAddEmpty.addEventListener('click', function () {
          if (SavvySpend.components.Modals) SavvySpend.components.Modals.addGoal();
        });
      }

      // Bind goal card clicks
      var cards = document.querySelectorAll('.goal-card');
      cards.forEach(function (card) {
        var id = card.getAttribute('data-id');
        var goal = goals.find(function (g) { return g.id === id; });

        card.addEventListener('click', function () {
          SavvySpend.navigate('#/goal/' + id);
        });

        // Hover animation
        card.addEventListener('mouseenter', function () {
          card.style.transform = 'translateY(-2px)';
          card.style.boxShadow = 'var(--shadow-md)';
        });
        card.addEventListener('mouseleave', function () {
          card.style.transform = '';
          card.style.boxShadow = '';
        });

        // Confetti for completed goals
        if (goal && goal.current >= goal.target) {
          setTimeout(function () {
            var rect = card.getBoundingClientRect();
            if (window.SavvySpend && SavvySpend.fireConfetti) {
              SavvySpend.fireConfetti({ x: rect.left + rect.width / 2, y: rect.top + 30, count: 30 });
            }
          }, 1200);
        }
      });
    },

    destroy: function () {
      // Cleanup
    }
  };

  window.SavvySpend.pages.Goals = Goals;
})();
