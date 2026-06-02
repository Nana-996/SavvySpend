/**
 * SavvySpend — Business Hub Page
 */
(function () {
  'use strict';

  window.SavvySpend = window.SavvySpend || {};
  window.SavvySpend.pages = window.SavvySpend.pages || {};

  var activeTab = 'overview'; // persistent page tab: 'overview' | 'invoices' | 'taxes' | 'clients'
  var activeChartInstance = null;

  var BusinessHub = {
    render: function (param) {
      var txns = DataStore.getTransactions() || [];
      var invoices = DataStore.getInvoices() || [];
      var clients = DataStore.getClients() || [];
      var currencySymbol = (window.CURRENCIES[DataStore.getSettings().currency] || { symbol: 'GH₵' }).symbol;

      // 1. Math for Overview (P&L)
      var businessTxns = txns.filter(function (t) { return t.isBusiness; });
      var plStats = DataStore.getBusinessPL();
      var bizRevenue = plStats.revenue;
      var bizExpenses = plStats.expenses;
      var netProfit = plStats.netProfit;
      var operatingMargin = plStats.operatingMargin;

      // 2. Math for Invoices
      var totalInvoiced = invoices.reduce(function (sum, inv) { return sum + inv.amount; }, 0);
      var paidInvoiced = invoices
        .filter(function (inv) { return inv.status === 'paid'; })
        .reduce(function (sum, inv) { return sum + inv.amount; }, 0);
      
      var outstandingInvoiced = invoices
        .filter(function (inv) { return inv.status === 'unpaid' || inv.status === 'overdue'; })
        .reduce(function (sum, inv) { return sum + inv.amount; }, 0);

      // P&L Content
      var overviewTabHtml = '';
      if (businessTxns.length === 0) {
        overviewTabHtml = `
          <div class="text-center py-xl bg-card card" style="border: 1px dashed var(--border); margin-top: 16px;">
            <div class="flex flex-center" style="width: 64px; height: 64px; border-radius: 50%; background: var(--orange-light); color: var(--orange); margin: 0 auto 16px;">
              <i data-lucide="briefcase" style="width: 32px; height: 32px;"></i>
            </div>
            <h4 class="text-base font-bold text-primary-text">No business activities yet</h4>
            <p class="text-xs text-secondary mt-xs px-lg" style="line-height: 1.4;">
              Toggle "Business Transaction" when logging transactions or mark created invoices as paid to populate your Profit & Loss statements.
            </p>
            <button class="btn btn-primary btn-sm mt-md" onclick="SavvySpend.components.Modals.addTransaction()">Log Business Txn</button>
          </div>
        `;
      } else {
        var txnsListHtml = businessTxns.slice(0, 5).map(function (t) {
          var isExpense = t.amount < 0;
          var amountClass = isExpense ? 'font-semibold' : 'text-positive font-semibold';
          var amountFormatted = SavvySpend.formatCurrency(t.amount);
          var dateLabel = SavvySpend.formatDateShort(t.date);
          var cat = window.CATEGORIES[t.category] || window.CATEGORIES.other;

          return `
            <div class="flex flex-between flex-center py-sm" style="border-bottom: 1px solid var(--border-light); cursor: pointer;" onclick="SavvySpend.navigate('#/transaction/${t.id}')">
              <div class="flex flex-center gap-sm">
                <div class="flex flex-center" style="width: 28px; height: 28px; border-radius: 50%; background: ${cat.color}15; color: ${cat.color};">
                  <i data-lucide="${isExpense ? 'arrow-up-right' : 'arrow-down-left'}" style="width: 14px; height: 14px;"></i>
                </div>
                <div>
                  <h5 class="text-xs font-bold text-primary-text" style="margin: 0;">${t.merchant}</h5>
                  <span class="text-xxs text-secondary">${dateLabel} • ${cat.name}</span>
                </div>
              </div>
              <span class="text-xs ${amountClass}">${amountFormatted}</span>
            </div>
          `;
        }).join('');

        overviewTabHtml = `
          <!-- Dashboard grid metrics -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
            <div class="card p-md bg-card" style="border: 1px solid var(--border);">
              <span class="text-xxs text-secondary uppercase font-bold">Total Revenue</span>
              <h4 class="text-lg font-black text-positive mt-xs">${SavvySpend.formatCurrencyPlain(bizRevenue)}</h4>
            </div>
            <div class="card p-md bg-card" style="border: 1px solid var(--border);">
              <span class="text-xxs text-secondary uppercase font-bold">Expenses</span>
              <h4 class="text-lg font-black text-negative mt-xs">${SavvySpend.formatCurrencyPlain(bizExpenses)}</h4>
            </div>
          </div>

          <div class="card p-lg mb-lg bg-card" style="border: 1px solid var(--border);">
            <div class="flex flex-between mb-sm">
              <div>
                <span class="text-xs text-secondary uppercase font-semibold">Net Profit Margin</span>
                <h3 class="text-2xl font-black mt-xs text-primary-text">${SavvySpend.formatCurrency(netProfit)}</h3>
              </div>
              <span class="badge flex flex-center" style="background: ${netProfit >= 0 ? 'var(--primary-light)' : 'var(--red-light)'}; color: ${netProfit >= 0 ? 'var(--primary-dark)' : 'var(--red)'}; font-size: 0.75rem; padding: 4px 8px; border-radius: var(--radius-sm); height: 24px; font-weight: 700;">
                ${operatingMargin}% Margin
              </span>
            </div>
            
            <div class="progress-bar w-full" style="height: 6px; background: var(--bg-secondary);">
              <div class="progress-bar-fill" style="width: ${Math.max(0, Math.min(operatingMargin, 100))}%; background: var(--primary);"></div>
            </div>
          </div>

          <!-- P&L Chart Card -->
          <div class="card p-md mb-lg bg-card" style="border: 1px solid var(--border);">
            <h4 class="text-xs font-bold text-secondary uppercase tracking-wider mb-sm">Monthly Business Performance</h4>
            <div style="height: 180px; position: relative;">
              <canvas id="biz-chart"></canvas>
            </div>
          </div>

          <!-- Recent business transactions -->
          <div class="card p-md mb-lg bg-card" style="border: 1px solid var(--border);">
            <h4 class="text-xs font-bold text-secondary uppercase tracking-wider mb-sm">Recent Business Transactions</h4>
            <div class="mt-sm">
              ${txnsListHtml}
            </div>
          </div>
        `;
      }

      // Invoices Content
      var invoicesTabHtml = '';
      if (invoices.length === 0) {
        invoicesTabHtml = `
          <div class="text-center py-xl bg-card card" style="border: 1px dashed var(--border); margin-top: 16px;">
            <div class="flex flex-center" style="width: 64px; height: 64px; border-radius: 50%; background: var(--primary-light); color: var(--primary-dark); margin: 0 auto 16px;">
              <i data-lucide="receipt" style="width: 32px; height: 32px;"></i>
            </div>
            <h4 class="text-base font-bold text-primary-text">No invoices created</h4>
            <p class="text-xs text-secondary mt-xs px-lg" style="line-height: 1.4;">
              Create invoices to send to your clients. Once marked as paid, the amount will be recorded as business income automatically.
            </p>
            <button class="btn btn-primary btn-sm mt-md" id="btn-create-invoice-empty">Create First Invoice</button>
          </div>
        `;
      } else {
        var invoicesListHtml = invoices.map(function (inv) {
          var statusColor = 'var(--text-secondary)';
          var statusBg = 'var(--bg-secondary)';
          if (inv.status === 'paid') {
            statusColor = 'var(--primary)';
            statusBg = 'var(--primary-light)';
          } else if (inv.status === 'overdue') {
            statusColor = 'var(--red)';
            statusBg = 'var(--red-light)';
          } else if (inv.status === 'unpaid') {
            statusColor = 'var(--orange)';
            statusBg = 'var(--orange-light)';
          }

          var itemsCountLabel = inv.items.length + (inv.items.length === 1 ? ' item' : ' items');

          return `
            <div class="card p-md mb-md bg-card" style="border: 1px solid var(--border); display: flex; flex-direction: column; gap: 12px;">
              <div class="flex flex-between flex-center">
                <div>
                  <h4 class="text-xs font-bold text-secondary uppercase tracking-wider" style="margin: 0;">${inv.invoiceNumber}</h4>
                  <p class="text-sm font-bold text-primary-text mt-xxs" style="margin: 2px 0 0;">${inv.clientName}</p>
                </div>
                <span class="status-badge" style="background: ${statusBg}; color: statusColor; font-weight: 700; font-size: 0.65rem; padding: 4px 8px; border-radius: var(--radius-full); color: ${statusColor};">${inv.status.toUpperCase()}</span>
              </div>
              <div class="flex flex-between border-top pt-xs" style="border-color: var(--border-light); font-size: 0.75rem;">
                <span class="text-secondary">Due: <strong>${SavvySpend.formatDate(inv.dueDate)}</strong></span>
                <span class="font-bold text-primary-text">${SavvySpend.formatCurrencyPlain(inv.amount)}</span>
              </div>
              <div class="flex flex-between mt-xs pt-xs border-top" style="border-color: var(--border-light);">
                <span class="text-xxs text-secondary">${itemsCountLabel}</span>
                <div class="flex gap-xs">
                  <button class="btn btn-outline btn-sm btn-view-invoice" data-id="${inv.id}" style="padding: 4px 8px; font-size: 0.7rem; background: var(--bg-card);"><i data-lucide="printer" style="width: 12px; height: 12px; display: inline-block;"></i> View</button>
                  ${inv.status !== 'paid' ? `<button class="btn btn-primary btn-sm btn-pay-invoice" data-id="${inv.id}" style="padding: 4px 8px; font-size: 0.7rem;">Mark Paid</button>` : ''}
                  <button class="btn btn-outline btn-sm text-negative btn-delete-invoice" data-id="${inv.id}" style="padding: 4px 8px; font-size: 0.7rem; border-color: var(--red-light); background: var(--bg-card);">Delete</button>
                </div>
              </div>
            </div>
          `;
        }).join('');

        invoicesTabHtml = `
          <!-- Invoices Math summary cards -->
          <div style="display: grid; grid-template-columns: 1fr 1.2fr 1fr; gap: 8px; margin-bottom: 16px;">
            <div class="card p-xs text-center bg-card" style="border: 1px solid var(--border); padding: 8px 4px;">
              <span class="text-xxs text-secondary uppercase font-bold" style="font-size: 0.55rem;">Invoiced</span>
              <p class="text-xs font-black mt-xxs" style="margin-top: 2px;">${SavvySpend.formatCurrencyPlain(totalInvoiced)}</p>
            </div>
            <div class="card p-xs text-center bg-card" style="border: 1px solid var(--border); padding: 8px 4px; border-left: 3px solid var(--orange);">
              <span class="text-xxs text-secondary uppercase font-bold" style="font-size: 0.55rem; color: var(--orange);">Outstanding</span>
              <p class="text-xs font-black mt-xxs" style="margin-top: 2px; color: var(--orange);">${SavvySpend.formatCurrencyPlain(outstandingInvoiced)}</p>
            </div>
            <div class="card p-xs text-center bg-card" style="border: 1px solid var(--border); padding: 8px 4px; border-left: 3px solid var(--primary);">
              <span class="text-xxs text-secondary uppercase font-bold" style="font-size: 0.55rem; color: var(--primary);">Paid</span>
              <p class="text-xs font-black mt-xxs" style="margin-top: 2px; color: var(--primary);">${SavvySpend.formatCurrencyPlain(paidInvoiced)}</p>
            </div>
          </div>

          <div class="flex flex-between flex-center mb-sm">
            <h4 class="text-xs font-bold text-secondary uppercase tracking-wider" style="margin: 0;">Issued Invoices</h4>
            <button class="btn btn-primary btn-sm flex flex-center gap-xxs" id="btn-create-invoice-top" style="padding: 6px 12px;"><i data-lucide="plus" style="width: 14px; height: 14px;"></i> Create Invoice</button>
          </div>

          <div class="invoices-list mt-sm">
            ${invoicesListHtml}
          </div>
        `;
      }

      // Taxes Content
      var taxesTabHtml = '';
      taxesTabHtml = `
        <div class="card p-lg mb-lg bg-card" style="border: 1px solid var(--border);">
          <span class="text-xs text-secondary uppercase font-semibold">Business Net Profit</span>
          <h2 class="text-2xl font-black text-primary-text mt-xs" style="margin: 4px 0 8px;">${SavvySpend.formatCurrency(netProfit)}</h2>
          <p class="text-xxs text-secondary" style="line-height: 1.4; margin: 0;">This is calculated as Total Business Revenue minus Total Business Expenses.</p>
        </div>

        <div class="card p-lg mb-lg bg-card" style="border: 1px solid var(--border); display: flex; flex-direction: column; gap: 16px;">
          <div>
            <h4 class="text-xs font-bold text-secondary uppercase tracking-wider mb-xs">Tax Estimation Reserve</h4>
            <p class="text-xxs text-secondary" style="line-height: 1.3; margin: 0;">Adjust the tax rate slider to estimate how much to reserve for tax season.</p>
          </div>

          <div class="flex flex-between flex-center" style="margin-top: 8px;">
            <span class="text-xs text-secondary">Estimated Tax Rate:</span>
            <span class="text-sm font-bold text-primary-text" id="lbl-tax-rate">15%</span>
          </div>

          <div style="position: relative; padding: 4px 0;">
            <input type="range" id="slider-tax-rate" min="0" max="50" value="15" style="width: 100%; accent-color: var(--primary); cursor: pointer;">
          </div>

          <div class="flex flex-between flex-center border-top pt-md" style="border-color: var(--border-light); margin-top: 8px;">
            <span class="text-xs text-secondary font-semibold">Estimated Reserve Due:</span>
            <span class="text-base font-black text-negative" id="lbl-tax-reserve-due">${SavvySpend.formatCurrency(netProfit * 0.15)}</span>
          </div>

          <button class="btn btn-primary w-full mt-sm" id="btn-allocate-tax-reserve">
            <i data-lucide="piggy-bank"></i> Allocate to Tax Goal
          </button>
        </div>

        <div class="card p-md bg-secondary" style="border: 1px dashed var(--border);">
          <div class="flex gap-sm">
            <i data-lucide="info" style="color: var(--text-secondary); width: 20px; height: 20px; flex-shrink: 0;"></i>
            <div>
              <h5 class="text-xs font-bold text-primary-text mb-xxs" style="margin: 0 0 2px;">Setting Aside Tax Funds</h5>
              <p class="text-xxs text-secondary" style="line-height: 1.4; margin: 0;">
                Sole proprietors and freelancers are recommended to save 15-25% of net profit for quarterly income tax. Saving this automatically in a dedicated goal keeps your cashflow healthy.
              </p>
            </div>
          </div>
        </div>
      `;

      // Clients Content
      var clientsTabHtml = '';
      if (clients.length === 0) {
        clientsTabHtml = `
          <div class="text-center py-xl bg-card card" style="border: 1px dashed var(--border); margin-top: 16px;">
            <div class="flex flex-center" style="width: 64px; height: 64px; border-radius: 50%; background: var(--primary-light); color: var(--primary-dark); margin: 0 auto 16px;">
              <i data-lucide="users" style="width: 32px; height: 32px;"></i>
            </div>
            <h4 class="text-base font-bold text-primary-text">No clients registered</h4>
            <p class="text-xs text-secondary mt-xs px-lg" style="line-height: 1.4;">
              Save your client directory here. It lets you select clients easily when generating invoices and billing.
            </p>
            <button class="btn btn-primary btn-sm mt-md" id="btn-create-client-empty">Add First Client</button>
          </div>
        `;
      } else {
        var clientsListHtml = clients.map(function (c) {
          var clientInvoices = invoices.filter(function (inv) { return inv.clientId === c.id; });
          var totalClientInvoiced = clientInvoices.reduce(function (sum, inv) { return sum + inv.amount; }, 0);
          var activeInvoicesCount = clientInvoices.filter(function (inv) { return inv.status === 'unpaid' || inv.status === 'overdue'; }).length;

          return `
            <div class="card p-md mb-md bg-card client-card" data-id="${c.id}" style="border: 1px solid var(--border); cursor: pointer; transition: transform 0.2s;">
              <div class="flex flex-between flex-center">
                <div>
                  <h4 class="text-sm font-bold text-primary-text" style="margin: 0;">${c.company}</h4>
                  <span class="text-xs text-secondary mt-xxs" style="display: block; margin-top: 2px;">${c.name} • ${c.phone || c.email}</span>
                </div>
                <i data-lucide="chevron-right" class="text-tertiary" style="width: 16px; height: 16px;"></i>
              </div>
              <div class="flex flex-between mt-sm pt-sm border-top" style="border-color: var(--border-light); font-size: 0.75rem;">
                <span class="text-secondary">Active Invoices: <strong>${activeInvoicesCount}</strong></span>
                <span class="text-secondary">Invoiced Total: <strong class="text-primary-text">${SavvySpend.formatCurrencyPlain(totalClientInvoiced)}</strong></span>
              </div>
            </div>
          `;
        }).join('');

        clientsTabHtml = `
          <div class="flex flex-between flex-center mb-sm">
            <h4 class="text-xs font-bold text-secondary uppercase tracking-wider" style="margin: 0;">Client Directory</h4>
            <button class="btn btn-primary btn-sm flex flex-center gap-xxs" id="btn-create-client-top" style="padding: 6px 12px;"><i data-lucide="plus" style="width: 14px; height: 14px;"></i> Add Client</button>
          </div>

          <div class="clients-list mt-sm">
            ${clientsListHtml}
          </div>
        `;
      }

      return `
        <div class="page-header flex flex-between mt-sm mb-lg">
          <div>
            <button class="btn-icon mb-xs" onclick="SavvySpend.navigate('#/profile')" style="margin-left: -8px;">
              <i data-lucide="arrow-left"></i>
            </button>
            <h1 class="page-title text-2xl font-black">Business Hub</h1>
            <p class="page-subtitle text-xs text-secondary">Invoices, P&L statements, and tax planning.</p>
          </div>
        </div>

        <!-- Sliding Tab Selector -->
        <div class="tab-group flex-center mb-lg" style="width: 100%; display: flex; border-bottom: 1px solid var(--border); padding-bottom: 2px;">
          <button type="button" class="tab ${activeTab === 'overview' ? 'active' : ''} w-full" id="tab-biz-overview" style="flex: 1; padding: 10px 0; border: none; background: transparent; font-weight: 600; font-size: 0.8rem; text-align: center;">P&L</button>
          <button type="button" class="tab ${activeTab === 'invoices' ? 'active' : ''} w-full" id="tab-biz-invoices" style="flex: 1; padding: 10px 0; border: none; background: transparent; font-weight: 600; font-size: 0.8rem; text-align: center;">Invoices</button>
          <button type="button" class="tab ${activeTab === 'taxes' ? 'active' : ''} w-full" id="tab-biz-taxes" style="flex: 1; padding: 10px 0; border: none; background: transparent; font-weight: 600; font-size: 0.8rem; text-align: center;">Taxes</button>
          <button type="button" class="tab ${activeTab === 'clients' ? 'active' : ''} w-full" id="tab-biz-clients" style="flex: 1; padding: 10px 0; border: none; background: transparent; font-weight: 600; font-size: 0.8rem; text-align: center;">Clients</button>
        </div>

        <!-- Tab contents -->
        <div id="biz-tab-content">
          ${(function () {
            if (activeTab === 'overview') return overviewTabHtml;
            if (activeTab === 'invoices') return invoicesTabHtml;
            if (activeTab === 'taxes') return taxesTabHtml;
            if (activeTab === 'clients') return clientsTabHtml;
            return '';
          })()}
        </div>
      `;
    },

    afterRender: function (param) {
      var self = this;
      var tabOverview = document.getElementById('tab-biz-overview');
      var tabInvoices = document.getElementById('tab-biz-invoices');
      var tabTaxes = document.getElementById('tab-biz-taxes');
      var tabClients = document.getElementById('tab-biz-clients');

      // Bind tabs click
      if (tabOverview && tabInvoices && tabTaxes && tabClients) {
        tabOverview.addEventListener('click', function () { activeTab = 'overview'; SavvySpend.handleRoute(); });
        tabInvoices.addEventListener('click', function () { activeTab = 'invoices'; SavvySpend.handleRoute(); });
        tabTaxes.addEventListener('click', function () { activeTab = 'taxes'; SavvySpend.handleRoute(); });
        tabClients.addEventListener('click', function () { activeTab = 'clients'; SavvySpend.handleRoute(); });
      }

      // ── Overview Tab Logic (Render charts if tab is overview) ──
      if (activeTab === 'overview') {
        var txns = DataStore.getTransactions() || [];
        var bizTxns = txns.filter(function (t) { return t.isBusiness; });

        if (bizTxns.length > 0) {
          // Prepare monthly breakdown
          var monthlyData = {};
          bizTxns.forEach(function (t) {
            var mLabel = t.date.substring(0, 7); // YYYY-MM
            monthlyData[mLabel] = monthlyData[mLabel] || { income: 0, expense: 0 };
            if (t.amount > 0) {
              monthlyData[mLabel].income += t.amount;
            } else {
              monthlyData[mLabel].expense += Math.abs(t.amount);
            }
          });

          // Sort months chronologically
          var months = Object.keys(monthlyData).sort();
          if (months.length > 0) {
            // Keep maximum last 6 months
            months = months.slice(-6);
            
            var revenues = months.map(function (m) { return monthlyData[m].income; });
            var expenses = months.map(function (m) { return monthlyData[m].expense; });
            var monthNames = months.map(function (m) {
              var d = new Date(m + '-02');
              return d.toLocaleDateString('en-US', { month: 'short' });
            });

            // Initialize bar chart
            setTimeout(function () {
              var canvas = document.getElementById('biz-chart');
              if (!canvas) return;

              var ctx = canvas.getContext('2d');
              var isDark = document.body.classList.contains('dark');
              var gridColor = isDark ? '#334155' : '#E5E7EB';
              var textColor = isDark ? '#94A3B8' : '#6B7280';

              if (activeChartInstance) {
                activeChartInstance.destroy();
              }

              activeChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                  labels: monthNames,
                  datasets: [
                    {
                      label: 'Revenue',
                      data: revenues,
                      backgroundColor: '#10B981',
                      borderRadius: 4,
                      maxBarThickness: 12
                    },
                    {
                      label: 'Expenses',
                      data: expenses,
                      backgroundColor: '#EF4444',
                      borderRadius: 4,
                      maxBarThickness: 12
                    }
                  ]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top',
                      labels: {
                        color: textColor,
                        font: { family: 'Inter', size: 10 }
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: { display: false },
                      ticks: { color: textColor, font: { family: 'Inter', size: 10 } }
                    },
                    y: {
                      grid: { color: gridColor },
                      ticks: {
                        color: textColor,
                        font: { family: 'Inter', size: 9 },
                        callback: function (val) {
                          var symbol = (window.CURRENCIES[DataStore.getSettings().currency] || { symbol: 'GH₵' }).symbol;
                          return symbol + val;
                        }
                      }
                    }
                  }
                }
              });
            }, 60);
          }
        }
      }

      // ── Invoices Tab Logic ──
      if (activeTab === 'invoices') {
        // Create Invoice top
        var createInvTop = document.getElementById('btn-create-invoice-top');
        if (createInvTop) {
          createInvTop.addEventListener('click', function () {
            SavvySpend.components.Modals.addInvoice();
          });
        }
        
        // Create Invoice empty state
        var createInvEmpty = document.getElementById('btn-create-invoice-empty');
        if (createInvEmpty) {
          createInvEmpty.addEventListener('click', function () {
            SavvySpend.components.Modals.addInvoice();
          });
        }

        // View/Print Invoice buttons
        var viewInvBtns = document.querySelectorAll('.btn-view-invoice');
        viewInvBtns.forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-id');
            self.viewInvoice(id);
          });
        });

        // Pay Invoice buttons
        var payInvBtns = document.querySelectorAll('.btn-pay-invoice');
        payInvBtns.forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-id');
            var inv = DataStore.getInvoices().find(function (i) { return i.id === id; });
            if (!inv) return;

            SavvySpend.confirmAction('Mark invoice ' + inv.invoiceNumber + ' as paid? This will automatically create an income transaction.', function () {
              // Create transaction
              var currencyCode = DataStore.getSettings().currency || 'GHS';
              var t = {
                id: 'tx_' + SavvySpend.generateId(),
                amount: inv.amount,
                merchant: inv.clientName + ' Invoice',
                category: 'income',
                date: new Date().toISOString().split('T')[0],
                time: new Date().toTimeString().slice(0, 5),
                paymentMethod: 'Bank Transfer',
                paymentLast4: '0000',
                status: 'completed',
                notes: 'Settled payment for invoice ' + inv.invoiceNumber,
                tags: ['business', 'invoice'],
                currency: currencyCode,
                isBusiness: true,
                invoiceId: inv.id
              };

              DataStore.addTransaction(t);
              DataStore.updateInvoice(id, { status: 'paid', txnId: t.id });
              DataStore.addXP(25);
              SavvySpend.showToast('Invoice marked paid +25 XP!', 'success');
              SavvySpend.handleRoute();
            });
          });
        });

        // Delete Invoice buttons
        var delInvBtns = document.querySelectorAll('.btn-delete-invoice');
        delInvBtns.forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-id');
            SavvySpend.confirmAction('Are you sure you want to delete this invoice? Linked payment transactions will remain intact.', function () {
              DataStore.deleteInvoice(id);
              SavvySpend.showToast('Invoice deleted.', 'info');
              SavvySpend.handleRoute();
            });
          });
        });
      }

      // ── Taxes Tab Logic ──
      if (activeTab === 'taxes') {
        var slider = document.getElementById('slider-tax-rate');
        var lblRate = document.getElementById('lbl-tax-rate');
        var lblReserve = document.getElementById('lbl-tax-reserve-due');
        var btnAllocate = document.getElementById('btn-allocate-tax-reserve');

        var txns = DataStore.getTransactions() || [];
        var bizTxns = txns.filter(function (t) { return t.isBusiness; });
        var bizRev = bizTxns.filter(function (t) { return t.amount > 0; }).reduce(function (sum, t) { return sum + t.amount; }, 0);
        var bizExp = bizTxns.filter(function (t) { return t.amount < 0; }).reduce(function (sum, t) { return sum + Math.abs(t.amount); }, 0);
        var profit = bizRev - bizExp;

        if (slider && lblRate && lblReserve) {
          slider.addEventListener('input', function () {
            var rate = parseInt(slider.value);
            lblRate.textContent = rate + '%';
            var reserveAmount = Math.max(0, profit) * (rate / 100);
            lblReserve.textContent = SavvySpend.formatCurrency(reserveAmount);
          });
        }

        if (btnAllocate) {
          btnAllocate.addEventListener('click', function () {
            var rate = parseInt(slider.value) || 15;
            var reserveAmount = Math.max(0, profit) * (rate / 100);

            if (reserveAmount <= 0) {
              SavvySpend.showToast('You have no net profit to reserve taxes on yet. Log some business income first!', 'warning');
              return;
            }

            // Check if savings goal "Tax Reserve" exists
            var goals = DataStore.getGoals() || [];
            var taxGoal = goals.find(function (g) { return g.name.toLowerCase().indexOf('tax') !== -1; });

            if (!taxGoal) {
              // Create it
              var newGoal = {
                id: 'goal_' + SavvySpend.generateId(),
                name: 'Tax Reserve',
                target: Math.ceil(reserveAmount * 1.5),
                current: 0,
                deadline: new Date().getFullYear() + '-12-31',
                icon: 'shield',
                color: '#EC4899',
                contributions: []
              };
              DataStore.addGoal(newGoal);
              taxGoal = newGoal;
              SavvySpend.showToast('Created new Savings Goal: Tax Reserve!', 'success');
            }

            // Trigger add funds modal for the goal!
            if (SavvySpend.components.Modals && SavvySpend.components.Modals.addFunds) {
              SavvySpend.components.Modals.addFunds(taxGoal.id);
            }
          });
        }
      }

      // ── Clients Tab Logic ──
      if (activeTab === 'clients') {
        var createClientTop = document.getElementById('btn-create-client-top');
        if (createClientTop) {
          createClientTop.addEventListener('click', function () {
            SavvySpend.components.Modals.addClient();
          });
        }

        var createClientEmpty = document.getElementById('btn-create-client-empty');
        if (createClientEmpty) {
          createClientEmpty.addEventListener('click', function () {
            SavvySpend.components.Modals.addClient();
          });
        }

        var clientCards = document.querySelectorAll('.client-card');
        clientCards.forEach(function (card) {
          card.addEventListener('click', function () {
            var id = card.getAttribute('data-id');
            SavvySpend.components.Modals.addClient(id);
          });
        });
      }
    },

    viewInvoice: function (invId) {
      var inv = DataStore.getInvoices().find(function (i) { return i.id === invId; });
      if (!inv) return;
      var client = DataStore.getClients().find(function (c) { return c.id === inv.clientId; });
      var currencySymbol = (window.CURRENCIES[DataStore.getSettings().currency] || { symbol: 'GH₵' }).symbol;

      var itemsHtml = inv.items.map(function (it) {
        var total = it.quantity * it.rate;
        return `
          <tr style="border-bottom: 1px solid var(--border-light);">
            <td style="padding: 10px 0; font-size: 0.8rem; text-align: left; color: var(--text-primary);">${it.description}</td>
            <td style="padding: 10px 0; font-size: 0.8rem; text-align: center; color: var(--text-secondary);">${it.quantity}</td>
            <td style="padding: 10px 0; font-size: 0.8rem; text-align: right; color: var(--text-secondary);">${SavvySpend.formatCurrencyPlain(it.rate)}</td>
            <td style="padding: 10px 0; font-size: 0.8rem; text-align: right; font-weight: 700; color: var(--text-primary);">${SavvySpend.formatCurrencyPlain(total)}</td>
          </tr>
        `;
      }).join('');

      var subtotal = inv.items.reduce(function (sum, it) { return sum + (it.quantity * it.rate); }, 0);
      var taxAmt = subtotal * (inv.taxRate / 100);
      var grandTotal = subtotal + taxAmt;

      var html = `
        <div class="modal-header flex flex-between" style="border-bottom: 1px solid var(--border-light); padding-bottom: 12px;">
          <h3 class="modal-title">${inv.invoiceNumber}</h3>
          <button class="btn-icon" onclick="SavvySpend.closeModal()"><i data-lucide="x"></i></button>
        </div>
        <div class="invoice-print-container" style="padding: 16px 4px; font-family: var(--font-family); color: var(--text-primary); max-height: 65vh; overflow-y: auto;">
          <div class="flex flex-between" style="margin-bottom: 24px; display: flex; justify-content: space-between;">
            <div>
              <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--primary); margin: 0;">SavvySpend Business</h4>
              <p style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 4px;">Professional Invoice</p>
            </div>
            <div style="text-align: right;">
              <span class="status-badge" style="background: ${inv.status === 'paid' ? 'var(--primary-light)' : inv.status === 'overdue' ? 'var(--red-light)' : 'var(--orange-light)'}; color: ${inv.status === 'paid' ? 'var(--primary)' : inv.status === 'overdue' ? 'var(--red)' : 'var(--orange)'}; font-weight: 700; border-radius: var(--radius-full); font-size: 0.7rem; padding: 4px 10px; border: 1px solid transparent;">
                ${inv.status.toUpperCase()}
              </span>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; display: flex; justify-content: space-between;">
            <div>
              <h5 style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 4px;">Billed To:</h5>
              <p style="font-size: 0.85rem; font-weight: 700; margin: 0;">${client ? client.company : inv.clientName}</p>
              <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">${client ? client.name : ''}</p>
              <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">${client && client.email ? client.email : ''}</p>
              <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">${client && client.address ? client.address : ''}</p>
            </div>
            <div style="text-align: right;">
              <h5 style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 4px;">Invoice Details:</h5>
              <p style="font-size: 0.75rem; color: var(--text-secondary); margin: 0;">Date: <strong>${SavvySpend.formatDate(inv.date)}</strong></p>
              <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">Due Date: <strong>${SavvySpend.formatDate(inv.dueDate)}</strong></p>
              <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">Total Due: <strong>${SavvySpend.formatCurrencyPlain(inv.amount)}</strong></p>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border); color: var(--text-secondary);">
                <th style="padding: 8px 0; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; text-align: left;">Item Description</th>
                <th style="padding: 8px 0; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; text-align: center; width: 50px;">Qty</th>
                <th style="padding: 8px 0; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; text-align: right; width: 80px;">Rate</th>
                <th style="padding: 8px 0; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; text-align: right; width: 100px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="flex flex-column gap-xs" style="align-items: flex-end; display: flex; flex-direction: column; justify-content: flex-end; margin-bottom: 24px;">
            <div style="width: 200px;">
              <div class="flex flex-between text-xs text-secondary py-xs" style="display: flex; justify-content: space-between; padding: 4px 0;">
                <span>Subtotal:</span>
                <span>${SavvySpend.formatCurrencyPlain(subtotal)}</span>
              </div>
              <div class="flex flex-between text-xs text-secondary py-xs" style="display: flex; justify-content: space-between; padding: 4px 0;">
                <span>Tax (${inv.taxRate}%):</span>
                <span>${SavvySpend.formatCurrencyPlain(taxAmt)}</span>
              </div>
              <div class="flex flex-between text-sm font-bold text-primary-text py-sm border-top" style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 1px solid var(--border);">
                <span>Total Amount:</span>
                <span style="color: var(--primary);">${SavvySpend.formatCurrencyPlain(grandTotal)}</span>
              </div>
            </div>
          </div>

          ${inv.notes ? `
            <div style="background: var(--bg-secondary); padding: 12px; border-radius: var(--radius-sm); font-size: 0.75rem; line-height: 1.4; color: var(--text-secondary); border-left: 3px solid var(--border);">
              <strong>Terms/Notes:</strong><br>
              ${inv.notes}
            </div>
          ` : ''}

          <div class="modal-footer mt-lg flex gap-md" style="margin-top: 24px; border-top: 1px solid var(--border-light); padding-top: 16px;">
            <button type="button" class="btn btn-outline w-full" id="btn-print-pdf-inv"><i data-lucide="printer" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle;"></i> Print / PDF</button>
            <button type="button" class="btn btn-primary w-full" onclick="SavvySpend.closeModal()">Done</button>
          </div>
        </div>
      `;
      SavvySpend.showModal(html);

      // Print binding
      var printBtn = document.getElementById('btn-print-pdf-inv');
      if (printBtn) {
        printBtn.addEventListener('click', function () {
          window.print();
        });
      }
    },

    destroy: function () {
      if (activeChartInstance) {
        activeChartInstance.destroy();
        activeChartInstance = null;
      }
    }
  };

  window.SavvySpend.pages.BusinessHub = BusinessHub;
})();
