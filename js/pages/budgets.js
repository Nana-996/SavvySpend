/**
 * SavvySpend — Budgets Page
 */
(function () {
  'use strict';

  window.SavvySpend = window.SavvySpend || {};
  window.SavvySpend.pages = window.SavvySpend.pages || {};

  var activeTab = 'categories'; // persistent tab state

  var Budgets = {
    render: function (param) {
      var budgets = DataStore.getBudgets();
      var txns = DataStore.getTransactions();

      // Category Budgets math
      var totalLimit = budgets.reduce(function (sum, b) { return sum + b.limit; }, 0);
      var totalSpent = budgets.reduce(function (sum, b) { return sum + b.spent; }, 0);
      var overallPct = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;
      var totalLimitFormatted = SavvySpend.formatCurrencyPlain(totalLimit);
      var totalSpentFormatted = SavvySpend.formatCurrencyPlain(totalSpent);

      // Money Jobs math
      var walletBalance = txns.reduce(function (sum, t) { return sum + t.amount; }, 0);
      var jobs = DataStore.getMoneyJobs() || [];
      var totalAssigned = jobs.reduce(function (sum, j) { return sum + j.assigned; }, 0);
      var unallocatedCash = walletBalance - totalAssigned;
      var walletBalanceFormatted = SavvySpend.formatCurrencyPlain(walletBalance);
      var totalAssignedFormatted = SavvySpend.formatCurrencyPlain(totalAssigned);
      var unallocatedFormatted = SavvySpend.formatCurrencyPlain(unallocatedCash);

      // ── Category Budgets Tab Content ──
      var recommendationsHtml = '';
      var overBudgetList = budgets.filter(function (b) { return b.spent >= b.limit; });
      var nearBudgetList = budgets.filter(function (b) { return b.spent >= b.limit * 0.8 && b.spent < b.limit; });

      if (overBudgetList.length > 0) {
        recommendationsHtml += overBudgetList.map(function (b) {
          return `
            <div class="card p-md mb-sm insight-card" style="border-left: 4px solid var(--red); background: var(--bg-secondary);">
              <div class="flex gap-md">
                <i data-lucide="alert-triangle" style="width: 20px; height: 20px; color: var(--red); flex-shrink: 0;"></i>
                <div>
                  <h4 class="text-xs font-bold text-secondary uppercase tracking-wider mb-xs">Budget Exceeded</h4>
                  <p class="text-sm text-primary-text font-medium" style="margin: 0; line-height: 1.4;">You've exceeded your <strong>${b.name}</strong> budget by ${SavvySpend.formatCurrencyPlain(b.spent - b.limit)}. We recommend freezing purchases in this category until next month.</p>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }

      if (nearBudgetList.length > 0) {
        recommendationsHtml += nearBudgetList.map(function (b) {
          var pct = Math.round((b.spent / b.limit) * 100);
          return `
            <div class="card p-md mb-sm insight-card" style="border-left: 4px solid var(--orange); background: var(--bg-secondary);">
              <div class="flex gap-md">
                <i data-lucide="lightbulb" style="width: 20px; height: 20px; color: var(--orange); flex-shrink: 0;"></i>
                <div>
                  <h4 class="text-xs font-bold text-secondary uppercase tracking-wider mb-xs">Budget Warning</h4>
                  <p class="text-sm text-primary-text font-medium" style="margin: 0; line-height: 1.4;">You've used ${pct}% of your <strong>${b.name}</strong> budget. Try spacing out your expenses to stay under the limit!</p>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }

      if (budgets.length > 0 && overBudgetList.length === 0 && nearBudgetList.length === 0) {
        recommendationsHtml = `
          <div class="card p-md mb-sm insight-card" style="border-left: 4px solid var(--primary); background: var(--bg-secondary);">
            <div class="flex gap-md">
              <i data-lucide="sparkles" style="width: 20px; height: 20px; color: var(--primary); flex-shrink: 0;"></i>
              <div>
                <h4 class="text-xs font-bold text-secondary uppercase tracking-wider mb-xs">Perfect Control</h4>
                <p class="text-sm text-primary-text font-medium" style="margin: 0; line-height: 1.4;">All your budget categories are in the green! You're on track to save an extra 15% this month. Keep it up!</p>
              </div>
            </div>
          </div>
        `;
      } else if (budgets.length === 0) {
        recommendationsHtml = `
          <div class="card p-md mb-sm insight-card" style="border-left: 4px solid var(--purple); background: var(--bg-secondary);">
            <div class="flex gap-md">
              <i data-lucide="target" style="width: 20px; height: 20px; color: var(--purple); flex-shrink: 0;"></i>
              <div>
                <h4 class="text-xs font-bold text-secondary uppercase tracking-wider mb-xs">Get Started</h4>
                <p class="text-sm text-primary-text font-medium" style="margin: 0; line-height: 1.4;">Set your first budget today to track your spending limits and earn +20 XP! Experts recommend setting budgets for food and shopping first.</p>
              </div>
            </div>
          </div>
        `;
      }

      var budgetsHtml = '';
      if (budgets.length === 0) {
        budgetsHtml = `
          <div class="text-center py-xl bg-card card" style="border: 1px dashed var(--border);">
            <i data-lucide="wallet" style="width: 48px; height: 48px; stroke: var(--text-tertiary); margin: 0 auto 12px;"></i>
            <h4 class="text-base font-bold text-primary-text">No budgets set</h4>
            <p class="text-xs text-secondary mt-xs px-lg">Budgets help you control your spending. Click the button below to set up your first category budget.</p>
            <button class="btn btn-primary btn-sm mt-md" id="btn-add-budget-empty">Create Budget</button>
          </div>
        `;
      } else {
        budgetsHtml = budgets.map(function (b) {
          var pct = Math.round((b.spent / b.limit) * 100);
          var fillPct = Math.min(pct, 100);
          
          var barColor = 'var(--primary)';
          if (pct >= 100) {
            barColor = 'var(--red)';
          } else if (pct >= 80) {
            barColor = 'var(--orange)';
          }

          var formattedSpent = SavvySpend.formatCurrencyPlain(b.spent);
          var formattedLimit = SavvySpend.formatCurrencyPlain(b.limit);

          return `
            <div class="card p-md mb-md budget-card" data-id="${b.id}" style="cursor: pointer; border: 1px solid var(--border); transition: transform 0.2s, box-shadow 0.2s;">
              <div class="flex flex-between mb-sm">
                <div class="flex flex-center gap-md">
                  <div style="width: 40px; height: 40px; border-radius: 50%; background: ${b.color}15; color: ${b.color}; display: flex; align-items: center; justify-content: center;">
                    <i data-lucide="${b.icon}" style="width: 20px; height: 20px;"></i>
                  </div>
                  <div>
                    <h4 class="text-sm font-bold" style="margin: 0;">${b.name}</h4>
                    <span class="text-xs text-secondary">${pct}% spent</span>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-sm font-bold text-primary-text">${formattedSpent}</span>
                  <span class="text-xs text-secondary">/ ${formattedLimit}</span>
                </div>
              </div>
              <div class="progress-bar w-full" style="height: 8px; background: var(--bg-secondary); border-radius: var(--radius-full); overflow: hidden;">
                <div class="progress-bar-fill" style="width: ${fillPct}%; background: ${barColor}; height: 100%; border-radius: var(--radius-full);"></div>
              </div>
            </div>
          `;
        }).join('');
      }

      // ── Money Jobs Tab Content ──
      var jobsRecommendationsHtml = '';
      if (unallocatedCash > 0) {
        jobsRecommendationsHtml = `
          <div class="card p-md mb-sm insight-card" style="border-left: 4px solid var(--primary); background: var(--bg-secondary);">
            <div class="flex gap-md">
              <i data-lucide="check-circle-2" style="width: 20px; height: 20px; color: var(--primary); flex-shrink: 0;"></i>
              <div>
                <h4 class="text-xs font-bold text-secondary uppercase tracking-wider mb-xs">Unassigned Cash Available</h4>
                <p class="text-sm text-primary-text font-medium" style="margin: 0; line-height: 1.4;">You have <strong>${unallocatedFormatted}</strong> waiting for a job. Assign this money to savings, emergency funds, or purchases to reach your goals!</p>
              </div>
            </div>
          </div>
        `;
      } else if (unallocatedCash < 0) {
        jobsRecommendationsHtml = `
          <div class="card p-md mb-sm insight-card" style="border-left: 4px solid var(--red); background: var(--bg-secondary);">
            <div class="flex gap-md">
              <i data-lucide="alert-circle" style="width: 20px; height: 20px; color: var(--red); flex-shrink: 0;"></i>
              <div>
                <h4 class="text-xs font-bold text-secondary uppercase tracking-wider mb-xs">Over-allocated Buckets</h4>
                <p class="text-sm text-primary-text font-medium" style="margin: 0; line-height: 1.4;">Your total assigned bucket balance exceeds your wallet balance by <strong>${SavvySpend.formatCurrencyPlain(Math.abs(unallocatedCash))}</strong>. Please adjust your buckets to match your actual cash!</p>
              </div>
            </div>
          </div>
        `;
      } else {
        jobsRecommendationsHtml = `
          <div class="card p-md mb-sm insight-card" style="border-left: 4px solid var(--primary); background: var(--bg-secondary);">
            <div class="flex gap-md">
              <i data-lucide="piggy-bank" style="width: 20px; height: 20px; color: var(--primary); flex-shrink: 0;"></i>
              <div>
                <h4 class="text-xs font-bold text-secondary uppercase tracking-wider mb-xs">Zero-Based Budget Reached</h4>
                <p class="text-sm text-primary-text font-medium" style="margin: 0; line-height: 1.4;">Perfect! Every cedi has a job. Your unallocated cash is exactly GHS 0.00.</p>
              </div>
            </div>
          </div>
        `;
      }

      var jobsHtml = '';
      if (jobs.length === 0) {
        jobsHtml = `
          <div class="text-center py-xl bg-card card" style="border: 1px dashed var(--border);">
            <i data-lucide="piggy-bank" style="width: 48px; height: 48px; stroke: var(--text-tertiary); margin: 0 auto 12px;"></i>
            <h4 class="text-base font-bold text-primary-text">No Money Jobs set</h4>
            <p class="text-xs text-secondary mt-xs px-lg">Give every cedi a purpose! Allocate your wallet balance into specific funding buckets.</p>
            <button class="btn btn-primary btn-sm mt-md" id="btn-add-job-empty">Create Bucket</button>
          </div>
        `;
      } else {
        jobsHtml = jobs.map(function (j) {
          var remaining = j.assigned - (j.spent || 0);
          var pct = j.assigned > 0 ? Math.round((j.spent / j.assigned) * 100) : 0;
          var fillPct = Math.min(pct, 100);
          
          var barColor = 'var(--primary)';
          if (pct >= 100) {
            barColor = 'var(--red)';
          } else if (pct >= 80) {
            barColor = 'var(--orange)';
          }

          var formattedSpent = SavvySpend.formatCurrencyPlain(j.spent || 0);
          var formattedAssigned = SavvySpend.formatCurrencyPlain(j.assigned);
          var formattedRemaining = SavvySpend.formatCurrencyPlain(remaining);

          return `
            <div class="card p-md mb-md job-card" data-id="${j.id}" style="cursor: pointer; border: 1px solid var(--border); transition: transform 0.2s, box-shadow 0.2s;">
              <div class="flex flex-between mb-sm">
                <div class="flex flex-center gap-md">
                  <div style="width: 40px; height: 40px; border-radius: 50%; background: ${j.color}15; color: ${j.color}; display: flex; align-items: center; justify-content: center;">
                    <i data-lucide="${j.icon}" style="width: 20px; height: 20px;"></i>
                  </div>
                  <div>
                    <h4 class="text-sm font-bold" style="margin: 0;">${j.name}</h4>
                    <span class="text-xs text-secondary">${formattedRemaining} remaining</span>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-sm font-bold text-primary-text">${formattedSpent} spent</span>
                  <span class="text-xs text-secondary">/ ${formattedAssigned}</span>
                </div>
              </div>
              <div class="progress-bar w-full" style="height: 8px; background: var(--bg-secondary); border-radius: var(--radius-full); overflow: hidden;">
                <div class="progress-bar-fill" style="width: ${fillPct}%; background: ${barColor}; height: 100%; border-radius: var(--radius-full);"></div>
              </div>
            </div>
          `;
        }).join('');
      }

      return `
        <div class="page-header mt-sm mb-lg">
          <h2 class="page-title text-2xl font-bold">Budgets</h2>
          <p class="page-subtitle text-xs text-secondary">Control your spending & allocate your cash</p>
        </div>

        <!-- Sliding Tab Selector -->
        <div class="tab-group flex-center mb-lg" style="width: 100%;">
          <button type="button" class="tab ${activeTab === 'categories' ? 'active' : ''} w-full" id="tab-cat-budgets" style="flex: 1;">Category Budgets</button>
          <button type="button" class="tab ${activeTab === 'jobs' ? 'active' : ''} w-full" id="tab-money-jobs" style="flex: 1;">Money Jobs (Buckets)</button>
        </div>

        <!-- ───── CATEGORIES VIEW ───── -->
        <div id="categories-tab-content" class="${activeTab === 'categories' ? '' : 'hidden'}">
          <!-- Overall Budget Summary -->
          <div class="card p-lg mb-lg bg-card" style="border: 1px solid var(--border);">
            <div class="flex flex-between mb-sm">
              <div>
                <span class="text-xs text-secondary uppercase font-semibold">Total Budget Spent</span>
                <h3 class="text-xl font-extrabold mt-xs text-primary-text">${totalSpentFormatted} <span class="text-sm font-normal text-secondary">/ ${totalLimitFormatted}</span></h3>
              </div>
              <div class="flex flex-center" style="width: 52px; height: 52px; border-radius: 50%; background: var(--primary-light); color: var(--primary-dark); font-weight: 700; font-size: 1.1rem;">
                ${overallPct}%
              </div>
            </div>
            <div class="progress-bar w-full" style="height: 8px; background: var(--bg-secondary); border-radius: var(--radius-full); overflow: hidden;">
              <div class="progress-bar-fill" style="width: ${Math.min(overallPct, 100)}%; background: var(--primary); height: 100%; border-radius: var(--radius-full);"></div>
            </div>
          </div>

          <!-- Recommendations section -->
          <div class="mb-lg">
            <h3 class="section-title text-sm font-bold text-secondary uppercase tracking-wider mb-sm">Savings Advisor</h3>
            ${recommendationsHtml}
          </div>

          <!-- Budgets list -->
          <div class="mb-xl">
            <div class="flex flex-between flex-center mb-sm">
              <h3 class="section-title text-sm font-bold text-secondary uppercase tracking-wider">Category Budgets</h3>
              ${budgets.length > 0 ? `<button class="btn btn-outline btn-sm flex flex-center gap-xs" id="btn-add-budget-top" style="padding: 4px 10px; font-size: 0.75rem;"><i data-lucide="plus" style="width: 14px; height: 14px;"></i> Add Budget</button>` : ''}
            </div>
            <div class="budgets-container">
              ${budgetsHtml}
            </div>
          </div>
        </div>

        <!-- ───── MONEY JOBS VIEW ───── -->
        <div id="jobs-tab-content" class="${activeTab === 'jobs' ? '' : 'hidden'}">
          <!-- Overall Job Summary -->
          <div class="card p-lg mb-lg bg-card" style="border: 1px solid var(--border);">
            <div class="flex flex-between mb-sm">
              <div>
                <span class="text-xs text-secondary uppercase font-semibold">Total Cash Balance</span>
                <h3 class="text-xl font-extrabold mt-xs text-primary-text" style="color: var(--primary);">${walletBalanceFormatted}</h3>
                <span class="text-xxs text-secondary mt-xs" style="display: block;">Assigned: ${totalAssignedFormatted} • Unassigned: ${unallocatedFormatted}</span>
              </div>
              <div class="flex flex-column flex-center text-center" style="width: 72px; padding: 4px; border-radius: var(--radius-md); background: ${unallocatedCash > 0 ? 'var(--orange-light)' : 'var(--primary-light)'}; color: ${unallocatedCash > 0 ? 'var(--orange-dark)' : 'var(--primary-dark)'};">
                <span style="font-size: 0.6rem; font-weight: 700; text-transform: uppercase;">Unassigned</span>
                <span style="font-size: 0.8rem; font-weight: 800;">${unallocatedFormatted}</span>
              </div>
            </div>
          </div>

          <!-- Jobs Recommendations -->
          <div class="mb-lg">
            <h3 class="section-title text-sm font-bold text-secondary uppercase tracking-wider mb-sm">Jobs Advisor</h3>
            ${jobsRecommendationsHtml}
          </div>

          <!-- Jobs list -->
          <div class="mb-xl">
            <div class="flex flex-between flex-center mb-sm">
              <h3 class="section-title text-sm font-bold text-secondary uppercase tracking-wider">Money Jobs</h3>
              ${jobs.length > 0 ? `<button class="btn btn-outline btn-sm flex flex-center gap-xs" id="btn-add-job-top" style="padding: 4px 10px; font-size: 0.75rem;"><i data-lucide="plus" style="width: 14px; height: 14px;"></i> Create Bucket</button>` : ''}
            </div>
            <div class="jobs-container">
              ${jobsHtml}
            </div>
          </div>
        </div>

        <!-- Floating Add Buttons -->
        <button class="fab btn-primary flex flex-center" id="fab-add-budget" style="position: fixed; bottom: 80px; right: 20px; z-index: 50; width: 56px; height: 56px; border-radius: 50%; box-shadow: var(--shadow-lg); display: ${activeTab === 'categories' && budgets.length > 0 ? 'flex' : 'none'};">
          <i data-lucide="plus" style="width: 24px; height: 24px;"></i>
        </button>
        <button class="fab btn-primary flex flex-center" id="fab-add-job" style="position: fixed; bottom: 80px; right: 20px; z-index: 50; width: 56px; height: 56px; border-radius: 50%; box-shadow: var(--shadow-lg); display: ${activeTab === 'jobs' && jobs.length > 0 ? 'flex' : 'none'};">
          <i data-lucide="plus" style="width: 24px; height: 24px;"></i>
        </button>
      `;
    },

    afterRender: function () {
      var categoriesTabBtn = document.getElementById('tab-cat-budgets');
      var jobsTabBtn = document.getElementById('tab-money-jobs');
      var categoriesContent = document.getElementById('categories-tab-content');
      var jobsContent = document.getElementById('jobs-tab-content');
      
      var fabBudget = document.getElementById('fab-add-budget');
      var fabJob = document.getElementById('fab-add-job');

      // Tab switcher handlers
      if (categoriesTabBtn && jobsTabBtn) {
        categoriesTabBtn.addEventListener('click', function () {
          activeTab = 'categories';
          categoriesTabBtn.classList.add('active');
          jobsTabBtn.classList.remove('active');
          categoriesContent.classList.remove('hidden');
          jobsContent.classList.add('hidden');
          
          if (fabBudget) fabBudget.style.display = DataStore.getBudgets().length > 0 ? 'flex' : 'none';
          if (fabJob) fabJob.style.display = 'none';
        });

        jobsTabBtn.addEventListener('click', function () {
          activeTab = 'jobs';
          jobsTabBtn.classList.add('active');
          categoriesTabBtn.classList.remove('active');
          jobsContent.classList.remove('hidden');
          categoriesContent.classList.add('hidden');
          
          if (fabJob) fabJob.style.display = DataStore.getMoneyJobs().length > 0 ? 'flex' : 'none';
          if (fabBudget) fabBudget.style.display = 'none';
        });
      }

      // Bind category budget triggers
      if (fabBudget) {
        fabBudget.addEventListener('click', function () {
          if (SavvySpend.components.Modals) SavvySpend.components.Modals.addBudget();
        });
      }

      var btnAddBudgetTop = document.getElementById('btn-add-budget-top');
      if (btnAddBudgetTop) {
        btnAddBudgetTop.addEventListener('click', function () {
          if (SavvySpend.components.Modals) SavvySpend.components.Modals.addBudget();
        });
      }

      var btnAddBudgetEmpty = document.getElementById('btn-add-budget-empty');
      if (btnAddBudgetEmpty) {
        btnAddBudgetEmpty.addEventListener('click', function () {
          if (SavvySpend.components.Modals) SavvySpend.components.Modals.addBudget();
        });
      }

      // Bind money job triggers
      if (fabJob) {
        fabJob.addEventListener('click', function () {
          if (SavvySpend.components.Modals) SavvySpend.components.Modals.addMoneyJob();
        });
      }

      var btnAddJobTop = document.getElementById('btn-add-job-top');
      if (btnAddJobTop) {
        btnAddJobTop.addEventListener('click', function () {
          if (SavvySpend.components.Modals) SavvySpend.components.Modals.addMoneyJob();
        });
      }

      var btnAddJobEmpty = document.getElementById('btn-add-job-empty');
      if (btnAddJobEmpty) {
        btnAddJobEmpty.addEventListener('click', function () {
          if (SavvySpend.components.Modals) SavvySpend.components.Modals.addMoneyJob();
        });
      }

      // Bind budget cards click to edit
      var budgetCards = document.querySelectorAll('.budget-card');
      budgetCards.forEach(function (card) {
        card.addEventListener('click', function () {
          var id = card.getAttribute('data-id');
          if (SavvySpend.components.Modals) {
            SavvySpend.components.Modals.editBudget(id);
          }
        });
      });

      // Bind job cards click to edit
      var jobCards = document.querySelectorAll('.job-card');
      jobCards.forEach(function (card) {
        card.addEventListener('click', function () {
          var id = card.getAttribute('data-id');
          if (SavvySpend.components.Modals) {
            SavvySpend.components.Modals.addMoneyJob(id);
          }
        });
      });
    },

    destroy: function () {
      // Cleanup
    }
  };

  window.SavvySpend.pages.Budgets = Budgets;
})();
