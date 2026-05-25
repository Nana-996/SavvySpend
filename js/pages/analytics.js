/**
 * SavvySpend — Spending Analytics Page
 */
(function () {
  'use strict';

  window.SavvySpend = window.SavvySpend || {};
  window.SavvySpend.pages = window.SavvySpend.pages || {};

  var currentPeriod = 'monthly'; // 'weekly' or 'monthly'
  var compareEnabled = false;

  var Analytics = {
    render: function (param) {
      var txns = DataStore.getTransactions();
      var isWeekly = currentPeriod === 'weekly';

      // 1. Calculate Period Spending
      var totalSpent = 0;
      var prevSpent = 0;

      var now = new Date();
      if (isWeekly) {
        // Current week (last 7 days)
        var oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        var twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        
        totalSpent = txns
          .filter(function (t) { return t.amount < 0 && new Date(t.date) >= oneWeekAgo; })
          .reduce(function (sum, t) { return sum + Math.abs(t.amount); }, 0);
          
        prevSpent = txns
          .filter(function (t) { return t.amount < 0 && new Date(t.date) >= twoWeeksAgo && new Date(t.date) < oneWeekAgo; })
          .reduce(function (sum, t) { return sum + Math.abs(t.amount); }, 0);
      } else {
        var currentYear = now.getFullYear();
        var currentMonth = now.getMonth(); // 0-11
        var currentMonthStr = currentYear + '-' + String(currentMonth + 1).padStart(2, '0');
        
        var prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        var prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        var prevMonthStr = prevYear + '-' + String(prevMonth + 1).padStart(2, '0');
        
        totalSpent = txns
          .filter(function (t) { return t.amount < 0 && t.date.startsWith(currentMonthStr); })
          .reduce(function (sum, t) { return sum + Math.abs(t.amount); }, 0);
          
        prevSpent = txns
          .filter(function (t) { return t.amount < 0 && t.date.startsWith(prevMonthStr); })
          .reduce(function (sum, t) { return sum + Math.abs(t.amount); }, 0);
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
        if (t.amount >= 0) return; // skip income
        
        var dateMatch = isWeekly ? (new Date(t.date) >= oneWeekAgoDate) : t.date.startsWith(filterDatePrefix);
        if (dateMatch) {
          categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Math.abs(t.amount);
        }
      });

      // Sort categories by total spent
      var sortedCats = Object.keys(categoryTotals).map(function (key) {
        var catInfo = window.CATEGORIES[key] || window.CATEGORIES.other;
        return {
          key: key,
          name: catInfo.name,
          icon: catInfo.icon,
          color: catInfo.color,
          value: categoryTotals[key]
        };
      }).sort(function (a, b) { return b.value - a.value; });

      var categoryLabels = sortedCats.map(function (c) { return c.name; });
      var categoryData = sortedCats.map(function (c) { return c.value; });
      var categoryColors = sortedCats.map(function (c) { return c.color; });

      var legendHtml = sortedCats.map(function (c) {
        var pct = totalSpent > 0 ? Math.round((c.value / totalSpent) * 100) : 0;
        return `
          <div class="flex flex-between flex-center py-xs" style="border-bottom: 1px solid var(--border-light);">
            <div class="flex flex-center gap-sm">
              <span class="category-dot" style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${c.color};"></span>
              <span class="text-xs font-semibold text-primary-text flex flex-center gap-xs">
                <i data-lucide="${c.icon}" style="width: 14px; height: 14px; color: ${c.color};"></i>
                <span>${c.name}</span>
              </span>
            </div>
            <div class="text-right">
              <span class="text-xs font-bold text-primary-text">${SavvySpend.formatCurrencyPlain(c.value)}</span>
              <span class="text-xxs text-secondary" style="font-size: 0.65rem; display: block;">${pct}%</span>
            </div>
          </div>
        `;
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
          trendLabels.push(weekdays[d.getDay()]);
          
          var dateStr = d.toISOString().split('T')[0];
          var daySpent = txns
            .filter(function (t) { return t.amount < 0 && t.date === dateStr; })
            .reduce(function (sum, t) { return sum + Math.abs(t.amount); }, 0);
          trendData.push(daySpent);
          
          if (compareEnabled) {
            var compD = new Date(now.getTime() - (i + 7) * 24 * 60 * 60 * 1000);
            var compDateStr = compD.toISOString().split('T')[0];
            var compDaySpent = txns
              .filter(function (t) { return t.amount < 0 && t.date === compDateStr; })
              .reduce(function (sum, t) { return sum + Math.abs(t.amount); }, 0);
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
          trendLabels.push(monthNames[targetMonth]);
          
          var prefix = targetYear + '-' + String(targetMonth + 1).padStart(2, '0');
          var monthSpent = txns
            .filter(function (t) { return t.amount < 0 && t.date.startsWith(prefix); })
            .reduce(function (sum, t) { return sum + Math.abs(t.amount); }, 0);
          trendData.push(monthSpent);
          
          if (compareEnabled) {
            var compYear = targetYear - 1;
            var compPrefix = compYear + '-' + String(targetMonth + 1).padStart(2, '0');
            var compMonthSpent = txns
              .filter(function (t) { return t.amount < 0 && t.date.startsWith(compPrefix); })
              .reduce(function (sum, t) { return sum + Math.abs(t.amount); }, 0);
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

      return `
        <div class="page-header mt-sm mb-md flex flex-between flex-center">
          <div>
            <h2 class="page-title text-2xl font-bold">Analytics</h2>
            <p class="page-subtitle text-xs text-secondary">Analyze your spending behaviors</p>
          </div>
          <button class="btn btn-outline btn-sm flex flex-center gap-xs" id="btn-csv-export" style="font-size: 0.75rem;">
            <i data-lucide="download" style="width: 14px; height: 14px;"></i> Export CSV
          </button>
        </div>

        <!-- Period Toggle Tabs -->
        <div class="form-group flex-center mb-lg">
          <div class="tab-group" style="width: 100%;">
            <button class="tab ${!isWeekly ? 'active' : ''} w-full" id="tab-monthly" style="flex: 1;">Monthly</button>
            <button class="tab ${isWeekly ? 'active' : ''} w-full" id="tab-weekly" style="flex: 1;">Weekly</button>
          </div>
        </div>

        <!-- Total Spent Metrics -->
        <div class="card p-lg mb-lg bg-card" style="border: 1px solid var(--border);">
          <span class="text-xs text-secondary uppercase font-semibold">Total Spent</span>
          <div class="flex flex-between flex-center mt-xs">
            <h2 class="text-2xl font-extrabold text-primary-text" style="letter-spacing: -0.5px;">${formattedTotal}</h2>
            <div class="flex flex-center gap-xs text-xs ${pctClass}">
              <i data-lucide="${pctIcon}" style="width: 16px; height: 16px;"></i>
              <span>${pctChangeText}</span>
            </div>
          </div>
        </div>

        <!-- Trend Bar Chart Section -->
        <div class="card p-md mb-lg bg-card" style="border: 1px solid var(--border);">
          <div class="flex flex-between flex-center mb-md">
            <h4 class="text-xs font-bold text-secondary uppercase tracking-wider">Spending Trends</h4>
            <div class="flex flex-center gap-sm">
              <span class="text-xxs text-secondary" style="font-size: 0.7rem;">Compare</span>
              <label class="toggle-switch">
                <input type="checkbox" id="compare-toggle" class="toggle-input" ${compareEnabled ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
          <div class="chart-container" style="position: relative; height: 180px;">
            <canvas id="barTrendChart"></canvas>
          </div>
        </div>

        <!-- Category Breakdown Donut Chart Section -->
        <div class="card p-md mb-xl bg-card" style="border: 1px solid var(--border);">
          <h4 class="text-xs font-bold text-secondary uppercase tracking-wider mb-md">Top Categories</h4>
          
          ${sortedCats.length > 0 ? `
            <div class="flex flex-center mb-md" style="height: 160px; position: relative;">
              <canvas id="donutCategoryChart"></canvas>
            </div>
            <div class="category-legend mt-md">
              ${legendHtml}
            </div>
          ` : `
            <div class="text-center py-lg text-secondary text-sm">
              No transactions recorded for this period.
            </div>
          `}
        </div>

        <!-- Regret Tracker Section -->
        <div class="card p-md mb-lg bg-card" style="border: 1px solid var(--border);">
          <div class="flex flex-between flex-center mb-md" style="display: flex; justify-content: space-between; align-items: center;">
            <h4 class="text-xs font-bold text-secondary uppercase tracking-wider">Regret Tracker</h4>
            <span class="text-xs font-bold text-negative">${SavvySpend.formatCurrencyPlain(totalRegretSpent)} in Regrets</span>
          </div>
          
          ${totalRatedCount > 0 ? `
            <div class="flex rounded-full overflow-hidden mb-md" style="height: 8px; background: var(--border-light); font-size: 0px; display: flex; border-radius: 9999px;">
              <div style="width: ${worthPct}%; background-color: #10B981; height: 100%;" title="Worth It: ${worthPct}%"></div>
              <div style="width: ${neutralPct}%; background-color: #9CA3AF; height: 100%;" title="Neutral: ${neutralPct}%"></div>
              <div style="width: ${regretPct}%; background-color: #EF4444; height: 100%;" title="Regret: ${regretPct}%"></div>
            </div>
            
            <div class="flex flex-between flex-center text-xs" style="display: flex; justify-content: space-between; align-items: center;">
              <div class="flex flex-center gap-xs" style="display: flex; align-items: center; gap: 4px;">
                <span class="category-dot" style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #10B981;"></span>
                <span class="text-secondary">Worth It: <strong>${worthPct}%</strong></span>
              </div>
              <div class="flex flex-center gap-xs" style="display: flex; align-items: center; gap: 4px;">
                <span class="category-dot" style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #9CA3AF;"></span>
                <span class="text-secondary">Neutral: <strong>${neutralPct}%</strong></span>
              </div>
              <div class="flex flex-center gap-xs" style="display: flex; align-items: center; gap: 4px;">
                <span class="category-dot" style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #EF4444;"></span>
                <span class="text-secondary">Regret: <strong>${regretPct}%</strong></span>
              </div>
            </div>
          ` : `
            <div class="text-center py-md text-secondary text-xs">
              No transactions recorded for this period.
            </div>
          `}
        </div>

        <!-- Nana Habits & Patterns Section -->
        <div class="card p-md mb-lg bg-card" style="border: 1px solid var(--border);">
          <h4 class="text-xs font-bold text-secondary uppercase tracking-wider mb-md">Nana Habits & Patterns</h4>
          <div class="flex flex-col gap-sm" style="display: flex; flex-direction: column; gap: 12px;">
            ${insights.map(function (insight, index) {
              var isLast = index === insights.length - 1;
              var borderStyle = isLast ? '' : 'border-bottom: 1px solid var(--border-light); padding-bottom: 12px;';
              return `
                <div class="flex gap-md py-sm" style="${borderStyle} align-items: flex-start; display: flex; gap: 12px;">
                  <div class="flex-center" style="width: 36px; height: 36px; border-radius: 50%; background-color: ${insight.color}15; color: ${insight.color}; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                    <i data-lucide="${insight.icon}" style="width: 18px; height: 18px;"></i>
                  </div>
                  <div style="flex: 1;">
                    <h5 class="text-xs font-bold text-primary-text mb-xs" style="margin: 0 0 4px 0;">${insight.title}</h5>
                    <p class="text-xs text-secondary" style="margin: 0; line-height: 1.4;">${insight.message}</p>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>


        <!-- Smart Spending Insight Card -->
        <div class="card p-md mb-md insight-card" style="border-left: 4px solid var(--purple); background: var(--bg-secondary);">
          <div class="flex gap-md">
            <i data-lucide="sparkles" style="width: 20px; height: 20px; color: var(--purple);"></i>
            <div>
              <h4 class="text-xs font-bold text-secondary uppercase tracking-wider mb-xs">Ai Insight</h4>
              <p class="text-sm text-primary-text font-medium" style="margin: 0; line-height: 1.4;">
                ${(function() {
                  var aiInsight = '';
                  if (isWeekly) {
                    var peakDay = '';
                    var peakAmount = 0;
                    var weekdaysList = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    var daySpending = {};
                    
                    for (var i = 6; i >= 0; i--) {
                      var d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                      var dateStr = d.toISOString().split('T')[0];
                      var dayName = weekdaysList[d.getDay()];
                      var daySpent = txns
                        .filter(function (t) { return t.amount < 0 && t.date === dateStr; })
                        .reduce(function (sum, t) { return sum + Math.abs(t.amount); }, 0);
                      daySpending[dayName] = (daySpending[dayName] || 0) + daySpent;
                    }
                    
                    Object.keys(daySpending).forEach(function (day) {
                      if (daySpending[day] > peakAmount) {
                        peakAmount = daySpending[day];
                        peakDay = day;
                      }
                    });

                    if (peakAmount > 0) {
                      aiInsight = `Your daily spending peaked on <strong>${peakDay}</strong> (spent ${SavvySpend.formatCurrencyPlain(peakAmount)}). Try checking your transactions on that day to see where you can optimize!`;
                    } else {
                      aiInsight = `Start logging your daily transactions to receive personalized weekly spending insights.`;
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
                        aiInsight = `Your highest spending this month was in <strong>${topCatName}</strong> (${SavvySpend.formatCurrencyPlain(topCatValue)}). Cutting back slightly on this category next month will help you fund your <strong>${activeGoal.name}</strong> goal even faster!`;
                      } else {
                        aiInsight = `Your highest spending this month was in <strong>${topCatName}</strong> (${SavvySpend.formatCurrencyPlain(topCatValue)}). Consider setting a budget for this category to stay on track.`;
                      }
                    } else {
                      if (activeGoal) {
                        aiInsight = `Set up a budget or log your first transaction this month to see how your spending habits impact your <strong>${activeGoal.name}</strong> goal.`;
                      } else {
                        aiInsight = `Create a custom budget and log your expenses to see personalized AI insights here.`;
                      }
                    }
                  }
                  return aiInsight;
                })()}
              </p>
            </div>
          </div>
        </div>
      `;
    },

    afterRender: function () {
      var txns = DataStore.getTransactions();
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
          trendLabels.push(weekdays[d.getDay()]);
          
          var dateStr = d.toISOString().split('T')[0];
          var daySpent = txns
            .filter(function (t) { return t.amount < 0 && t.date === dateStr; })
            .reduce(function (sum, t) { return sum + Math.abs(t.amount); }, 0);
          trendData.push(daySpent);
          
          if (compareEnabled) {
            var compD = new Date(now.getTime() - (i + 7) * 24 * 60 * 60 * 1000);
            var compDateStr = compD.toISOString().split('T')[0];
            var compDaySpent = txns
              .filter(function (t) { return t.amount < 0 && t.date === compDateStr; })
              .reduce(function (sum, t) { return sum + Math.abs(t.amount); }, 0);
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
          trendLabels.push(monthNames[targetMonth]);
          
          var prefix = targetYear + '-' + String(targetMonth + 1).padStart(2, '0');
          var monthSpent = txns
            .filter(function (t) { return t.amount < 0 && t.date.startsWith(prefix); })
            .reduce(function (sum, t) { return sum + Math.abs(t.amount); }, 0);
          trendData.push(monthSpent);
          
          if (compareEnabled) {
            var compYear = targetYear - 1;
            var compPrefix = compYear + '-' + String(targetMonth + 1).padStart(2, '0');
            var compMonthSpent = txns
              .filter(function (t) { return t.amount < 0 && t.date.startsWith(compPrefix); })
              .reduce(function (sum, t) { return sum + Math.abs(t.amount); }, 0);
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
          if (t.amount >= 0) return;
          var dateMatch = isWeekly ? (new Date(t.date) >= oneWeekAgoDate) : t.date.startsWith(filterDatePrefix);
          if (dateMatch) {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Math.abs(t.amount);
            totalSpent += Math.abs(t.amount);
          }
        });

        var sortedCats = Object.keys(categoryTotals).map(function (key) {
          var catInfo = window.CATEGORIES[key] || window.CATEGORIES.other;
          return {
            name: catInfo.name,
            color: catInfo.color,
            value: categoryTotals[key]
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
    },

    destroy: function () {
      if (SavvySpend.components.Charts) {
        SavvySpend.components.Charts.destroyAll();
      }
    }
  };

  window.SavvySpend.pages.Analytics = Analytics;
})();
