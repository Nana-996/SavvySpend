/**
 * SavvySpend — Budgets Page (Weekly Spending Redesign)
 */
(function () {
  'use strict';

  window.SavvySpend = window.SavvySpend || {};
  window.SavvySpend.pages = window.SavvySpend.pages || {};

  var activeTab = 'weekly'; // persistent tab state: 'weekly' or 'jobs'

  var Budgets = {
    render: function (param) {
      var wb = DataStore.getWeeklyBudget();
      var txns = DataStore.getTransactions();

      // Money Jobs math (Buckets tab)
      var walletBalance = txns.reduce(function (sum, t) { return sum + t.amount; }, 0);
      var jobs = DataStore.getMoneyJobs() || [];
      var totalAssigned = jobs.reduce(function (sum, j) { return sum + j.assigned; }, 0);
      var unallocatedCash = walletBalance - totalAssigned;
      var walletBalanceFormatted = SavvySpend.formatCurrencyPlain(walletBalance);
      var totalAssignedFormatted = SavvySpend.formatCurrencyPlain(totalAssigned);
      var unallocatedFormatted = SavvySpend.formatCurrencyPlain(unallocatedCash);

      // Helper function to local add days (duplicated inside page for safety)
      function addDays(dateStr, days) {
        var parts = dateStr.split('-');
        var year = parseInt(parts[0], 10);
        var month = parseInt(parts[1], 10) - 1;
        var day = parseInt(parts[2], 10);
        var d = new Date(year, month, day);
        d.setDate(d.getDate() + days);
        var yyyy = d.getFullYear();
        var mm = String(d.getMonth() + 1).padStart(2, '0');
        var dd = String(d.getDate()).padStart(2, '0');
        return yyyy + '-' + mm + '-' + dd;
      }

      // ── Weekly Spending Budget Content ──
      var weeklyTabHtml = '';

      if (!wb || wb.limit <= 0) {
        // Empty state onboarding card
        weeklyTabHtml = `
          <div class="text-center py-xl bg-card card" style="border: 1px dashed var(--border); margin-top: 16px;">
            <div class="flex flex-center" style="width: 64px; height: 64px; border-radius: 50%; background: var(--primary-light); color: var(--primary-dark); margin: 0 auto 16px;">
              <i data-lucide="wallet" style="width: 32px; height: 32px;"></i>
            </div>
            <h4 class="text-base font-bold text-primary-text">No weekly budget set</h4>
            <p class="text-xs text-secondary mt-xs px-lg" style="line-height: 1.4;">
              Set your weekly spending money, and the app will calculate your proposed daily allowance. At the end of the week, your balance is recorded.
            </p>
            <button class="btn btn-primary btn-sm mt-md" id="btn-set-weekly-budget-empty">Set Weekly Budget</button>
          </div>
        `;
      } else {
        // Math calculations
        var todayStr = new Date().toISOString().split('T')[0];
        var endCycleDate = addDays(wb.startDate, 6);
        
        // Filter week's transactions (expenses only)
        var weekExpenses = txns.filter(function (t) {
          return t.amount < 0 && t.date >= wb.startDate && t.date <= endCycleDate;
        });

        var weeklySpent = weekExpenses.reduce(function (sum, t) {
          return sum + Math.abs(t.amount);
        }, 0);

        var weeklyRemaining = wb.limit - weeklySpent;
        var weeklyPct = wb.limit > 0 ? Math.round((weeklySpent / wb.limit) * 100) : 0;
        
        // Formatting weekly amounts
        var weeklyLimitFormatted = SavvySpend.formatCurrencyPlain(wb.limit);
        var weeklySpentFormatted = SavvySpend.formatCurrencyPlain(weeklySpent);
        var cycleRangeFormatted = SavvySpend.formatDate(wb.startDate) + ' - ' + SavvySpend.formatDate(endCycleDate);

        // Day and allowance calculation
        var startD = new Date(wb.startDate.split('-')[0], wb.startDate.split('-')[1] - 1, wb.startDate.split('-')[2]);
        var todayD = new Date(todayStr.split('-')[0], todayStr.split('-')[1] - 1, todayStr.split('-')[2]);
        
        var currentDayIndex = Math.floor((todayD - startD) / 86400000) + 1;
        if (currentDayIndex < 1) currentDayIndex = 1;
        if (currentDayIndex > 7) currentDayIndex = 7;
        var daysLeft = 8 - currentDayIndex;

        // Spent before today in this cycle
        var spentBeforeToday = txns
          .filter(function (t) {
            return t.amount < 0 && t.date >= wb.startDate && t.date < todayStr;
          })
          .reduce(function (sum, t) { return sum + Math.abs(t.amount); }, 0);

        // Spent today
        var spentToday = txns
          .filter(function (t) {
            return t.amount < 0 && t.date === todayStr;
          })
          .reduce(function (sum, t) { return sum + Math.abs(t.amount); }, 0);

        var remainingWeeklyAllowance = Math.max(0, wb.limit - spentBeforeToday);
        var proposedDailyLimit = remainingWeeklyAllowance / daysLeft;
        var remainingTodayAllowance = proposedDailyLimit - spentToday;

        var proposedDailyLimitFormatted = SavvySpend.formatCurrencyPlain(proposedDailyLimit);
        var spentTodayFormatted = SavvySpend.formatCurrencyPlain(spentToday);
        var remainingTodayAllowanceFormatted = SavvySpend.formatCurrency(remainingTodayAllowance);

        // Today's feedback box
        var allowanceFeedbackHtml = '';
        if (remainingTodayAllowance > 0) {
          allowanceFeedbackHtml = `
            <div class="card p-sm mt-md flex gap-sm flex-center" style="border-left: 4px solid var(--primary); background: var(--primary-light); color: var(--primary-dark); font-size: 0.8rem; border-radius: var(--radius-sm);">
              <i data-lucide="sparkles" style="width: 16px; height: 16px; flex-shrink: 0; color: var(--primary-dark);"></i>
              <div>
                <span>You're in the green! Under proposed daily limit. Keep it up!</span>
              </div>
            </div>
          `;
        } else if (remainingTodayAllowance < 0) {
          allowanceFeedbackHtml = `
            <div class="card p-sm mt-md flex gap-sm flex-center" style="border-left: 4px solid var(--red); background: var(--red-light); color: var(--red); font-size: 0.8rem; border-radius: var(--radius-sm);">
              <i data-lucide="alert-triangle" style="width: 16px; height: 16px; flex-shrink: 0; color: var(--red);"></i>
              <div>
                <span>Over daily proposed limit! Consider cutting back on other days.</span>
              </div>
            </div>
          `;
        } else {
          allowanceFeedbackHtml = `
            <div class="card p-sm mt-md flex gap-sm flex-center" style="border-left: 4px solid var(--orange); background: var(--orange-light); color: var(--orange); font-size: 0.8rem; border-radius: var(--radius-sm);">
              <i data-lucide="info" style="width: 16px; height: 16px; flex-shrink: 0; color: var(--orange);"></i>
              <div>
                <span>You have exactly reached today's proposed allowance!</span>
              </div>
            </div>
          `;
        }

        // Cycle transactions html list
        var transactionsHtml = '';
        var weekExpensesList = txns.filter(function (t) {
          return t.date >= wb.startDate && t.date <= endCycleDate;
        }).slice(0, 3); // show top 3 recent in the cycle

        if (weekExpensesList.length === 0) {
          transactionsHtml = `<p class="text-xs text-secondary text-center py-md" style="margin: 0;">No transactions logged in this cycle yet.</p>`;
        } else {
          transactionsHtml = weekExpensesList.map(function (t) {
            var cat = window.CATEGORIES[t.category] || window.CATEGORIES.other;
            var isExpense = t.amount < 0;
            var amountFormatted = SavvySpend.formatCurrency(t.amount);
            var amountClass = isExpense ? 'font-semibold' : 'text-positive font-semibold';
            
            return `
              <div class="flex flex-between flex-center py-sm" style="border-bottom: 1px solid var(--border-light); cursor: pointer;" onclick="SavvySpend.navigate('#/transaction/${t.id}')">
                <div class="flex flex-center gap-sm">
                  <div class="flex flex-center" style="width: 28px; height: 28px; border-radius: 50%; background: ${cat.color}15; color: ${cat.color};">
                    <i data-lucide="${cat.icon}" style="width: 14px; height: 14px;"></i>
                  </div>
                  <div>
                    <h5 class="text-xs font-bold text-primary-text" style="margin: 0;">${t.merchant}</h5>
                    <span class="text-xxs text-secondary">${SavvySpend.formatDateShort(t.date)}</span>
                  </div>
                </div>
                <span class="text-xs ${amountClass}">${amountFormatted}</span>
              </div>
            `;
          }).join('');
        }

        // History list mapping
        var historyHtml = '';
        if (!wb.history || wb.history.length === 0) {
          historyHtml = `
            <div class="text-center py-md bg-card card" style="border: 1px dashed var(--border);">
              <i data-lucide="history" style="width: 32px; height: 32px; stroke: var(--text-tertiary); margin: 0 auto 8px;"></i>
              <p class="text-xxs text-secondary px-md" style="margin: 0; line-height: 1.4;">Historical weekly cycles will populate automatically at the end of each week.</p>
            </div>
          `;
        } else {
          historyHtml = wb.history.map(function (h) {
            var isSaved = h.balance >= 0;
            var balanceColor = isSaved ? 'var(--primary)' : 'var(--red)';
            var balanceBg = isSaved ? 'var(--primary-light)' : 'var(--red-light)';
            var balanceText = isSaved ? '+' + SavvySpend.formatCurrencyPlain(h.balance) + ' Saved!' : '-' + SavvySpend.formatCurrencyPlain(Math.abs(h.balance)) + ' Overspent';
            var cycleRange = SavvySpend.formatDate(h.startDate) + ' - ' + SavvySpend.formatDate(h.endDate);

            return `
              <div class="card p-md mb-sm flex flex-between flex-center bg-card" style="border: 1px solid var(--border); transition: transform 0.2s;">
                <div>
                  <h4 class="text-xs font-bold text-primary-text" style="margin: 0;">${cycleRange}</h4>
                  <span class="text-xxs text-secondary">Limit: ${SavvySpend.formatCurrencyPlain(h.limit)} • Spent: ${SavvySpend.formatCurrencyPlain(h.spent)}</span>
                </div>
                <div class="text-right">
                  <span class="badge" style="background: ${balanceBg}; color: ${balanceColor}; font-size: 0.65rem; font-weight: 700; padding: 4px 8px; border-radius: var(--radius-full);">
                    ${balanceText}
                  </span>
                </div>
              </div>
            `;
          }).join('');
        }

        // Construct the weekly dashboard HTML
        weeklyTabHtml = `
          <!-- Overall Weekly Card -->
          <div class="card p-lg mb-lg bg-card" style="border: 1px solid var(--border);">
            <div class="flex flex-between flex-center mb-sm">
              <div>
                <span class="text-xs text-secondary uppercase font-semibold">Weekly Spending Cycle</span>
                <h4 class="text-sm font-bold text-primary-text mt-xs" style="margin: 4px 0 0;">${cycleRangeFormatted}</h4>
              </div>
              <button class="btn btn-outline btn-sm flex flex-center gap-xs" id="btn-edit-weekly-budget" style="padding: 4px 8px; font-size: 0.7rem; background: var(--bg-card); border-color: var(--border);">
                <i data-lucide="edit-2" style="width: 12px; height: 12px;"></i> Adjust Limit
              </button>
            </div>

            <div class="flex flex-between mt-md mb-xs" style="margin-top: 16px;">
              <span class="text-xs text-secondary">Spent: <strong>${weeklySpentFormatted}</strong></span>
              <span class="text-xs text-secondary">Limit: <strong>${weeklyLimitFormatted}</strong></span>
            </div>

            <div class="progress-bar w-full" style="height: 10px; background: var(--bg-secondary); border-radius: var(--radius-full); overflow: hidden; margin-top: 8px;">
              <div class="progress-bar-fill" style="width: ${Math.min(weeklyPct, 100)}%; background: ${weeklyPct >= 100 ? 'var(--red)' : weeklyPct >= 80 ? 'var(--orange)' : 'var(--primary)'}; height: 100%; border-radius: var(--radius-full);"></div>
            </div>
            
            <div class="flex flex-between text-xxs text-secondary mt-sm" style="margin-top: 8px;">
              <span>${weeklyPct}% of weekly budget spent</span>
              <span class="${weeklyRemaining >= 0 ? 'text-positive font-bold' : 'text-negative font-bold'}">
                ${weeklyRemaining >= 0 ? 'Remaining: ' + SavvySpend.formatCurrencyPlain(weeklyRemaining) : 'Overspent: ' + SavvySpend.formatCurrencyPlain(Math.abs(weeklyRemaining))}
              </span>
            </div>
          </div>

          <!-- Daily Proposal Card -->
          <div class="card p-lg mb-lg bg-card" style="border: 1px solid var(--border); box-shadow: var(--shadow-sm);">
            <div class="flex flex-between mb-sm">
              <div>
                <span class="text-xs text-secondary uppercase font-semibold">Today's Proposed Allowance</span>
                <h3 class="text-2xl font-extrabold mt-xs text-primary-text" style="margin: 4px 0 0; letter-spacing: -0.5px;">${proposedDailyLimitFormatted}</h3>
              </div>
              <span class="badge flex flex-center" style="background: var(--bg-secondary); color: var(--text-secondary); font-size: 0.75rem; padding: 4px 8px; border-radius: var(--radius-sm); height: 24px; font-weight: 600;">Day ${currentDayIndex} of 7</span>
            </div>
            
            <div class="flex gap-md mt-md" style="display: flex; gap: 16px; margin-top: 16px;">
              <div style="flex: 1;">
                <span class="text-xxs text-secondary uppercase font-bold" style="display: block;">Spent Today</span>
                <span class="text-base font-bold text-primary-text" style="display: block; margin-top: 4px;">${spentTodayFormatted}</span>
              </div>
              <div style="flex: 1; border-left: 1px solid var(--border-light); padding-left: 16px;">
                <span class="text-xxs text-secondary uppercase font-bold" style="display: block;">Remaining Allowance</span>
                <span class="text-base font-bold ${remainingTodayAllowance >= 0 ? 'text-positive' : 'text-negative'}" style="display: block; margin-top: 4px;">${remainingTodayAllowanceFormatted}</span>
              </div>
            </div>

            ${allowanceFeedbackHtml}
          </div>

          <!-- Cycle Log preview -->
          <div class="card p-md mb-lg bg-card" style="border: 1px solid var(--border);">
            <div class="flex flex-between flex-center mb-sm">
              <h4 class="text-xs font-bold text-secondary uppercase tracking-wider" style="margin: 0;">Cycle Transactions Log</h4>
              <button class="btn-link text-xxs font-bold text-primary" onclick="SavvySpend.navigate('#/analytics')" style="background: none; border: none; padding: 0; cursor: pointer;">See All</button>
            </div>
            <div class="mt-sm">
              ${transactionsHtml}
            </div>
          </div>

          <!-- Historical recorded balances -->
          <div class="mb-xl">
            <h4 class="section-title text-xs font-bold text-secondary uppercase tracking-wider mb-sm" style="margin-bottom: 8px;">Weekly Balance History</h4>
            <div class="history-container">
              ${historyHtml}
            </div>
          </div>
        `;
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
            <p class="text-xs text-secondary mt-xs px-lg" style="line-height: 1.4;">Give every cedi a purpose! Allocate your wallet balance into specific funding buckets.</p>
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
        <div class="tab-group flex-center mb-lg" style="width: 100%; display: flex; border-bottom: 1px solid var(--border); padding-bottom: 2px;">
          <button type="button" class="tab ${activeTab === 'weekly' ? 'active' : ''} w-full" id="tab-weekly-spending" style="flex: 1; padding: 10px 0; border: none; background: transparent; font-weight: 600; font-size: 0.85rem;">Weekly Budget</button>
          <button type="button" class="tab ${activeTab === 'jobs' ? 'active' : ''} w-full" id="tab-money-jobs" style="flex: 1; padding: 10px 0; border: none; background: transparent; font-weight: 600; font-size: 0.85rem;">Money Jobs (Buckets)</button>
        </div>

        <!-- ───── WEEKLY BUDGET VIEW ───── -->
        <div id="weekly-tab-content" class="${activeTab === 'weekly' ? '' : 'hidden'}">
          ${weeklyTabHtml}
        </div>

        <!-- ───── MONEY JOBS VIEW ───── -->
        <div id="jobs-tab-content" class="${activeTab === 'jobs' ? '' : 'hidden'}">
          <!-- Overall Job Summary -->
          <div class="card p-lg mb-lg bg-card" style="border: 1px solid var(--border);">
            <div class="flex flex-between mb-sm">
              <div>
                <span class="text-xs text-secondary uppercase font-semibold">Total Cash Balance</span>
                <h3 class="text-xl font-extrabold mt-xs text-primary-text" style="color: var(--primary); margin: 4px 0 0;">${walletBalanceFormatted}</h3>
                <span class="text-xxs text-secondary mt-xs" style="display: block; margin-top: 4px;">Assigned: ${totalAssignedFormatted} • Unassigned: ${unallocatedFormatted}</span>
              </div>
              <div class="flex flex-column flex-center text-center" style="width: 72px; padding: 4px; border-radius: var(--radius-md); background: ${unallocatedCash > 0 ? 'var(--orange-light)' : 'var(--primary-light)'}; color: ${unallocatedCash > 0 ? 'var(--orange-dark)' : 'var(--primary-dark)'}; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <span style="font-size: 0.55rem; font-weight: 700; text-transform: uppercase;">Unassigned</span>
                <span style="font-size: 0.75rem; font-weight: 800;">${unallocatedFormatted}</span>
              </div>
            </div>
          </div>

          <!-- Jobs Recommendations -->
          <div class="mb-lg">
            <h3 class="section-title text-sm font-bold text-secondary uppercase tracking-wider mb-sm" style="margin-bottom: 8px;">Jobs Advisor</h3>
            ${jobsRecommendationsHtml}
          </div>

          <!-- Jobs list -->
          <div class="mb-xl">
            <div class="flex flex-between flex-center mb-sm" style="margin-bottom: 8px;">
              <h3 class="section-title text-sm font-bold text-secondary uppercase tracking-wider" style="margin: 0;">Money Jobs</h3>
              ${jobs.length > 0 ? `<button class="btn btn-outline btn-sm flex flex-center gap-xs" id="btn-add-job-top" style="padding: 4px 10px; font-size: 0.75rem; background: var(--bg-card); border-color: var(--border);"><i data-lucide="plus" style="width: 14px; height: 14px;"></i> Create Bucket</button>` : ''}
            </div>
            <div class="jobs-container">
              ${jobsHtml}
            </div>
          </div>
        </div>

        <!-- Floating Add Buttons -->
        <button class="fab btn-primary flex flex-center" id="fab-add-budget" style="position: fixed; bottom: 80px; right: 20px; z-index: 50; width: 56px; height: 56px; border-radius: 50%; box-shadow: var(--shadow-lg); display: ${activeTab === 'weekly' && wb && wb.limit > 0 ? 'flex' : 'none'}; border: none; align-items: center; justify-content: center;">
          <i data-lucide="plus" style="width: 24px; height: 24px; color: white;"></i>
        </button>
        <button class="fab btn-primary flex flex-center" id="fab-add-job" style="position: fixed; bottom: 80px; right: 20px; z-index: 50; width: 56px; height: 56px; border-radius: 50%; box-shadow: var(--shadow-lg); display: ${activeTab === 'jobs' && jobs.length > 0 ? 'flex' : 'none'}; border: none; align-items: center; justify-content: center;">
          <i data-lucide="plus" style="width: 24px; height: 24px; color: white;"></i>
        </button>
      `;
    },

    afterRender: function () {
      var weeklyTabBtn = document.getElementById('tab-weekly-spending');
      var jobsTabBtn = document.getElementById('tab-money-jobs');
      var weeklyContent = document.getElementById('weekly-tab-content');
      var jobsContent = document.getElementById('jobs-tab-content');
      
      var fabBudget = document.getElementById('fab-add-budget');
      var fabJob = document.getElementById('fab-add-job');

      // Tab switcher handlers
      if (weeklyTabBtn && jobsTabBtn) {
        weeklyTabBtn.addEventListener('click', function () {
          activeTab = 'weekly';
          weeklyTabBtn.classList.add('active');
          jobsTabBtn.classList.remove('active');
          weeklyContent.classList.remove('hidden');
          jobsContent.classList.add('hidden');
          
          var wb = DataStore.getWeeklyBudget();
          if (fabBudget) fabBudget.style.display = (wb && wb.limit > 0) ? 'flex' : 'none';
          if (fabJob) fabJob.style.display = 'none';
        });

        jobsTabBtn.addEventListener('click', function () {
          activeTab = 'jobs';
          jobsTabBtn.classList.add('active');
          weeklyTabBtn.classList.remove('active');
          jobsContent.classList.remove('hidden');
          weeklyContent.classList.add('hidden');
          
          if (fabJob) fabJob.style.display = DataStore.getMoneyJobs().length > 0 ? 'flex' : 'none';
          if (fabBudget) fabBudget.style.display = 'none';
        });
      }

      // Bind weekly budget triggers
      var btnSetWeeklyEmpty = document.getElementById('btn-set-weekly-budget-empty');
      if (btnSetWeeklyEmpty) {
        btnSetWeeklyEmpty.addEventListener('click', function () {
          if (SavvySpend.components.Modals) SavvySpend.components.Modals.setWeeklyBudget();
        });
      }

      var btnEditWeekly = document.getElementById('btn-edit-weekly-budget');
      if (btnEditWeekly) {
        btnEditWeekly.addEventListener('click', function () {
          if (SavvySpend.components.Modals) SavvySpend.components.Modals.setWeeklyBudget();
        });
      }

      if (fabBudget) {
        fabBudget.addEventListener('click', function () {
          // In weekly mode, FAB adds a new transaction to log spending easily!
          if (SavvySpend.components.Modals) SavvySpend.components.Modals.addTransaction();
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
