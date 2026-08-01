/**
 * SavvySpend — Spending Analytics Page
 */
(function () {
  'use strict';

  window.SavvySpend = window.SavvySpend || {};
  window.SavvySpend.pages = window.SavvySpend.pages || {};

  var currentPeriod = 'monthly'; // 'weekly' or 'monthly'
  var compareEnabled = false;

  function safeGet(obj, key) {
    if (!obj) return undefined;
    var desc = Object.getOwnPropertyDescriptor(obj, key);
    return desc ? desc.value : undefined;
  }

  var Analytics = {
    render: function (param) {
      var txns = DataStore.getTransactions().filter(function (t) { return !t.isBusiness; });
      var isWeekly = currentPeriod === 'weekly';

      // 1. Calculate Period Spending
      var totalSpent = 0;
      var prevSpent = 0;

      function calculateSpendingForFilter(filterFn) {
        return txns
          .filter(filterFn)
          .reduce(function (sum, t) {
            var spent = 0;
            if (t.amount < 0) {
              spent += Math.abs(t.amount);
            }
            if (t.productCost !== undefined && t.productCost !== null) {
              spent += t.productCost;
            }
            return sum + spent;
          }, 0);
      }

      var now = new Date();
      if (isWeekly) {
        // Current week (last 7 days)
        var oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        var twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        
        totalSpent = calculateSpendingForFilter(function (t) { return new Date(t.date) >= oneWeekAgo; });
        prevSpent = calculateSpendingForFilter(function (t) { return new Date(t.date) >= twoWeeksAgo && new Date(t.date) < oneWeekAgo; });
      } else {
        var currentYear = now.getFullYear();
        var currentMonth = now.getMonth(); // 0-11
        var currentMonthStr = currentYear + '-' + String(currentMonth + 1).padStart(2, '0');
        
        var prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        var prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        var prevMonthStr = prevYear + '-' + String(prevMonth + 1).padStart(2, '0');
        
        totalSpent = calculateSpendingForFilter(function (t) { return t.date.startsWith(currentMonthStr); });
        prevSpent = calculateSpendingForFilter(function (t) { return t.date.startsWith(prevMonthStr); });
      }

      // Calculate percentage change
      var pctChange = 0;
      var pctChangeText = '';
      var pctClass = 'text-positive';
      var pctIcon = 'trending-down'; // spending trending down is positive!

      if (prevSpent > 0) {
        pctChange = ((totalSpent - prevSpent) / prevSpent) * 100;
        if (pctChange > 0) {
          pctChangeText = `+${pctChange.toFixed(0)}% more spending`;
          pctClass = 'text-negative font-semibold';
          pctIcon = 'trending-up';
        } else if (pctChange < 0) {
          pctChangeText = `${pctChange.toFixed(0)}% less spending`;
          pctClass = 'text-positive font-semibold';
          pctIcon = 'trending-down';
        } else {
          pctChangeText = 'Same as last period';
          pctClass = 'text-secondary';
          pctIcon = 'minus';
        }
      } else {
        pctChangeText = 'No previous data';
        pctClass = 'text-secondary';
        pctIcon = 'minus';
      }

      var formattedTotal = SavvySpend.formatCurrencyPlain(totalSpent);

      // 2. Prepare Category Breakdown for Donut Chart
      var categoryTotals = {};
      var currentYear = now.getFullYear();
      var currentMonth = now.getMonth();
      var currentMonthStr = currentYear + '-' + String(currentMonth + 1).padStart(2, '0');
      var filterDatePrefix = isWeekly ? '' : currentMonthStr;
      var oneWeekAgoDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      txns.forEach(function (t) {
        var spent = 0;
        if (t.amount < 0) {
          spent += Math.abs(t.amount);
        }
        if (t.productCost !== undefined && t.productCost !== null) {
          spent += t.productCost;
        }
        if (spent === 0) return;
        
        var dateMatch = isWeekly ? (new Date(t.date) >= oneWeekAgoDate) : t.date.startsWith(filterDatePrefix);
        if (dateMatch) {
          var catKey = t.amount < 0 ? t.category : 'inventory';
          categoryTotals[catKey] = (categoryTotals[catKey] || 0) + spent;
        }
      });

      // Sort categories by total spent
      var sortedCats = Object.keys(categoryTotals).map(function (key) {
        var catInfo = safeGet(window.CATEGORIES, key) || window.CATEGORIES.other;
        return {
          key: key,
          name: catInfo.name,
          icon: catInfo.icon,
          color: catInfo.color,
          value: safeGet(categoryTotals, key)
        };
      }).sort(function (a, b) { return b.value - a.value; });

      var categoryLabels = sortedCats.map(function (c) { return c.name; });
      var categoryData = sortedCats.map(function (c) { return c.value; });
      var categoryColors = sortedCats.map(function (c) { return c.color; });

      var legendHtml = sortedCats.map(function (c) {
        var pct = totalSpent > 0 ? Math.round((c.value / totalSpent) * 100) : 0;
        return '<div class="flex flex-between flex-center py-xs" style="border-bottom: 1px solid var(--border-light);">' +
          '<div class="flex flex-center gap-sm">' +
            '<span class="category-dot" style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ' + SavvySpend.escapeHtml(c.color) + ';"></span>' +
            '<span class="text-xs font-semibold text-primary-text flex flex-center gap-xs">' +
              '<i data-lucide="' + SavvySpend.escapeHtml(c.icon) + '" style="width: 14px; height: 14px; color: ' + SavvySpend.escapeHtml(c.color) + ';"></i>' +
              '<span>' + SavvySpend.escapeHtml(c.name) + '</span>' +
            '</span>' +
          '</div>' +
          '<div class="text-right">' +
            '<span class="text-xs font-bold text-primary-text">' + SavvySpend.escapeHtml(SavvySpend.formatCurrencyPlain(c.value)) + '</span>' +
            '<span class="text-xxs text-secondary" style="font-size: 0.65rem; display: block;">' + pct + '%</span>' +
          '</div>' +
        '</div>';
      }).join('');

      if (sortedCats.length === 0) {
        legendHtml = `<p class="text-center text-secondary py-md text-xs">No spending recorded in this period.</p>`;
      }

      // 3. Prepare Trend Data for Bar Chart
      var trendLabels = [];
      var trendData = [];
      var compareTrendData = [];

      if (isWeekly) {
        var weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        for (var i = 6; i >= 0; i--) {
          var d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          trendLabels.push(safeGet(weekdays, d.getDay()));
          
          var dateStr = d.toISOString().split('T')[0];
          var daySpent = txns
            .filter(function (t) { return t.date === dateStr; })
            .reduce(function (sum, t) {
              var spent = 0;
              if (t.amount < 0) spent += Math.abs(t.amount);
              if (t.productCost !== undefined && t.productCost !== null) spent += t.productCost;
              return sum + spent;
            }, 0);
          trendData.push(daySpent);
          
          if (compareEnabled) {
            var compD = new Date(now.getTime() - (i + 7) * 24 * 60 * 60 * 1000);
            var compDateStr = compD.toISOString().split('T')[0];
            var compDaySpent = txns
              .filter(function (t) { return t.date === compDateStr; })
              .reduce(function (sum, t) {
                var spent = 0;
                if (t.amount < 0) spent += Math.abs(t.amount);
                if (t.productCost !== undefined && t.productCost !== null) spent += t.productCost;
                return sum + spent;
              }, 0);
            compareTrendData.push(compDaySpent);
          }
        }
      } else {
        var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        for (var i = 5; i >= 0; i--) {
          var targetMonth = now.getMonth() - i;
          var targetYear = now.getFullYear();
          if (targetMonth < 0) {
            targetMonth += 12;
            targetYear -= 1;
          }
          trendLabels.push(safeGet(monthNames, targetMonth));
          
          var prefix = targetYear + '-' + String(targetMonth + 1).padStart(2, '0');
          var monthSpent = txns
            .filter(function (t) { return t.date.startsWith(prefix); })
            .reduce(function (sum, t) {
              var spent = 0;
              if (t.amount < 0) spent += Math.abs(t.amount);
              if (t.productCost !== undefined && t.productCost !== null) spent += t.productCost;
              return sum + spent;
            }, 0);
          trendData.push(monthSpent);
          
          if (compareEnabled) {
            var compYear = targetYear - 1;
            var compPrefix = compYear + '-' + String(targetMonth + 1).padStart(2, '0');
            var compMonthSpent = txns
              .filter(function (t) { return t.date.startsWith(compPrefix); })
              .reduce(function (sum, t) {
                var spent = 0;
                if (t.amount < 0) spent += Math.abs(t.amount);
                if (t.productCost !== undefined && t.productCost !== null) spent += t.productCost;
                return sum + spent;
              }, 0);
            compareTrendData.push(compMonthSpent);
          }
        }
      }

      // Regret Tracker calculations
      var worthItCount = 0;
      var neutralCount = 0;
      var regretCount = 0;
      var totalRegretSpent = 0;
      var filterDatePrefix = isWeekly ? '' : currentMonthStr;
      var oneWeekAgoDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      var periodExpenses = txns.filter(function (t) {
        if (t.amount >= 0) return false;
        var dateMatch = isWeekly ? (new Date(t.date) >= oneWeekAgoDate) : t.date.startsWith(filterDatePrefix);
        return dateMatch;
      });

      var totalRatedCount = periodExpenses.length;

      periodExpenses.forEach(function (t) {
        if (t.rating === 'worth_it') {
          worthItCount++;
        } else if (t.rating === 'regret') {
          regretCount++;
          totalRegretSpent += Math.abs(t.amount);
        } else {
          neutralCount++;
        }
      });

      var worthPct = totalRatedCount > 0 ? Math.round((worthItCount / totalRatedCount) * 100) : 0;
      var regretPct = totalRatedCount > 0 ? Math.round((regretCount / totalRatedCount) * 100) : 0;
      var neutralPct = totalRatedCount > 0 ? (100 - worthPct - regretPct) : 0;
      if (neutralPct < 0) neutralPct = 0;

      var insights = DataStore.getHabitInsights();

      var html = '';
      html += '<div class="page-header mt-sm mb-md flex flex-between flex-center">';
      html += '  <div>';
      html += '    <h2 class="page-title text-2xl font-bold hero-title">Analytics</h2>';
      html += '    <p class="page-subtitle text-xs text-secondary hero-subtitle">Analyze your spending behaviors</p>';
      html += '  </div>';
      html += '  <button class="btn btn-outline btn-sm flex flex-center gap-xs" id="btn-csv-export" style="font-size: 0.75rem;">';
      html += '    <i data-lucide="download" style="width: 14px; height: 14px;"></i> Export CSV';
      html += '  </button>';
      html += '</div>';

      // Period Toggle Tabs
      html += '<div class="form-group flex-center mb-lg">';
      html += '  <div class="tab-group" style="width: 100%;">';
      html += '    <button class="tab ' + (!isWeekly ? 'active' : '') + ' w-full" id="tab-monthly" style="flex: 1;">Monthly</button>';
      html += '    <button class="tab ' + (isWeekly ? 'active' : '') + ' w-full" id="tab-weekly" style="flex: 1;">Weekly</button>';
      html += '  </div>';
      html += '</div>';

      // Total Spent Metrics
      html += '<div class="card p-lg mb-lg bg-card reveal reveal-d1" style="border: 1px solid var(--border);">';
      html += '  <span class="text-xs text-secondary uppercase font-semibold">Total Spent</span>';
      html += '  <div class="flex flex-between flex-center mt-xs">';
      html += '    <h2 class="text-2xl font-extrabold text-primary-text" style="letter-spacing: -0.5px;">' + SavvySpend.escapeHtml(formattedTotal) + '</h2>';
      html += '    <div class="flex flex-center gap-xs text-xs ' + SavvySpend.escapeHtml(pctClass) + '">';
      html += '      <i data-lucide="' + SavvySpend.escapeHtml(pctIcon) + '" style="width: 16px; height: 16px;"></i>';
      html += '      <span>' + SavvySpend.escapeHtml(pctChangeText) + '</span>';
      html += '    </div>';
      html += '  </div>';
      html += '</div>';

      // Trend Bar Chart Section
      html += '<div class="card p-md mb-lg bg-card reveal reveal-d2" style="border: 1px solid var(--border);">';
      html += '  <div class="flex flex-between flex-center mb-md">';
      html += '    <h4 class="text-xs font-bold text-secondary uppercase tracking-wider">Spending Trends</h4>';
      html += '    <div class="flex flex-center gap-sm">';
      html += '      <span class="text-xxs text-secondary" style="font-size: 0.7rem;">Compare</span>';
      html += '      <label class="toggle-switch">';
      html += '        <input type="checkbox" id="compare-toggle" class="toggle-input" ' + (compareEnabled ? 'checked' : '') + '>';
      html += '        <span class="toggle-slider"></span>';
      html += '      </label>';
      html += '    </div>';
      html += '  </div>';
      html += '  <div class="chart-container" style="position: relative; height: 180px;">';
      html += '    <canvas id="barTrendChart"></canvas>';
      html += '  </div>';
      html += '</div>';

      // Category Breakdown Donut Chart Section
      html += '<div class="card p-md mb-xl bg-card reveal reveal-d3" style="border: 1px solid var(--border);">';
      html += '  <h4 class="text-xs font-bold text-secondary uppercase tracking-wider mb-md">Top Categories</h4>';
      if (sortedCats.length > 0) {
        html += '  <div class="flex flex-center mb-md" style="height: 160px; position: relative;">';
        html += '    <canvas id="donutCategoryChart"></canvas>';
        html += '  </div>';
        html += '  <div class="category-legend mt-md">';
        html += legendHtml;
        html += '  </div>';
      } else {
        html += '  <div class="text-center py-lg text-secondary text-sm">';
        html += '    No transactions recorded for this period.';
        html += '  </div>';
      }
      html += '</div>';

      // Regret Tracker Section
      html += '<div class="card p-md mb-lg bg-card reveal reveal-d4" style="border: 1px solid var(--border);">';
      html += '  <div class="flex flex-between flex-center mb-md" style="display: flex; justify-content: space-between; align-items: center;">';
      html += '    <h4 class="text-xs font-bold text-secondary uppercase tracking-wider">Regret Tracker</h4>';
      html += '    <span class="text-xs font-bold text-negative">' + SavvySpend.escapeHtml(SavvySpend.formatCurrencyPlain(totalRegretSpent)) + ' in Regrets</span>';
      html += '  </div>';
      if (totalRatedCount > 0) {
        html += '  <div class="flex rounded-full overflow-hidden mb-md" style="height: 8px; background: var(--border-light); font-size: 0px; display: flex; border-radius: 9999px;">';
        html += '    <div style="width: ' + worthPct + '%; background-color: #10B981; height: 100%;" title="Worth It: ' + worthPct + '%"></div>';
        html += '    <div style="width: ' + neutralPct + '%; background-color: #9CA3AF; height: 100%;" title="Neutral: ' + neutralPct + '%"></div>';
        html += '    <div style="width: ' + regretPct + '%; background-color: #EF4444; height: 100%;" title="Regret: ' + regretPct + '%"></div>';
        html += '  </div>';
        html += '  ';
        html += '  <div class="flex flex-between flex-center text-xs" style="display: flex; justify-content: space-between; align-items: center;">';
        html += '    <div class="flex flex-center gap-xs" style="display: flex; align-items: center; gap: 4px;">';
        html += '      <span class="category-dot" style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #10B981;"></span>';
        html += '      <span class="text-secondary">Worth It: <strong>' + worthPct + '%</strong></span>';
        html += '    </div>';
        html += '    <div class="flex flex-center gap-xs" style="display: flex; align-items: center; gap: 4px;">';
        html += '      <span class="category-dot" style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #9CA3AF;"></span>';
        html += '      <span class="text-secondary">Neutral: <strong>' + neutralPct + '%</strong></span>';
        html += '    </div>';
        html += '    <div class="flex flex-center gap-xs" style="display: flex; align-items: center; gap: 4px;">';
        html += '      <span class="category-dot" style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #EF4444;"></span>';
        html += '      <span class="text-secondary">Regret: <strong>' + regretPct + '%</strong></span>';
        html += '    </div>';
        html += '  </div>';
      } else {
        html += '  <div class="text-center py-md text-secondary text-xs">';
        html += '    No transactions recorded for this period.';
        html += '  </div>';
      }
      html += '</div>';

      // Nana Habits & Patterns Section
      html += '<div class="card p-md mb-lg bg-card" style="border: 1px solid var(--border);">';
      html += '  <h4 class="text-xs font-bold text-secondary uppercase tracking-wider mb-md">Nana Habits & Patterns</h4>';
      html += '  <div class="flex flex-col gap-sm" style="display: flex; flex-direction: column; gap: 12px;">';
      
      var habitsHtml = insights.map(function (insight, index) {
        var isLast = index === insights.length - 1;
        var borderStyle = isLast ? '' : 'border-bottom: 1px solid var(--border-light); padding-bottom: 12px;';
        return '<div class="flex gap-md py-sm" style="' + borderStyle + ' align-items: flex-start; display: flex; gap: 12px;">' +
          '<div class="flex-center" style="width: 36px; height: 36px; border-radius: 50%; background-color: ' + SavvySpend.escapeHtml(insight.color) + '15; color: ' + SavvySpend.escapeHtml(insight.color) + '; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">' +
            '<i data-lucide="' + SavvySpend.escapeHtml(insight.icon) + '" style="width: 18px; height: 18px;"></i>' +
          '</div>' +
          '<div style="flex: 1;">' +
            '<h5 class="text-xs font-bold text-primary-text mb-xs" style="margin: 0 0 4px 0;">' + SavvySpend.escapeHtml(insight.title) + '</h5>' +
            '<p class="text-xs text-secondary" style="margin: 0; line-height: 1.4;">' + SavvySpend.escapeHtml(insight.message) + '</p>' +
          '</div>' +
        '</div>';
      }).join('');
      
      // Transaction Search & History
      var allExpenses = txns.filter(function (t) { return t.amount < 0; }).slice(0, 20);
      var txnListHtml = allExpenses.map(function (t) {
        var cat = window.CATEGORIES[t.category] || window.CATEGORIES.other;
        var dateLabel = SavvySpend.formatDateShort(t.date);
        return '<div class="transaction-item txn-search-item" data-merchant="' + SavvySpend.escapeHtml(t.merchant.toLowerCase()) + '" data-category="' + SavvySpend.escapeHtml(t.category) + '" data-id="' + t.id + '" style="cursor: pointer; padding: 10px; border-bottom: 1px solid var(--border-light);">' +
          '<div class="flex flex-center gap-sm">' +
          '<div class="flex flex-center" style="width: 32px; height: 32px; border-radius: 50%; background: ' + cat.color + '15; color: ' + cat.color + ';">' +
          '<i data-lucide="' + cat.icon + '" style="width: 14px; height: 14px;"></i></div>' +
          '<div><h5 class="text-xs font-bold" style="margin: 0;">' + SavvySpend.escapeHtml(t.merchant) + '</h5>' +
          '<span class="text-xxs text-secondary">' + cat.name + ' • ' + dateLabel + '</span></div></div>' +
          '<span class="text-xs font-semibold">' + SavvySpend.formatCurrency(t.amount) + '</span></div>';
      }).join('');

      html += '<div class="card p-md mb-lg bg-card" style="border: 1px solid var(--border);">';
      html += '  <h4 class="text-xs font-bold text-secondary uppercase tracking-wider mb-md">Recent Transactions</h4>';
      html += '  <div class="search-bar mb-md">';
      html += '    <span class="search-icon"><i data-lucide="search"></i></span>';
      html += '    <input class="form-input" type="text" id="txn-search-input" placeholder="Search transactions...">';
      html += '  </div>';
      html += '  <div class="transaction-list" id="analytics-txn-list">';
      html += txnListHtml || '<p class="text-center text-secondary py-md text-xs">No transactions found.</p>';
      html += '  </div>';
      html += '</div>';

      html += habitsHtml;
      html += '  </div>';
      html += '</div>';

      // Smart Spending Insight Card
      html += '<div class="card p-md mb-md insight-card" style="border-left: 4px solid var(--purple); background: var(--bg-secondary);">';
      html += '  <div class="flex gap-md">';
      html += '    <i data-lucide="sparkles" style="width: 20px; height: 20px; color: var(--purple);"></i>';
      html += '    <div>';
      html += '      <h4 class="text-xs font-bold text-secondary uppercase tracking-wider mb-xs">Ai Insight</h4>';
      html += '      <p class="text-sm text-primary-text font-medium" style="margin: 0; line-height: 1.4;">';
      
      var aiInsight = '';
      if (isWeekly) {
        var peakDay = '';
        var peakAmount = 0;
        var weekdaysList = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        var daySpending = {};
        
        for (var i = 6; i >= 0; i--) {
          var d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          var dateStr = d.toISOString().split('T')[0];
          var dayName = safeGet(weekdaysList, d.getDay());
          var daySpent = txns
            .filter(function (t) { return t.amount < 0 && t.date === dateStr; })
            .reduce(function (sum, t) { return sum + Math.abs(t.amount); }, 0);
          daySpending[dayName] = (safeGet(daySpending, dayName) || 0) + daySpent;
        }
        
        Object.keys(daySpending).forEach(function (day) {
          var currentDaySpent = safeGet(daySpending, day);
          if (currentDaySpent > peakAmount) {
            peakAmount = currentDaySpent;
            peakDay = day;
          }
        });

        if (peakAmount > 0) {
          aiInsight = 'Your daily spending peaked on <strong>' + SavvySpend.escapeHtml(peakDay) + '</strong> (spent ' + SavvySpend.escapeHtml(SavvySpend.formatCurrencyPlain(peakAmount)) + '). Try checking your transactions on that day to see where you can optimize!';
        } else {
          aiInsight = 'Start logging your daily transactions to receive personalized weekly spending insights.';
        }
      } else {
        var topCatName = '';
        var topCatValue = 0;
        if (sortedCats.length > 0) {
          topCatName = sortedCats[0].name;
          topCatValue = sortedCats[0].value;
        }

        var goals = DataStore.getGoals();
        var activeGoal = goals.length > 0 ? goals[0] : null;

        if (topCatValue > 0) {
          if (activeGoal) {
            aiInsight = 'Your highest spending this month was in <strong>' + SavvySpend.escapeHtml(topCatName) + '</strong> (' + SavvySpend.escapeHtml(SavvySpend.formatCurrencyPlain(topCatValue)) + '). Cutting back slightly on this category next month will help you fund your <strong>' + SavvySpend.escapeHtml(activeGoal.name) + '</strong> goal even faster!';
          } else {
            aiInsight = 'Your highest spending this month was in <strong>' + SavvySpend.escapeHtml(topCatName) + '</strong> (' + SavvySpend.escapeHtml(SavvySpend.formatCurrencyPlain(topCatValue)) + '). Consider setting a budget for this category to stay on track.';
          }
        } else {
          if (activeGoal) {
            aiInsight = 'Set up a budget or log your first transaction this month to see how your spending habits impact your <strong>' + SavvySpend.escapeHtml(activeGoal.name) + '</strong> goal.';
          } else {
            aiInsight = 'Create a custom budget and log your expenses to see personalized AI insights here.';
          }
        }
      }

      html += aiInsight;
      html += '      </p>';
      html += '    </div>';
      html += '  </div>';
      html += '</div>';

      return html;
    },

    afterRender: function () {
      var txns = DataStore.getTransactions().filter(function (t) { return !t.isBusiness; });
      var isWeekly = currentPeriod === 'weekly';

      // 1. Initialise Trend Chart
      var trendLabels = [];
      var trendData = [];
      var compareTrendData = [];
      var now = new Date();

      if (isWeekly) {
        var weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        for (var i = 6; i >= 0; i--) {
          var d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          trendLabels.push(safeGet(weekdays, d.getDay()));
          
          var dateStr = d.toISOString().split('T')[0];
          var daySpent = txns
            .filter(function (t) { return t.date === dateStr; })
            .reduce(function (sum, t) {
              var spent = 0;
              if (t.amount < 0) spent += Math.abs(t.amount);
              if (t.productCost !== undefined && t.productCost !== null) spent += t.productCost;
              return sum + spent;
            }, 0);
          trendData.push(daySpent);
          
          if (compareEnabled) {
            var compD = new Date(now.getTime() - (i + 7) * 24 * 60 * 60 * 1000);
            var compDateStr = compD.toISOString().split('T')[0];
            var compDaySpent = txns
              .filter(function (t) { return t.date === compDateStr; })
              .reduce(function (sum, t) {
                var spent = 0;
                if (t.amount < 0) spent += Math.abs(t.amount);
                if (t.productCost !== undefined && t.productCost !== null) spent += t.productCost;
                return sum + spent;
              }, 0);
            compareTrendData.push(compDaySpent);
          }
        }
      } else {
        var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        for (var i = 5; i >= 0; i--) {
          var targetMonth = now.getMonth() - i;
          var targetYear = now.getFullYear();
          if (targetMonth < 0) {
            targetMonth += 12;
            targetYear -= 1;
          }
          trendLabels.push(safeGet(monthNames, targetMonth));
          
          var prefix = targetYear + '-' + String(targetMonth + 1).padStart(2, '0');
          var monthSpent = txns
            .filter(function (t) { return t.date.startsWith(prefix); })
            .reduce(function (sum, t) {
              var spent = 0;
              if (t.amount < 0) spent += Math.abs(t.amount);
              if (t.productCost !== undefined && t.productCost !== null) spent += t.productCost;
              return sum + spent;
            }, 0);
          trendData.push(monthSpent);
          
          if (compareEnabled) {
            var compYear = targetYear - 1;
            var compPrefix = compYear + '-' + String(targetMonth + 1).padStart(2, '0');
            var compMonthSpent = txns
              .filter(function (t) { return t.date.startsWith(compPrefix); })
              .reduce(function (sum, t) {
                var spent = 0;
                if (t.amount < 0) spent += Math.abs(t.amount);
                if (t.productCost !== undefined && t.productCost !== null) spent += t.productCost;
                return sum + spent;
              }, 0);
            compareTrendData.push(compMonthSpent);
          }
        }
      }

      if (SavvySpend.components.Charts) {
        // Bar Trend Chart
        SavvySpend.components.Charts.createBarChart('barTrendChart', {
          labels: trendLabels,
          data: trendData,
          compareData: compareEnabled ? compareTrendData : null
        });

        // Donut Chart
        var totalSpent = 0;
        var categoryTotals = {};
        var currentYear = now.getFullYear();
        var currentMonth = now.getMonth();
        var currentMonthStr = currentYear + '-' + String(currentMonth + 1).padStart(2, '0');
        var filterDatePrefix = isWeekly ? '' : currentMonthStr;
        var oneWeekAgoDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        txns.forEach(function (t) {
          var spent = 0;
          if (t.amount < 0) {
            spent += Math.abs(t.amount);
          }
          if (t.productCost !== undefined && t.productCost !== null) {
            spent += t.productCost;
          }
          if (spent === 0) return;
          
          var dateMatch = isWeekly ? (new Date(t.date) >= oneWeekAgoDate) : t.date.startsWith(filterDatePrefix);
          if (dateMatch) {
            var catKey = t.amount < 0 ? t.category : 'inventory';
            categoryTotals[catKey] = (safeGet(categoryTotals, catKey) || 0) + spent;
            totalSpent += spent;
          }
        });

        var sortedCats = Object.keys(categoryTotals).map(function (key) {
          var catInfo = safeGet(window.CATEGORIES, key) || window.CATEGORIES.other;
          return {
            name: catInfo.name,
            color: catInfo.color,
            value: safeGet(categoryTotals, key)
          };
        }).sort(function (a, b) { return b.value - a.value; });

        if (sortedCats.length > 0) {
          var categoryLabels = sortedCats.map(function (c) { return c.name; });
          var categoryData = sortedCats.map(function (c) { return c.value; });
          var categoryColors = sortedCats.map(function (c) { return c.color; });

          SavvySpend.components.Charts.createDonutChart('donutCategoryChart', {
            labels: categoryLabels,
            data: categoryData,
            colors: categoryColors,
            centerText: SavvySpend.formatCurrencyPlain(totalSpent)
          });
        }
      }

      // 2. Bind Toggle Tabs
      var tabMonthly = document.getElementById('tab-monthly');
      var tabWeekly = document.getElementById('tab-weekly');

      if (tabMonthly && tabWeekly) {
        tabMonthly.addEventListener('click', function () {
          if (currentPeriod !== 'monthly') {
            currentPeriod = 'monthly';
            SavvySpend.components.Charts.destroyAll();
            SavvySpend.handleRoute();
          }
        });

        tabWeekly.addEventListener('click', function () {
          if (currentPeriod !== 'weekly') {
            currentPeriod = 'weekly';
            SavvySpend.components.Charts.destroyAll();
            SavvySpend.handleRoute();
          }
        });
      }

      // 3. Bind Compare Switch Toggle
      var compareToggle = document.getElementById('compare-toggle');
      if (compareToggle) {
        compareToggle.addEventListener('change', function (e) {
          compareEnabled = e.target.checked;
          SavvySpend.components.Charts.destroyAll();
          SavvySpend.handleRoute();
        });
      }

      // 4. Bind CSV Export
      var csvBtn = document.getElementById('btn-csv-export');
      if (csvBtn) {
        csvBtn.addEventListener('click', function () {
          try {
            var csvContent = DataStore.exportToCSV();
            var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            var url = URL.createObjectURL(blob);
            var link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', 'SavvySpend_Transactions_' + new Date().toISOString().split('T')[0] + '.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            SavvySpend.showToast('CSV export downloaded!', 'success');
            DataStore.addXP(10); // Reward for exporting data
          } catch (e) {
            console.error('CSV Export failed', e);
            SavvySpend.showToast('Failed to export CSV.', 'error');
          }
        });
      }

      // 5. Transaction Search Filter
      var searchInput = document.getElementById('txn-search-input');
      if (searchInput) {
        var debounceTimer = null;
        searchInput.addEventListener('input', function () {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(function () {
            var query = searchInput.value.toLowerCase().trim();
            var items = document.querySelectorAll('.txn-search-item');
            var visibleCount = 0;
            items.forEach(function (item) {
              var merchant = item.getAttribute('data-merchant') || '';
              var category = item.getAttribute('data-category') || '';
              var matches = !query || merchant.indexOf(query) !== -1 || category.indexOf(query) !== -1;
              item.style.display = matches ? '' : 'none';
              if (matches) visibleCount++;
            });
            var list = document.getElementById('analytics-txn-list');
            var emptyMsg = list ? list.querySelector('.search-empty-msg') : null;
            if (visibleCount === 0 && list) {
              if (!emptyMsg) {
                emptyMsg = document.createElement('p');
                emptyMsg.className = 'text-center text-secondary py-md text-xs search-empty-msg';
                emptyMsg.textContent = 'No matching transactions found.';
                list.appendChild(emptyMsg);
              }
              emptyMsg.style.display = '';
            } else if (emptyMsg) {
              emptyMsg.style.display = 'none';
            }
          }, 200);
        });
      }

      // 6. Bind Transaction Item Clicks
      var txnItems = document.querySelectorAll('.txn-search-item');
      txnItems.forEach(function (item) {
        item.addEventListener('click', function () {
          var id = item.getAttribute('data-id');
          if (id) SavvySpend.navigate('#/transaction/' + id);
        });
      });
    },

    destroy: function () {
      if (SavvySpend.components.Charts) {
        SavvySpend.components.Charts.destroyAll();
      }
    }
  };

  window.SavvySpend.pages.Analytics = Analytics;
})();
