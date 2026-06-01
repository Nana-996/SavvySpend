/**
 * SavvySpend — Modal Forms Component
 */
(function () {
  'use strict';

  window.SavvySpend = window.SavvySpend || {};
  window.SavvySpend.components = window.SavvySpend.components || {};

  var Modals = {
    addTransaction: function () {
      var categories = DataStore.getCustomCategories();
      var today = new Date().toISOString().split('T')[0];
      var currCode = DataStore.getSettings().currency;
      var currencySymbol = (currCode && Object.prototype.hasOwnProperty.call(window.CURRENCIES, currCode) ? window.CURRENCIES[currCode] : { symbol: 'GH₵' }).symbol;
      
      var optionsHtml = categories
        .filter(function (c) { return c.id !== 'income'; })
        .map(function (c) {
          return '<option value="' + SavvySpend.escapeHtml(c.id) + '">' + SavvySpend.escapeHtml(c.name) + '</option>';
        }).join('');

      var goals = DataStore.getGoals() || [];
      var goalsOptionsHtml = goals.map(function (g) {
        return '<option value="goal_' + SavvySpend.escapeHtml(g.id) + '">🎯 Savings Goal: ' + SavvySpend.escapeHtml(g.name) + '</option>';
      }).join('');

      var buckets = DataStore.getMoneyJobs() || [];
      var bucketsOptionsHtml = buckets.map(function (b) {
        var remaining = b.assigned - (b.spent || 0);
        return '<option value="' + SavvySpend.escapeHtml(b.id) + '">' + SavvySpend.escapeHtml(b.name) + ' (' + SavvySpend.formatCurrencyPlain(remaining) + ')</option>';
      }).join('');

      var unpaidInvoices = (DataStore.getInvoices() || []).filter(function (inv) {
        return inv.status === 'unpaid' || inv.status === 'overdue';
      });
      var unpaidInvoicesOptionsHtml = unpaidInvoices.map(function (inv) {
        return '<option value="' + SavvySpend.escapeHtml(inv.id) + '">' + SavvySpend.escapeHtml(inv.invoiceNumber) + ' - ' + SavvySpend.escapeHtml(inv.clientName) + ' (' + SavvySpend.formatCurrencyPlain(inv.amount) + ')</option>';
      }).join('');

      var html = `
        <div class="modal-header flex flex-between">
          <h3 class="modal-title">Add Transaction</h3>
          <button class="btn-icon" onclick="SavvySpend.closeModal()"><i data-lucide="x"></i></button>
        </div>
        <form id="txn-form" class="mt-md">
          <div class="form-group flex-center mb-md">
            <div class="tab-group" style="width: 100%;">
              <button type="button" class="tab active w-full" id="btn-expense" style="flex: 1;">Expense</button>
              <button type="button" class="tab w-full" id="btn-income" style="flex: 1;">Income</button>
            </div>
            <input type="hidden" id="txn-type" value="expense">
          </div>

          <!-- Business Transaction Toggle -->
          <div class="form-group mt-md flex flex-between flex-center" style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-secondary); padding: 8px 12px; border-radius: var(--radius-md); border: 1px solid var(--border-light);">
            <label class="form-label" for="txn-is-business" style="margin-bottom: 0; font-weight: 700; color: var(--text-primary);">💼 Business Transaction?</label>
            <label class="toggle-switch">
              <input type="checkbox" id="txn-is-business" class="toggle-input">
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="form-group mt-md">
            <label class="form-label" for="txn-amount">Amount</label>
            <div style="position: relative;">
              <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-weight: 600; color: var(--text-primary);">${currencySymbol}</span>
              <input class="form-input" type="number" step="0.01" id="txn-amount" placeholder="0.00" required style="padding-left: 58px;">
            </div>
          </div>

          <div class="form-group mt-md">
            <label class="form-label" for="txn-merchant" id="lbl-merchant">Merchant</label>
            <input class="form-input" type="text" id="txn-merchant" placeholder="Merchant Name" required>
          </div>

          <div class="form-group mt-md" id="group-category">
            <label class="form-label" for="txn-category">Category</label>
            <select class="form-select" id="txn-category">
              ${optionsHtml}
            </select>
          </div>

          <div id="future-note-alert" class="card p-sm mt-sm mb-sm hidden" style="border-left: 4px solid var(--orange); background: var(--orange-light); color: var(--orange-dark); font-size: 0.8rem; border-radius: var(--radius-sm);">
            <div class="flex gap-sm flex-center">
              <i data-lucide="alert-triangle" style="width: 16px; height: 16px; flex-shrink: 0; color: var(--orange);"></i>
              <div>
                <strong>Future Self Alert:</strong>
                <span id="future-note-text"></span>
              </div>
            </div>
          </div>

          <div class="form-group mt-md" id="group-bucket">
            <label class="form-label" for="txn-bucket">Deduct from Money Job Bucket (Optional)</label>
            <select class="form-select" id="txn-bucket">
              <option value="">-- No Bucket (General Wallet) --</option>
              ${bucketsOptionsHtml}
            </select>
          </div>

          <div class="form-group mt-md" id="group-rating">
            <label class="form-label">Regret Tracker — How did this make you feel?</label>
            <div class="flex gap-sm" style="width: 100%;">
              <button type="button" class="btn btn-outline btn-sm rate-chip active" data-rating="worth_it" style="flex: 1; text-align: center; font-size: 0.75rem; height: 38px; padding-left: 0; padding-right: 0;">😊 Worth It</button>
              <button type="button" class="btn btn-outline btn-sm rate-chip" data-rating="neutral" style="flex: 1; text-align: center; font-size: 0.75rem; height: 38px; padding-left: 0; padding-right: 0;">😐 Neutral</button>
              <button type="button" class="btn btn-outline btn-sm rate-chip" data-rating="regret" style="flex: 1; text-align: center; font-size: 0.75rem; height: 38px; padding-left: 0; padding-right: 0;">😞 Regret</button>
            </div>
            <input type="hidden" id="txn-rating" value="worth_it">
          </div>

          <div class="form-group mt-md" id="group-income-source" style="display: none;">
            <label class="form-label" for="txn-income-source">What was this money?</label>
            <select class="form-select" id="txn-income-source">
              <option value="Business">💼 Business Income</option>
              <option value="Gift">🎁 Gift</option>
              <option value="Salary">💰 Salary</option>
              <option value="Side Hustle">🚀 Side Hustle</option>
              <option value="Refund">🔄 Refund / Return</option>
              <option value="Other">⭐ Other Income</option>
            </select>
          </div>

          <div class="form-group mt-md" id="group-invoice-link" style="display: none;">
            <label class="form-label" for="txn-invoice-link">Link to Invoice (Optional)</label>
            <select class="form-select" id="txn-invoice-link">
              <option value="">-- No Linked Invoice --</option>
              ${unpaidInvoicesOptionsHtml}
            </select>
          </div>

          <div class="form-group mt-md" id="group-income-destination" style="display: none;">
            <label class="form-label" for="txn-income-destination">Where did this money go?</label>
            <select class="form-select" id="txn-income-destination">
              <option value="wallet">💼 General Balance (Wallet for other purchases)</option>
              ${goalsOptionsHtml}
            </select>
          </div>

          <div class="form-group mt-md">
            <label class="form-label" for="txn-date">Date</label>
            <input class="form-input" type="date" id="txn-date" value="${today}" required>
          </div>

          <div class="form-group mt-md">
            <label class="form-label" for="txn-paymethod">Payment Method</label>
            <input class="form-input" type="text" id="txn-paymethod" placeholder="Payment Method (e.g. Mobile Money, Cash)">
          </div>

          <div class="form-group mt-md">
            <label class="form-label" for="txn-notes">Notes</label>
            <textarea class="form-input" id="txn-notes" placeholder="Optional notes..." rows="2" style="resize: none;"></textarea>
          </div>

          <div class="form-group mt-md">
            <label class="form-label" for="txn-tags">Tags (comma separated)</label>
            <input class="form-input" type="text" id="txn-tags" placeholder="Tags (comma separated)">
          </div>

          <div class="modal-footer mt-lg flex gap-md">
            <button type="button" class="btn btn-outline w-full" onclick="SavvySpend.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary w-full">Save Transaction</button>
          </div>
        </form>
      `;

      SavvySpend.showModal(html);

      // Bind dynamic toggle logic
      var btnExpense = document.getElementById('btn-expense');
      var btnIncome = document.getElementById('btn-income');
      var txnType = document.getElementById('txn-type');
      var groupCategory = document.getElementById('group-category');
      var groupBucket = document.getElementById('group-bucket');
      var groupRating = document.getElementById('group-rating');
      var groupIncomeSource = document.getElementById('group-income-source');
      var groupInvoiceLink = document.getElementById('group-invoice-link');
      var groupIncomeDestination = document.getElementById('group-income-destination');
      var lblMerchant = document.getElementById('lbl-merchant');
      var txtMerchant = document.getElementById('txn-merchant');
      var chkBusiness = document.getElementById('txn-is-business');
      var selIncomeSource = document.getElementById('txn-income-source');

      btnExpense.addEventListener('click', function () {
        btnExpense.classList.add('active');
        btnIncome.classList.remove('active');
        txnType.value = 'expense';
        groupCategory.style.display = 'block';
        groupBucket.style.display = 'block';
        groupRating.style.display = 'block';
        groupIncomeSource.style.display = 'none';
        groupInvoiceLink.style.display = 'none';
        groupIncomeDestination.style.display = 'none';
        lblMerchant.textContent = 'Merchant';
        txtMerchant.placeholder = 'Merchant Name';
        txtMerchant.required = true;
        updateFutureNote();
      });

      btnIncome.addEventListener('click', function () {
        btnIncome.classList.add('active');
        btnExpense.classList.remove('active');
        txnType.value = 'income';
        groupCategory.style.display = 'none';
        groupBucket.style.display = 'none';
        groupRating.style.display = 'none';
        document.getElementById('future-note-alert').classList.add('hidden');
        groupIncomeSource.style.display = 'block';
        groupInvoiceLink.style.display = 'block';
        groupIncomeDestination.style.display = 'block';
        lblMerchant.textContent = 'Income Source / Details';
        txtMerchant.placeholder = 'e.g. Gift from Nana, Business Payment';
        txtMerchant.required = false;
        
        // Auto check business if source is business
        chkBusiness.checked = (selIncomeSource.value === 'Business');
      });

      selIncomeSource.addEventListener('change', function () {
        if (selIncomeSource.value === 'Business') {
          chkBusiness.checked = true;
        }
      });

      // Future Self Note listeners
      var catSelect = document.getElementById('txn-category');
      var noteAlert = document.getElementById('future-note-alert');
      var noteText = document.getElementById('future-note-text');

      function updateFutureNote() {
        if (txnType.value !== 'expense') return;
        var catId = catSelect.value;
        var note = DataStore.getNoteForCategory(catId);
        if (note && note.isActive) {
          noteText.textContent = note.message;
          noteAlert.classList.remove('hidden');
          if (window.lucide) lucide.createIcons();
        } else {
          noteAlert.classList.add('hidden');
        }
      }

      catSelect.addEventListener('change', updateFutureNote);
      updateFutureNote();

      // Rate chips binding
      var rateChips = document.querySelectorAll('.rate-chip');
      var txnRating = document.getElementById('txn-rating');
      rateChips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          rateChips.forEach(function (c) {
            c.classList.remove('active');
          });
          chip.classList.add('active');
          txnRating.value = chip.getAttribute('data-rating');
        });
      });

      // Handle submit
      document.getElementById('txn-form').addEventListener('submit', function (e) {
        e.preventDefault();
        
        var rawAmount = parseFloat(document.getElementById('txn-amount').value);
        if (isNaN(rawAmount) || rawAmount <= 0) {
          alert('Please enter a valid amount.');
          return;
        }

        var type = txnType.value;
        var finalAmount = type === 'expense' ? -rawAmount : rawAmount;
        var category = type === 'expense' ? document.getElementById('txn-category').value : 'income';
        var merchant = txtMerchant.value.trim();
        var date = document.getElementById('txn-date').value;
        var payMethod = document.getElementById('txn-paymethod').value.trim() || 'Cash';
        var notes = document.getElementById('txn-notes').value.trim();
        var tagsRaw = document.getElementById('txn-tags').value;
        var tags = tagsRaw ? tagsRaw.split(',').map(function (t) { return t.trim(); }).filter(Boolean) : [];

        var bucketId = type === 'expense' ? (document.getElementById('txn-bucket').value || null) : null;
        var rating = type === 'expense' ? document.getElementById('txn-rating').value : null;
        var isBusiness = chkBusiness.checked;
        var invoiceId = (type === 'income' && document.getElementById('txn-invoice-link')) ? document.getElementById('txn-invoice-link').value : null;

        var t = {
          id: 'tx_' + SavvySpend.generateId(),
          amount: finalAmount,
          merchant: merchant,
          category: category,
          date: date,
          time: new Date().toTimeString().slice(0, 5),
          paymentMethod: payMethod,
          paymentLast4: Math.floor(1000 + Math.random() * 9000).toString(),
          status: 'completed',
          notes: notes,
          tags: tags,
          currency: DataStore.getSettings().currency || 'GHS',
          bucketId: bucketId,
          rating: rating,
          isBusiness: isBusiness,
          invoiceId: invoiceId || undefined
        };

        if (isBusiness && !t.tags.includes('business')) {
          t.tags.push('business');
        }

        var xpAmount = 10;
        var isGoalDeposit = false;

        if (type === 'income') {
          var incomeSource = document.getElementById('txn-income-source').value;
          var incomeDest = document.getElementById('txn-income-destination').value;
          
          if (!t.merchant) {
            t.merchant = incomeSource + ' Income';
          }
          
          var sourceTag = incomeSource.toLowerCase().replace(/\s+/g, '-');
          if (!t.tags.includes(sourceTag)) {
            t.tags.push(sourceTag);
          }

          if (incomeDest.startsWith('goal_')) {
            isGoalDeposit = true;
            var goalId = incomeDest.substring(5);
            var goal = DataStore.getGoal(goalId);
            if (goal) {
              var contribution = {
                id: 'c_' + SavvySpend.generateId(),
                amount: rawAmount,
                date: date || new Date().toISOString().split('T')[0],
                type: 'manual',
                source: t.merchant
              };
              DataStore.addContribution(goalId, contribution);

              var outTx = {
                id: 'tx_' + SavvySpend.generateId(),
                amount: -rawAmount,
                merchant: `Save: ${goal.name}`,
                category: 'other',
                date: date || new Date().toISOString().split('T')[0],
                time: new Date().toTimeString().slice(0, 5),
                paymentMethod: payMethod,
                paymentLast4: Math.floor(1000 + Math.random() * 9000).toString(),
                status: 'completed',
                notes: `Transfer from Income: ${t.merchant}`,
                tags: ['savings'],
                currency: DataStore.getSettings().currency || 'GHS',
                bucketId: null,
                rating: 'worth_it'
              };
              DataStore.addTransaction(outTx);

              t.notes = (notes ? notes + '\n' : '') + `Directed to Savings Goal: ${goal.name}`;
              if (!t.tags.includes('savings')) {
                t.tags.push('savings');
              }
              
              xpAmount = 25;

              var updatedGoal = DataStore.getGoal(goalId);
              if (updatedGoal && updatedGoal.current >= updatedGoal.target) {
                DataStore.unlockBadge('goal_getter');
                xpAmount += 50;
              }
            }
          }
        }

        DataStore.addTransaction(t);

        if (type === 'income' && invoiceId) {
          DataStore.updateInvoice(invoiceId, { status: 'paid', txnId: t.id });
        }

        if (type === 'expense') {
          var budgets = DataStore.getBudgets();
          var budget = budgets.find(function (b) { return b.category === category; });
          if (budget) {
            budget.spent += rawAmount;
            DataStore.updateBudget(budget.id, { spent: budget.spent });
          }
        }

        var xpRes = DataStore.addXP(xpAmount);
        SavvySpend.closeModal();
        
        var successMessage = 'Transaction added!';
        if (isGoalDeposit) {
          successMessage = 'Income received and added to Savings Goal!';
        }
        
        if (xpRes.leveled) {
          SavvySpend.showToast(`Level Up! You reached Level ${xpRes.newLevel}!`, 'success');
        } else {
          SavvySpend.showToast(`${successMessage} +${xpAmount} XP`, 'success');
        }

        // Check budget thresholds
        if (window.SavvySpend.components.Notifications) {
          window.SavvySpend.components.Notifications.checkBudgetAlerts();
        }

        // Re-route/render page
        SavvySpend.handleRoute();
      });
    },

    addBudget: function () {
      var categories = window.CATEGORIES;
      var activeBudgets = DataStore.getBudgets();
      var activeCategories = activeBudgets.map(function (b) { return b.category; });
      var currCode = DataStore.getSettings().currency;
      var currencySymbol = (currCode && Object.prototype.hasOwnProperty.call(window.CURRENCIES, currCode) ? window.CURRENCIES[currCode] : { symbol: 'GH₵' }).symbol;

      var optionsHtml = Object.keys(categories)
        .filter(function (key) { return key !== 'income' && !activeCategories.includes(key); })
        .map(function (key) {
          if (key === '__proto__' || key === 'constructor' || key === 'prototype') return '';
          var descriptor = Object.getOwnPropertyDescriptor(categories, key);
          var catName = descriptor ? descriptor.value.name : '';
          return '<option value="' + SavvySpend.escapeHtml(key) + '">' + SavvySpend.escapeHtml(catName) + '</option>';
        }).join('');

      if (!optionsHtml) {
        var html = '<div class="modal-header flex flex-between">' +
          '<h3 class="modal-title">Create Budget</h3>' +
          '<button class="btn-icon" onclick="SavvySpend.closeModal()"><i data-lucide="x"></i></button>' +
          '</div>' +
          '<div class="text-center mt-lg mb-lg">' +
          '<p style="color: var(--text-secondary);">You have set budgets for all available spending categories!</p>' +
          '<button class="btn btn-primary mt-md" onclick="SavvySpend.closeModal()">Close</button>' +
          '</div>';
        SavvySpend.showModal(html);
        return;
      }

      var html = '<div class="modal-header flex flex-between">' +
        '<h3 class="modal-title">Create Budget</h3>' +
        '<button class="btn-icon" onclick="SavvySpend.closeModal()"><i data-lucide="x"></i></button>' +
        '</div>' +
        '<form id="budget-form" class="mt-md">' +
        '<div class="form-group">' +
        '<label class="form-label" for="bud-category">Category</label>' +
        '<select class="form-select" id="bud-category">' +
        optionsHtml +
        '</select>' +
        '</div>' +
        '<div class="form-group mt-md">' +
        '<label class="form-label" for="bud-limit">Monthly Limit</label>' +
        '<div style="position: relative;">' +
        '<span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-weight: 600; color: var(--text-primary);">' + SavvySpend.escapeHtml(currencySymbol) + '</span>' +
        '<input class="form-input" type="number" step="10" id="bud-limit" placeholder="500" required style="padding-left: 58px;">' +
        '</div>' +
        '</div>' +
        '<div class="modal-footer mt-lg flex gap-md">' +
        '<button type="button" class="btn btn-outline w-full" onclick="SavvySpend.closeModal()">Cancel</button>' +
        '<button type="submit" class="btn btn-primary w-full">Create</button>' +
        '</div>' +
        '</form>';

      SavvySpend.showModal(html);

      document.getElementById('budget-form').addEventListener('submit', function (e) {
        e.preventDefault();

        var category = document.getElementById('bud-category').value;
        var limit = parseFloat(document.getElementById('bud-limit').value);
        
        if (isNaN(limit) || limit <= 0) {
          alert('Please enter a valid monthly limit.');
          return;
        }

        var catDetails = (category && Object.prototype.hasOwnProperty.call(categories, category)) ? categories[category] : { name: 'Other', icon: 'package', color: '#9CA3AF' };

        // Calculate how much was already spent in this category this month
        var txns = DataStore.getTransactions();
        var currentMonthStr = new Date().toISOString().substring(0, 7); // YYYY-MM
        var spent = txns
          .filter(function (t) { return t.category === category && t.date.startsWith(currentMonthStr) && t.amount < 0; })
          .reduce(function (acc, t) { return acc + Math.abs(t.amount); }, 0);

        var newBudget = {
          id: 'bud_' + SavvySpend.generateId(),
          category: category,
          name: catDetails.name,
          limit: limit,
          spent: spent,
          period: 'monthly',
          icon: catDetails.icon,
          color: catDetails.color
        };

        DataStore.addBudget(newBudget);

        var xpRes = DataStore.addXP(20);
        SavvySpend.closeModal();

        if (xpRes.leveled) {
          SavvySpend.showToast(`Level Up! You reached Level ${xpRes.newLevel}!`, 'success');
        } else {
          SavvySpend.showToast('Budget created! +20 XP', 'success');
        }

        SavvySpend.handleRoute();
      });
    },

    editBudget: function (id) {
      var budget = DataStore.getBudget(id);
      if (!budget) return;
      var currCode = DataStore.getSettings().currency;
      var currencySymbol = (currCode && Object.prototype.hasOwnProperty.call(window.CURRENCIES, currCode) ? window.CURRENCIES[currCode] : { symbol: 'GH₵' }).symbol;

      var html = '<div class="modal-header flex flex-between">' +
        '<h3 class="modal-title">Edit ' + SavvySpend.escapeHtml(budget.name) + ' Budget</h3>' +
        '<button class="btn-icon" onclick="SavvySpend.closeModal()"><i data-lucide="x"></i></button>' +
        '</div>' +
        '<form id="edit-budget-form" class="mt-md">' +
        '<div class="form-group">' +
        '<label class="form-label" for="edit-bud-limit">Monthly Limit</label>' +
        '<div style="position: relative;">' +
        '<span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-weight: 600; color: var(--text-primary);">' + SavvySpend.escapeHtml(currencySymbol) + '</span>' +
        '<input class="form-input" type="number" step="10" id="edit-bud-limit" value="' + SavvySpend.escapeHtml(budget.limit) + '" required style="padding-left: 58px;">' +
        '</div>' +
        '</div>' +
        '<div class="modal-footer mt-lg flex flex-column gap-md">' +
        '<div class="flex gap-md w-full">' +
        '<button type="button" class="btn btn-outline w-full" onclick="SavvySpend.closeModal()">Cancel</button>' +
        '<button type="submit" class="btn btn-primary w-full">Save Changes</button>' +
        '</div>' +
        '<button type="button" class="btn btn-danger w-full mt-sm" id="btn-delete-budget">Delete Budget</button>' +
        '</div>' +
        '</form>';

      SavvySpend.showModal(html);

      // Handle Edit Submit
      document.getElementById('edit-budget-form').addEventListener('submit', function (e) {
        e.preventDefault();

        var limit = parseFloat(document.getElementById('edit-bud-limit').value);
        if (isNaN(limit) || limit <= 0) {
          alert('Please enter a valid limit.');
          return;
        }

        DataStore.updateBudget(id, { limit: limit });
        SavvySpend.closeModal();
        SavvySpend.showToast('Budget updated!', 'success');
        SavvySpend.handleRoute();
      });

      // Handle Delete
      document.getElementById('btn-delete-budget').addEventListener('click', function () {
        if (confirm(`Are you sure you want to delete the ${budget.name} budget? This cannot be undone.`)) {
          DataStore.deleteBudget(id);
          SavvySpend.closeModal();
          SavvySpend.showToast('Budget deleted.', 'info');
          SavvySpend.handleRoute();
        }
      });
    },

    addGoal: function () {
      var currCode = DataStore.getSettings().currency;
      var currencySymbol = (currCode && Object.prototype.hasOwnProperty.call(window.CURRENCIES, currCode) ? window.CURRENCIES[currCode] : { symbol: 'GH₵' }).symbol;
      var html = '<div class="modal-header flex flex-between">' +
        '<h3 class="modal-title">Create Savings Goal</h3>' +
        '<button class="btn-icon" onclick="SavvySpend.closeModal()"><i data-lucide="x"></i></button>' +
        '</div>' +
        '<form id="goal-form" class="mt-md">' +
        '<div class="form-group">' +
        '<label class="form-label" for="goal-name">Goal Name</label>' +
        '<input class="form-input" type="text" id="goal-name" placeholder="Goal Name (e.g. Emergency Fund)" required>' +
        '</div>' +
        '<div class="form-group mt-md">' +
        '<label class="form-label" for="goal-target">Target Amount</label>' +
        '<div style="position: relative;">' +
        '<span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-weight: 600; color: var(--text-primary);">' + SavvySpend.escapeHtml(currencySymbol) + '</span>' +
        '<input class="form-input" type="number" step="50" id="goal-target" placeholder="0.00" required style="padding-left: 58px;">' +
        '</div>' +
        '</div>' +
        '<div class="form-group mt-md">' +
        '<label class="form-label" for="goal-date">Target Date</label>' +
        '<input class="form-input" type="date" id="goal-date" required>' +
        '</div>' +
        '<div class="form-group mt-md">' +
        '<label class="form-label">Goal Icon</label>' +
        '<div class="icon-selector-grid" style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-top: 8px;">' +
        '<button type="button" class="btn-icon-select active" data-icon="target" style="width: 100%; aspect-ratio: 1; padding: 0; border: 2px solid var(--primary); border-radius: var(--radius-md); background: var(--bg-hover); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--primary);">' +
        '<i data-lucide="target"></i>' +
        '</button>' +
        '<button type="button" class="btn-icon-select" data-icon="plane" style="width: 100%; aspect-ratio: 1; padding: 0; border: 2px solid var(--border); border-radius: var(--radius-md); background: transparent; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-secondary);">' +
        '<i data-lucide="plane"></i>' +
        '</button>' +
        '<button type="button" class="btn-icon-select" data-icon="shield" style="width: 100%; aspect-ratio: 1; padding: 0; border: 2px solid var(--border); border-radius: var(--radius-md); background: transparent; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-secondary);">' +
        '<i data-lucide="shield"></i>' +
        '</button>' +
        '<button type="button" class="btn-icon-select" data-icon="laptop" style="width: 100%; aspect-ratio: 1; padding: 0; border: 2px solid var(--border); border-radius: var(--radius-md); background: transparent; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-secondary);">' +
        '<i data-lucide="laptop"></i>' +
        '</button>' +
        '<button type="button" class="btn-icon-select" data-icon="car" style="width: 100%; aspect-ratio: 1; padding: 0; border: 2px solid var(--border); border-radius: var(--radius-md); background: transparent; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-secondary);">' +
        '<i data-lucide="car"></i>' +
        '</button>' +
        '<button type="button" class="btn-icon-select" data-icon="home" style="width: 100%; aspect-ratio: 1; padding: 0; border: 2px solid var(--border); border-radius: var(--radius-md); background: transparent; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-secondary);">' +
        '<i data-lucide="home"></i>' +
        '</button>' +
        '</div>' +
        '<input type="hidden" id="goal-icon" value="target">' +
        '</div>' +
        '<div class="modal-footer mt-lg flex gap-md">' +
        '<button type="button" class="btn btn-outline w-full" onclick="SavvySpend.closeModal()">Cancel</button>' +
        '<button type="submit" class="btn btn-primary w-full">Create Goal</button>' +
        '</div>' +
        '</form>';

      SavvySpend.showModal(html);

      // Bind icon selector grid click events
      var buttons = document.querySelectorAll('.btn-icon-select');
      var hiddenInput = document.getElementById('goal-icon');
      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          buttons.forEach(function (b) {
            b.classList.remove('active');
            b.style.borderColor = 'var(--border)';
            b.style.background = 'transparent';
            b.style.color = 'var(--text-secondary)';
          });
          btn.classList.add('active');
          btn.style.borderColor = 'var(--primary)';
          btn.style.background = 'var(--bg-hover)';
          btn.style.color = 'var(--primary)';
          hiddenInput.value = btn.getAttribute('data-icon');
        });
      });

      document.getElementById('goal-form').addEventListener('submit', function (e) {
        e.preventDefault();

        var name = document.getElementById('goal-name').value.trim();
        var target = parseFloat(document.getElementById('goal-target').value);
        var deadline = document.getElementById('goal-date').value;
        var icon = document.getElementById('goal-icon').value.trim() || 'target';

        if (isNaN(target) || target <= 0) {
          alert('Please enter a valid target amount.');
          return;
        }

        var colors = ['#10B981', '#3B82F6', '#EC4899', '#7C3AED', '#F59E0B'];
        var randomColor = colors.slice(Math.floor(Math.random() * colors.length)).shift();

        var newGoal = {
          id: 'goal_' + SavvySpend.generateId(),
          name: name,
          target: target,
          current: 0,
          deadline: deadline,
          icon: icon,
          color: randomColor,
          contributions: []
        };

        DataStore.addGoal(newGoal);

        var xpRes = DataStore.addXP(30);
        SavvySpend.closeModal();

        if (xpRes.leveled) {
          SavvySpend.showToast(`Level Up! You reached Level ${xpRes.newLevel}!`, 'success');
        } else {
          SavvySpend.showToast('Savings Goal created! +30 XP', 'success');
        }

        SavvySpend.handleRoute();
      });
    },

    addFunds: function (goalId) {
      var goal = DataStore.getGoal(goalId);
      if (!goal) return;
      var currCode = DataStore.getSettings().currency;
      var currencySymbol = (currCode && Object.prototype.hasOwnProperty.call(window.CURRENCIES, currCode) ? window.CURRENCIES[currCode] : { symbol: 'GH₵' }).symbol;

      var html = '<div class="modal-header flex flex-between">' +
        '<h3 class="modal-title">Add Funds to ' + SavvySpend.escapeHtml(goal.name) + '</h3>' +
        '<button class="btn-icon" onclick="SavvySpend.closeModal()"><i data-lucide="x"></i></button>' +
        '</div>' +
        '<form id="funds-form" class="mt-md">' +
        '<div class="form-group">' +
        '<label class="form-label" for="fund-amount">Contribution Amount</label>' +
        '<div style="position: relative;">' +
        '<span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-weight: 600; color: var(--text-primary);">' + SavvySpend.escapeHtml(currencySymbol) + '</span>' +
        '<input class="form-input" type="number" step="10" id="fund-amount" placeholder="0.00" required style="padding-left: 58px;">' +
        '</div>' +
        '</div>' +
        '<div class="form-group mt-md">' +
        '<label class="form-label" for="fund-source">Source Account</label>' +
        '<input class="form-input" type="text" id="fund-source" placeholder="Source Account (e.g. Mobile Money, Bank)" required>' +
        '</div>' +
        '<div class="modal-footer mt-lg flex gap-md">' +
        '<button type="button" class="btn btn-outline w-full" onclick="SavvySpend.closeModal()">Cancel</button>' +
        '<button type="submit" class="btn btn-primary w-full">Confirm Deposit</button>' +
        '</div>' +
        '</form>';

      SavvySpend.showModal(html);

      document.getElementById('funds-form').addEventListener('submit', function (e) {
        e.preventDefault();

        var amount = parseFloat(document.getElementById('fund-amount').value);
        var source = document.getElementById('fund-source').value.trim() || 'Checking';

        if (isNaN(amount) || amount <= 0) {
          alert('Please enter a valid contribution amount.');
          return;
        }

        var contribution = {
          id: 'c_' + SavvySpend.generateId(),
          amount: amount,
          date: new Date().toISOString().split('T')[0],
          type: 'manual',
          source: source
        };

        DataStore.addContribution(goalId, contribution);

        // Also add a transaction for this savings contribution (so it registers in overall cashflow/history if needed, or keeping it separate. Wait, we want transactions to show detail. Usually goal contributions can also count as transactions to keep it simple, or remain as specific goal history).
        // Let's create an expense transaction for this goal contribution to track where all funds are going!
        var t = {
          id: 'tx_' + SavvySpend.generateId(),
          amount: -amount,
          merchant: `Save: ${goal.name}`,
          category: 'other',
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5),
          paymentMethod: 'Bank Transfer',
          paymentLast4: '3301',
          status: 'completed',
          notes: `Contribution to ${goal.name}`,
          tags: ['savings'],
          currency: DataStore.getSettings().currency || 'GHS'
        };
        DataStore.addTransaction(t);

        // Add XP
        var xpRes = DataStore.addXP(15);
        
        // Check if goal is fully funded
        var updatedGoal = DataStore.getGoal(goalId);
        if (updatedGoal && updatedGoal.current >= updatedGoal.target) {
          // Unlock goal getter badge
          DataStore.unlockBadge('goal_getter');
          var xpRes2 = DataStore.addXP(50); // bonus XP
          SavvySpend.closeModal();
          SavvySpend.showToast('Goal getter! Goal fully funded! +50 XP', 'success');
        } else {
          SavvySpend.closeModal();
          if (xpRes.leveled) {
            SavvySpend.showToast(`Level Up! You reached Level ${xpRes.newLevel}!`, 'success');
          } else {
            SavvySpend.showToast('Funds added! +15 XP', 'success');
          }
        }

        SavvySpend.handleRoute();
      });
    },

    editProfile: function () {
      var user = DataStore.getUser() || { name: 'User', email: '', avatarUrl: '' };
      
      var colors = ['10B981', '7C3AED', '3B82F6', 'EC4899', 'F59E0B'];
      
      // Determine the active theme color from the user's stored avatarUrl background
      var activeColor = '10B981'; // default
      if (user.avatarUrl) {
        var urlLower = user.avatarUrl.toLowerCase();
        var foundColor = colors.find(function (col) {
          return urlLower.indexOf('background=' + col.toLowerCase()) !== -1;
        });
        if (foundColor) {
          activeColor = foundColor;
        }
      }

      var avatars = colors.map(function (c, idx) {
        var url = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name || 'User') + '&background=' + c + '&color=fff&size=128&bold=true';
        return { name: 'Theme ' + (idx + 1), url: url, color: c };
      });

      var avatarGridHtml = avatars.map(function(av) {
        var isSelected = (av.color === activeColor) ? 'active' : '';
        var borderStyle = isSelected ? 'border: 3px solid var(--primary);' : 'border: 1px solid var(--border);';
        return `
          <button type="button" class="btn-avatar-select ${isSelected}" data-url="${av.url}" data-color="${av.color}" style="padding: 2px; border-radius: 50%; width: 44px; height: 44px; cursor: pointer; overflow: hidden; background: transparent; ${borderStyle} display: flex; align-items: center; justify-content: center; flex-shrink: 0; outline: none; transition: border-color 0.2s;">
            <img src="${av.url}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
          </button>
        `;
      }).join('');

      var initialAvatarUrl = avatars.find(function(av) { return av.color === activeColor; }).url;

      var html = `
        <div class="modal-header flex flex-between">
          <h3 class="modal-title">Edit Profile</h3>
          <button class="btn-icon" onclick="SavvySpend.closeModal()"><i data-lucide="x"></i></button>
        </div>
        <form id="edit-profile-form" class="mt-md">
          <div class="form-group">
            <label class="form-label" for="edit-prof-name">Name</label>
            <input class="form-input" type="text" id="edit-prof-name" value="${user.name}" required style="height: 44px;">
          </div>
          <div class="form-group mt-md">
            <label class="form-label" for="edit-prof-email">Email Address</label>
            <input class="form-input" type="email" id="edit-prof-email" value="${user.email}" required style="height: 44px;">
          </div>
          <div class="form-group mt-md">
            <label class="form-label">Profile Theme</label>
            <div style="display: flex; gap: 12px; margin-top: 8px; overflow-x: auto; padding: 4px 0;">
              ${avatarGridHtml}
            </div>
            <input type="hidden" id="edit-prof-avatar" value="${initialAvatarUrl}">
          </div>
          <div class="modal-footer mt-lg flex gap-md">
            <button type="button" class="btn btn-outline w-full" onclick="SavvySpend.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary w-full">Save Changes</button>
          </div>
        </form>
      `;

      SavvySpend.showModal(html);

      // Bind interactions
      var avButtons = document.querySelectorAll('.btn-avatar-select');
      var hiddenAv = document.getElementById('edit-prof-avatar');
      var nameInput = document.getElementById('edit-prof-name');

      // Update avatar previews dynamically as name changes
      var updatePreviews = function (name) {
        var cleanName = name.trim() || 'User';
        avButtons.forEach(function (btn) {
          var color = btn.getAttribute('data-color');
          var newUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(cleanName) + '&background=' + color + '&color=fff&size=128&bold=true';
          btn.setAttribute('data-url', newUrl);
          btn.querySelector('img').src = newUrl;
          if (btn.classList.contains('active')) {
            hiddenAv.value = newUrl;
          }
        });
      };

      nameInput.addEventListener('input', function () {
        updatePreviews(nameInput.value);
      });

      avButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          avButtons.forEach(function (b) {
            b.classList.remove('active');
            b.style.border = '1px solid var(--border)';
          });
          btn.classList.add('active');
          btn.style.border = '3px solid var(--primary)';
          hiddenAv.value = btn.getAttribute('data-url');
        });
      });

      document.getElementById('edit-profile-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var name = nameInput.value.trim();
        var email = document.getElementById('edit-prof-email').value.trim();
        var avatar = hiddenAv.value;

        if (!name || !email) {
          alert('Please fill out all fields.');
          return;
        }

        DataStore.updateUser({ name: name, email: email, avatarUrl: avatar });
        SavvySpend.closeModal();
        
        var xpRes = DataStore.addXP(10);
        if (xpRes.leveled) {
          SavvySpend.showToast(`Level Up! You reached Level ${xpRes.newLevel}!`, 'success');
        } else {
          SavvySpend.showToast('Profile updated! +10 XP', 'success');
        }

        SavvySpend.handleRoute();
      });
    },

    addCustomCategory: function (catId) {
      var cat = catId ? DataStore.getCustomCategories().find(function (c) { return c.id === catId; }) : null;
      var title = cat ? 'Edit Category' : 'New Category';
      var name = cat ? cat.name : '';
      var activeIcon = cat ? cat.icon : 'tag';
      var activeColor = cat ? cat.color : '#10B981';

      var icons = ['tag', 'utensils', 'home', 'car', 'shopping-bag', 'clapperboard', 'zap', 'activity', 'graduation-cap', 'shopping-cart', 'gift', 'heart', 'coffee', 'briefcase', 'plane'];
      var colors = ['#10B981', '#7C3AED', '#3B82F6', '#EC4899', '#F59E0B', '#EF4444', '#06B6D4', '#059669', '#8B5CF6', '#F43F5E', '#14B8A6', '#6366F1'];

      var iconGridHtml = icons.map(function (ico) {
        var isSel = ico === activeIcon ? 'active' : '';
        var border = isSel ? 'border: 2px solid var(--primary); background: var(--bg-secondary);' : 'border: 1px solid var(--border);';
        return '<button type="button" class="btn-icon-select ' + isSel + '" data-icon="' + SavvySpend.escapeHtml(ico) + '" style="width: 40px; height: 40px; border-radius: var(--radius-sm); cursor: pointer; display: flex; align-items: center; justify-content: center; outline: none; background: var(--bg-card); ' + border + '">' +
          '<i data-lucide="' + SavvySpend.escapeHtml(ico) + '" style="width: 18px; height: 18px; color: var(--text-primary);"></i>' +
          '</button>';
      }).join('');

      var colorGridHtml = colors.map(function (col) {
        var isSel = col === activeColor ? 'active' : '';
        var border = isSel ? 'border: 3px solid var(--text-primary);' : 'border: 1px solid transparent;';
        return '<button type="button" class="btn-color-select ' + isSel + '" data-color="' + SavvySpend.escapeHtml(col) + '" style="width: 32px; height: 32px; border-radius: 50%; background: ' + SavvySpend.escapeHtml(col) + '; cursor: pointer; outline: none; ' + border + '"></button>';
      }).join('');

      var html = '<div class="modal-header flex flex-between">' +
        '<h3 class="modal-title">' + SavvySpend.escapeHtml(title) + '</h3>' +
        '<button class="btn-icon" onclick="SavvySpend.closeModal()"><i data-lucide="x"></i></button>' +
        '</div>' +
        '<form id="cat-form" class="mt-md">' +
        '<div class="form-group">' +
        '<label class="form-label" for="cat-name">Category Name</label>' +
        '<input class="form-input" type="text" id="cat-name" value="' + SavvySpend.escapeHtml(name) + '" placeholder="e.g. Subscriptions, Hobbies" required style="height: 44px;">' +
        '</div>' +
        '<div class="form-group mt-md">' +
        '<label class="form-label">Select Icon</label>' +
        '<div class="flex gap-sm" style="flex-wrap: wrap; margin-top: 8px;">' +
        iconGridHtml +
        '</div>' +
        '<input type="hidden" id="cat-icon" value="' + SavvySpend.escapeHtml(activeIcon) + '">' +
        '</div>' +
        '<div class="form-group mt-md">' +
        '<label class="form-label">Select Color</label>' +
        '<div class="flex gap-sm" style="flex-wrap: wrap; margin-top: 8px;">' +
        colorGridHtml +
        '</div>' +
        '<input type="hidden" id="cat-color" value="' + SavvySpend.escapeHtml(activeColor) + '">' +
        '</div>' +
        '<div class="modal-footer mt-lg flex gap-md">' +
        '<button type="button" class="btn btn-outline w-full" onclick="SavvySpend.closeModal()">Cancel</button>' +
        '<button type="submit" class="btn btn-primary w-full">Save Category</button>' +
        '</div>' +
        '</form>';

      SavvySpend.showModal(html);

      // Bind icon selection
      var iconButtons = document.querySelectorAll('.btn-icon-select');
      var hiddenIcon = document.getElementById('cat-icon');
      iconButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          iconButtons.forEach(function (b) {
            b.classList.remove('active');
            b.style.border = '1px solid var(--border)';
            b.style.background = 'var(--bg-card)';
          });
          btn.classList.add('active');
          btn.style.border = '2px solid var(--primary)';
          btn.style.background = 'var(--bg-secondary)';
          hiddenIcon.value = btn.getAttribute('data-icon');
        });
      });

      // Bind color selection
      var colorButtons = document.querySelectorAll('.btn-color-select');
      var hiddenColor = document.getElementById('cat-color');
      colorButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          colorButtons.forEach(function (b) {
            b.classList.remove('active');
            b.style.border = '1px solid transparent';
          });
          btn.classList.add('active');
          btn.style.border = '3px solid var(--text-primary)';
          hiddenColor.value = btn.getAttribute('data-color');
        });
      });

      // Handle submit
      document.getElementById('cat-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var catName = document.getElementById('cat-name').value.trim();
        var catIcon = hiddenIcon.value;
        var catCol = hiddenColor.value;

        if (!catName) return;

        if (cat) {
          DataStore.updateCustomCategory(cat.id, {
            name: catName,
            icon: catIcon,
            color: catCol
          });
          SavvySpend.showToast('Category updated!', 'success');
        } else {
          var id = catName.toLowerCase().replace(/[^a-z0-9]/g, '_');
          if (id === 'income' || id === 'other') id = 'cat_' + SavvySpend.generateId();
          var existing = DataStore.getCustomCategories().find(function (c) { return c.id === id; });
          if (existing) id = 'cat_' + SavvySpend.generateId();

          DataStore.addCustomCategory({
            id: id,
            name: catName,
            icon: catIcon,
            color: catCol,
            isCustom: true
          });
          SavvySpend.showToast('Category created!', 'success');
        }

        SavvySpend.closeModal();
        SavvySpend.handleRoute();
      });
    },

    addFutureNote: function (noteId) {
      var note = noteId ? DataStore.getFutureNotes().find(function (n) { return n.id === noteId; }) : null;
      var title = note ? 'Edit Note' : 'New Future Self Note';
      var msg = note ? note.message : '';
      var activeCatId = note ? note.categoryId : '';
      var activeState = note ? note.isActive : true;

      var categories = DataStore.getCustomCategories().filter(function (c) { return c.id !== 'income'; });
      var catOptions = categories.map(function (c) {
        return '<option value="' + SavvySpend.escapeHtml(c.id) + '" ' + (c.id === activeCatId ? 'selected' : '') + '>' + SavvySpend.escapeHtml(c.name) + '</option>';
      }).join('');

      var html = `
        <div class="modal-header flex flex-between">
          <h3 class="modal-title">${title}</h3>
          <button class="btn-icon" onclick="SavvySpend.closeModal()"><i data-lucide="x"></i></button>
        </div>
        <form id="note-form" class="mt-md">
          <div class="form-group">
            <label class="form-label" for="note-cat">Associated Category</label>
            <select class="form-select" id="note-cat" required style="height: 44px;">
              ${catOptions}
            </select>
          </div>

          <div class="form-group mt-md">
            <label class="form-label" for="note-msg">Message / Intervention Note</label>
            <textarea class="form-input" id="note-msg" placeholder="Write a note to warn yourself (e.g. Do you really need this takeout? Keep saving for your vacation!)" required rows="3" style="resize: none;">${msg}</textarea>
          </div>

          <div class="form-group mt-md flex flex-between flex-center">
            <label class="form-label" for="note-active" style="margin: 0;">Status (Active / Enabled)</label>
            <label class="toggle-switch">
              <input class="toggle-input" type="checkbox" id="note-active" ${activeState ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="modal-footer mt-lg flex gap-md">
            <button type="button" class="btn btn-outline w-full" onclick="SavvySpend.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary w-full">Save Note</button>
          </div>
        </form>
      `;

      SavvySpend.showModal(html);

      document.getElementById('note-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var catId = document.getElementById('note-cat').value;
        var message = document.getElementById('note-msg').value.trim();
        var isActive = document.getElementById('note-active').checked;

        if (!message) return;

        if (note) {
          DataStore.updateFutureNote(note.id, {
            categoryId: catId,
            message: message,
            isActive: isActive
          });
          SavvySpend.showToast('Note updated!', 'success');
        } else {
          DataStore.addFutureNote({
            id: 'note_' + SavvySpend.generateId(),
            categoryId: catId,
            message: message,
            isActive: isActive
          });
          SavvySpend.showToast('Note created!', 'success');
        }

        SavvySpend.closeModal();
        SavvySpend.handleRoute();
      });
    },

    addMoneyJob: function (jobId) {
      var job = jobId ? DataStore.getMoneyJobs().find(function (j) { return j.id === jobId; }) : null;
      var title = job ? 'Edit Money Job Bucket' : 'New Money Job Bucket';
      var name = job ? job.name : '';
      var targetVal = job ? job.assigned : '';
      var activeIcon = job ? job.icon : 'package';
      var activeColor = job ? job.color : '#7C3AED';
      var currCode = DataStore.getSettings().currency;
      var currencySymbol = (currCode && Object.prototype.hasOwnProperty.call(window.CURRENCIES, currCode) ? window.CURRENCIES[currCode] : { symbol: 'GH₵' }).symbol;

      var icons = ['package', 'home', 'piggy-bank', 'landmark', 'star', 'credit-card', 'gem', 'coins', 'shopping-cart', 'graduation-cap', 'activity', 'car', 'utensils', 'laptop', 'heart', 'shield'];
      var colors = ['#7C3AED', '#10B981', '#3B82F6', '#EC4899', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6'];

      var iconGridHtml = icons.map(function (ico) {
        var isSel = ico === activeIcon ? 'active' : '';
        var border = isSel ? 'border: 2px solid var(--primary); background: var(--bg-secondary);' : 'border: 1px solid var(--border);';
        return '<button type="button" class="btn-job-icon-select ' + isSel + '" data-icon="' + SavvySpend.escapeHtml(ico) + '" style="width: 40px; height: 40px; border-radius: var(--radius-sm); cursor: pointer; display: flex; align-items: center; justify-content: center; outline: none; background: var(--bg-card); ' + border + '">' +
          '<i data-lucide="' + SavvySpend.escapeHtml(ico) + '" style="width: 18px; height: 18px; color: var(--text-primary);"></i>' +
          '</button>';
      }).join('');

      var colorGridHtml = colors.map(function (col) {
        var isSel = col === activeColor ? 'active' : '';
        var border = isSel ? 'border: 3px solid var(--text-primary);' : 'border: 1px solid transparent;';
        return '<button type="button" class="btn-job-color-select ' + isSel + '" data-color="' + SavvySpend.escapeHtml(col) + '" style="width: 32px; height: 32px; border-radius: 50%; background: ' + SavvySpend.escapeHtml(col) + '; cursor: pointer; outline: none; ' + border + '"></button>';
      }).join('');

      var html = `
        <div class="modal-header flex flex-between">
          <h3 class="modal-title">${title}</h3>
          <button class="btn-icon" onclick="SavvySpend.closeModal()"><i data-lucide="x"></i></button>
        </div>
        <form id="job-form" class="mt-md">
          <div class="form-group">
            <label class="form-label" for="job-name">Bucket Name</label>
            <input class="form-input" type="text" id="job-name" value="${name}" placeholder="e.g. Rent Savings, Groceries, Gift Fund" required style="height: 44px;">
          </div>

          <div class="form-group mt-md">
            <label class="form-label" for="job-target">Assigned Balance amount</label>
            <div style="position: relative;">
              <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-weight: 600; color: var(--text-primary);">${currencySymbol}</span>
              <input class="form-input" type="number" step="0.01" id="job-target" value="${targetVal}" placeholder="e.g. 500" required style="height: 44px; padding-left: 58px;">
            </div>
          </div>

          <div class="form-group mt-md">
            <label class="form-label">Select Icon</label>
            <div class="flex gap-sm" style="flex-wrap: wrap; margin-top: 8px;">
              ${iconGridHtml}
            </div>
            <input type="hidden" id="job-icon" value="${activeIcon}">
          </div>

          <div class="form-group mt-md">
            <label class="form-label">Select Color</label>
            <div class="flex gap-sm" style="flex-wrap: wrap; margin-top: 8px;">
              ${colorGridHtml}
            </div>
            <input type="hidden" id="job-color" value="${activeColor}">
          </div>

          <div class="modal-footer mt-lg flex flex-column gap-md">
            <div class="flex gap-md w-full">
              <button type="button" class="btn btn-outline w-full" onclick="SavvySpend.closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary w-full">Save Bucket</button>
            </div>
            ${job ? `<button type="button" class="btn btn-danger w-full mt-sm" id="btn-delete-job">Delete Bucket</button>` : ''}
          </div>
        </form>
      `;

      SavvySpend.showModal(html);

      // Bind icon selection
      var iconButtons = document.querySelectorAll('.btn-job-icon-select');
      var hiddenIcon = document.getElementById('job-icon');
      iconButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          iconButtons.forEach(function (b) {
            b.classList.remove('active');
            b.style.border = '1px solid var(--border)';
            b.style.background = 'var(--bg-card)';
          });
          btn.classList.add('active');
          btn.style.border = '2px solid var(--primary)';
          btn.style.background = 'var(--bg-secondary)';
          hiddenIcon.value = btn.getAttribute('data-icon');
        });
      });

      // Bind color selection
      var colorButtons = document.querySelectorAll('.btn-job-color-select');
      var hiddenColor = document.getElementById('job-color');
      colorButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          colorButtons.forEach(function (b) {
            b.classList.remove('active');
            b.style.border = '1px solid transparent';
          });
          btn.classList.add('active');
          btn.style.border = '3px solid var(--text-primary)';
          hiddenColor.value = btn.getAttribute('data-color');
        });
      });

      // Handle submit
      document.getElementById('job-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var jobName = document.getElementById('job-name').value.trim();
        var targetVal = parseFloat(document.getElementById('job-target').value);
        var jobIcon = hiddenIcon.value;
        var jobCol = hiddenColor.value;

        if (!jobName || isNaN(targetVal) || targetVal < 0) return;

        if (job) {
          DataStore.updateMoneyJob(job.id, {
            name: jobName,
            assigned: targetVal,
            icon: jobIcon,
            color: jobCol
          });
          SavvySpend.showToast('Bucket updated!', 'success');
        } else {
          DataStore.addMoneyJob({
            id: 'job_' + SavvySpend.generateId(),
            name: jobName,
            assigned: targetVal,
            icon: jobIcon,
            color: jobCol
          });
          SavvySpend.showToast('Bucket created!', 'success');
        }

        SavvySpend.closeModal();
        SavvySpend.handleRoute();
      });

      // Handle Delete
      if (job) {
        var btnDelete = document.getElementById('btn-delete-job');
        if (btnDelete) {
          btnDelete.addEventListener('click', function () {
            if (confirm(`Are you sure you want to delete the "${job.name}" bucket? This will unallocate the assigned cash.`)) {
              DataStore.deleteMoneyJob(job.id);
              SavvySpend.closeModal();
              SavvySpend.showToast('Bucket deleted.', 'info');
              SavvySpend.handleRoute();
            }
          });
        }
      }
    },
    editProfile: function () {
      var user = DataStore.getUser();
      if (!user) return;

      var currentBg = '10B981'; // default emerald
      if (user.avatarUrl) {
        var match = user.avatarUrl.match(/background=([A-Fa-f0-9]{6})/);
        if (match) currentBg = match[1];
      }

      var colors = [
        { hex: '10B981', name: 'Emerald' },
        { hex: '7C3AED', name: 'Purple' },
        { hex: '3B82F6', name: 'Blue' },
        { hex: 'EC4899', name: 'Pink' },
        { hex: 'F59E0B', name: 'Orange' },
        { hex: 'EF4444', name: 'Red' }
      ];

      var colorGridHtml = colors.map(function (c) {
        var isSel = c.hex.toLowerCase() === currentBg.toLowerCase() ? 'active' : '';
        var border = isSel ? 'border: 3px solid var(--text-primary);' : 'border: 1px solid transparent;';
        return '<button type="button" class="btn-avatar-color-select ' + isSel + '" data-color="' + SavvySpend.escapeHtml(c.hex) + '" style="width: 36px; height: 36px; border-radius: 50%; background: #' + SavvySpend.escapeHtml(c.hex) + '; cursor: pointer; outline: none; ' + border + '"></button>';
      }).join('');

      var html = '<div class="modal-header flex flex-between">' +
        '<h3 class="modal-title">Edit Profile Details</h3>' +
        '<button class="btn-icon" onclick="SavvySpend.closeModal()"><i data-lucide="x"></i></button>' +
        '</div>' +
        '<form id="edit-profile-form" class="mt-md">' +
        '<div class="form-group">' +
        '<label class="form-label" for="ep-name">Full Name</label>' +
        '<input class="form-input" type="text" id="ep-name" value="' + SavvySpend.escapeHtml(user.name) + '" placeholder="Full Name" required style="height: 44px;">' +
        '</div>' +
        '<div class="form-group mt-md">' +
        '<label class="form-label" for="ep-email">Email Address</label>' +
        '<input class="form-input" type="email" id="ep-email" value="' + SavvySpend.escapeHtml(user.email) + '" placeholder="Email Address" required style="height: 44px;">' +
        '</div>' +
        '<div class="form-group mt-md">' +
        '<label class="form-label">Avatar Theme Color</label>' +
        '<div class="flex gap-sm" style="flex-wrap: wrap; margin-top: 8px;">' +
        colorGridHtml +
        '</div>' +
        '<input type="hidden" id="ep-avatar-bg" value="' + SavvySpend.escapeHtml(currentBg) + '">' +
        '</div>' +
        '<div class="modal-footer mt-lg flex gap-md">' +
        '<button type="button" class="btn btn-outline w-full" onclick="SavvySpend.closeModal()">Cancel</button>' +
        '<button type="submit" class="btn btn-primary w-full">Save Changes</button>' +
        '</div>' +
        '</form>';

      SavvySpend.showModal(html);

      // Bind color selection
      var colorButtons = document.querySelectorAll('.btn-avatar-color-select');
      var hiddenColor = document.getElementById('ep-avatar-bg');
      colorButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          colorButtons.forEach(function (b) {
            b.classList.remove('active');
            b.style.border = '1px solid transparent';
          });
          btn.classList.add('active');
          btn.style.border = '3px solid var(--text-primary)';
          hiddenColor.value = btn.getAttribute('data-color');
        });
      });

      // Handle submit
      document.getElementById('edit-profile-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var name = document.getElementById('ep-name').value.trim();
        var email = document.getElementById('ep-email').value.trim();
        var bg = hiddenColor.value;

        if (!name || !email) return;

        var avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=' + bg + '&color=fff&size=128&bold=true';
        
        DataStore.updateUser({
          name: name,
          email: email,
          avatarUrl: avatarUrl
        });

        SavvySpend.showToast('Profile updated!', 'success');
        SavvySpend.closeModal();
        SavvySpend.handleRoute();
      });
    },
    showFaceIDScan: function (callback) {
      if (!document.getElementById('faceid-style-block')) {
        var style = document.createElement('style');
        style.id = 'faceid-style-block';
        style.innerHTML = `
          @keyframes faceid-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes faceid-pulse {
            0% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.06); opacity: 1; }
            100% { transform: scale(1); opacity: 0.8; }
          }
        `;
        document.head.appendChild(style);
      }

      var overlay = document.createElement('div');
      overlay.id = 'faceid-overlay';
      overlay.setAttribute('style', 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.96); z-index: 10000; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; font-family: var(--font-family); transition: opacity 0.3s ease;');
      
      overlay.innerHTML = `
        <div style="text-align: center; display: flex; flex-direction: column; align-items: center; gap: 24px; animation: faceid-pulse 1.8s ease-in-out infinite;">
          <div style="position: relative; width: 120px; height: 120px; display: flex; align-items: center; justify-content: center;">
            <div id="faceid-ring" style="position: absolute; width: 100%; height: 100%; border: 3px dashed var(--primary); border-radius: 50%; animation: faceid-spin 4s linear infinite;"></div>
            <i data-lucide="scan" style="position: absolute; width: 80px; height: 80px; color: var(--primary);"></i>
            <i data-lucide="smile" id="faceid-smile" style="position: absolute; width: 36px; height: 36px; color: var(--primary); transition: color 0.3s ease, transform 0.2s ease;"></i>
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <h3 class="text-lg font-bold" id="faceid-title" style="margin: 0; letter-spacing: -0.5px; color: #F1F5F9;">Face ID</h3>
            <p class="text-xs text-secondary" id="faceid-subtitle" style="margin: 0; color: #94A3B8; opacity: 0.9;">Verifying identity...</p>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      if (window.lucide) lucide.createIcons();

      function playBeep() {
        try {
          var AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (!AudioCtx) return;
          var ctx = new AudioCtx();
          
          var osc1 = ctx.createOscillator();
          var gain1 = ctx.createGain();
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.frequency.value = 880;
          osc1.type = 'sine';
          gain1.gain.setValueAtTime(0, ctx.currentTime);
          gain1.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
          gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
          osc1.start(ctx.currentTime);
          osc1.stop(ctx.currentTime + 0.15);
          
          var osc2 = ctx.createOscillator();
          var gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.frequency.value = 1200;
          osc2.type = 'sine';
          gain2.gain.setValueAtTime(0, ctx.currentTime + 0.08);
          gain2.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.13);
          gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.23);
          osc2.start(ctx.currentTime + 0.08);
          osc2.stop(ctx.currentTime + 0.23);
        } catch (e) {}
      }

      setTimeout(function () {
        var ring = document.getElementById('faceid-ring');
        var smile = document.getElementById('faceid-smile');
        var subtitle = document.getElementById('faceid-subtitle');
        
        if (ring) ring.style.borderColor = '#10B981';
        if (smile) {
          smile.style.color = '#10B981';
          smile.style.transform = 'scale(1.2)';
        }
        if (subtitle) {
          subtitle.textContent = 'Decrypted successfully!';
          subtitle.style.color = '#10B981';
        }
        
        playBeep();

        setTimeout(function () {
          overlay.style.opacity = '0';
          setTimeout(function () {
            if (overlay.parentNode) document.body.removeChild(overlay);
            if (callback) callback();
          }, 300);
        }, 600);

      }, 1500);
    },
    setWeeklyBudget: function () {
      var weeklyBudget = DataStore.getWeeklyBudget();
      var currentLimit = weeklyBudget.limit || '';
      var currCode = DataStore.getSettings().currency;
      var currencySymbol = (currCode && Object.prototype.hasOwnProperty.call(window.CURRENCIES, currCode) ? window.CURRENCIES[currCode] : { symbol: 'GH₵' }).symbol;
      
      var html = '<div class="modal-header flex flex-between">' +
        '<h3 class="modal-title">' + (currentLimit ? 'Adjust Weekly Budget' : 'Set Weekly Budget') + '</h3>' +
        '<button class="btn-icon" onclick="SavvySpend.closeModal()"><i data-lucide="x"></i></button>' +
        '</div>' +
        '<form id="weekly-budget-form" class="mt-md">' +
        '<div class="form-group">' +
        '<label class="form-label" for="wb-limit">Weekly Spending Limit</label>' +
        '<div style="position: relative;">' +
        '<span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-weight: 600; color: var(--text-primary);">' + SavvySpend.escapeHtml(currencySymbol) + '</span>' +
        '<input class="form-input" type="number" step="1" id="wb-limit" value="' + SavvySpend.escapeHtml(currentLimit) + '" placeholder="500" required style="padding-left: 58px;">' +
        '</div>' +
        '<span class="text-xxs text-secondary mt-xs" style="display: block; margin-top: 4px; line-height: 1.3;">' +
        'This is the total money you have allocated for spending each week. The app will calculate your proposed daily allowance.' +
        '</span>' +
        '</div>' +
        '<div class="modal-footer mt-lg flex gap-md">' +
        '<button type="button" class="btn btn-outline w-full" onclick="SavvySpend.closeModal()">Cancel</button>' +
        '<button type="submit" class="btn btn-primary w-full">Save Budget</button>' +
        '</div>' +
        '</form>';
      
      SavvySpend.showModal(html);
      
      document.getElementById('weekly-budget-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var limit = parseFloat(document.getElementById('wb-limit').value);
        if (isNaN(limit) || limit <= 0) {
          alert('Please enter a valid weekly limit.');
          return;
        }
        
        DataStore.setWeeklyBudget(limit);
        
        var xpRes = DataStore.addXP(20);
        SavvySpend.closeModal();
        
        if (xpRes.leveled) {
          SavvySpend.showToast(`Level Up! You reached Level ${xpRes.newLevel}!`, 'success');
        } else {
          SavvySpend.showToast('Weekly budget saved! +20 XP', 'success');
        }
        
        SavvySpend.handleRoute();
      });
    },
    addClient: function (clientId) {
      var client = clientId ? DataStore.getClients().find(function (c) { return c.id === clientId; }) : null;
      var title = client ? 'Edit Client' : 'Add New Client';
      var name = client ? client.name : '';
      var company = client ? client.company : '';
      var email = client ? client.email : '';
      var phone = client ? client.phone : '';
      var address = client ? client.address : '';

      var html = `
        <div class="modal-header flex flex-between">
          <h3 class="modal-title">${title}</h3>
          <button class="btn-icon" onclick="SavvySpend.closeModal()"><i data-lucide="x"></i></button>
        </div>
        <form id="client-form" class="mt-md">
          <div class="form-group">
            <label class="form-label" for="client-name">Contact Person Name</label>
            <input class="form-input" type="text" id="client-name" value="${name}" placeholder="e.g. Kojo Mensah" required style="height: 44px;">
          </div>
          <div class="form-group mt-md">
            <label class="form-label" for="client-company">Company Name</label>
            <input class="form-input" type="text" id="client-company" value="${company}" placeholder="e.g. Mensah Digital Solutions" required style="height: 44px;">
          </div>
          <div class="form-group mt-md">
            <label class="form-label" for="client-email">Email Address</label>
            <input class="form-input" type="email" id="client-email" value="${email}" placeholder="e.g. kojo@mensahdigital.com" style="height: 44px;">
          </div>
          <div class="form-group mt-md">
            <label class="form-label" for="client-phone">Phone Number</label>
            <input class="form-input" type="tel" id="client-phone" value="${phone}" placeholder="e.g. +233 24 123 4567" style="height: 44px;">
          </div>
          <div class="form-group mt-md">
            <label class="form-label" for="client-address">Billing Address</label>
            <textarea class="form-input" id="client-address" placeholder="e.g. 12 Ring Road East, Accra" rows="2" style="resize: none;">${address}</textarea>
          </div>
          <div class="modal-footer mt-lg flex flex-column gap-md">
            <div class="flex gap-md w-full">
              <button type="button" class="btn btn-outline w-full" onclick="SavvySpend.closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary w-full">Save Client</button>
            </div>
            ${client ? `<button type="button" class="btn btn-danger w-full mt-sm" id="btn-delete-client">Delete Client</button>` : ''}
          </div>
        </form>
      `;

      SavvySpend.showModal(html);

      document.getElementById('client-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var cData = {
          name: document.getElementById('client-name').value.trim(),
          company: document.getElementById('client-company').value.trim(),
          email: document.getElementById('client-email').value.trim(),
          phone: document.getElementById('client-phone').value.trim(),
          address: document.getElementById('client-address').value.trim()
        };

        if (client) {
          DataStore.updateClient(client.id, cData);
          SavvySpend.showToast('Client updated!', 'success');
        } else {
          cData.id = 'client_' + SavvySpend.generateId();
          DataStore.addClient(cData);
          SavvySpend.showToast('Client created!', 'success');
          DataStore.addXP(15);
        }

        SavvySpend.closeModal();
        SavvySpend.handleRoute();
      });

      if (client) {
        document.getElementById('btn-delete-client').addEventListener('click', function () {
          if (confirm('Are you sure you want to delete this client? Linked invoices will keep history but lose client details link.')) {
            DataStore.deleteClient(client.id);
            SavvySpend.showToast('Client deleted.', 'info');
            SavvySpend.closeModal();
            SavvySpend.handleRoute();
          }
        });
      }
    },
    addInvoice: function (invoiceId) {
      var clients = DataStore.getClients() || [];
      if (clients.length === 0) {
        alert('Please create at least one client in the Client Directory first!');
        return;
      }

      var invoice = invoiceId ? DataStore.getInvoices().find(function (i) { return i.id === invoiceId; }) : null;
      var title = invoice ? 'Edit Invoice' : 'Create New Invoice';
      
      var defaultInvoiceNum = 'INV-' + new Date().getFullYear() + '-' + String(1001 + (DataStore.getInvoices().length || 0)).padStart(4, '0');
      var invoiceNum = invoice ? invoice.invoiceNumber : defaultInvoiceNum;
      var activeClientId = invoice ? invoice.clientId : clients[0].id;
      var invoiceDate = invoice ? invoice.date : new Date().toISOString().split('T')[0];
      
      // Default due date = today + 14 days
      var defaultDue = new Date();
      defaultDue.setDate(defaultDue.getDate() + 14);
      var defaultDueStr = defaultDue.toISOString().split('T')[0];
      var invoiceDueDate = invoice ? invoice.dueDate : defaultDueStr;
      
      var taxRate = invoice ? invoice.taxRate : 0;
      var notes = invoice ? invoice.notes : 'Payment is due within 14 days of invoice date.';
      
      var items = (invoice && invoice.items && invoice.items.length > 0) ? invoice.items : [{ description: '', quantity: 1, rate: 0 }];

      var clientsOptionsHtml = clients.map(function (c) {
        var isSel = c.id === activeClientId ? 'selected' : '';
        return '<option value="' + SavvySpend.escapeHtml(c.id) + '" ' + isSel + '>' + SavvySpend.escapeHtml(c.company) + ' (Attn: ' + SavvySpend.escapeHtml(c.name) + ')</option>';
      }).join('');

      var currCode = DataStore.getSettings().currency;
      var currencySymbol = (currCode && Object.prototype.hasOwnProperty.call(window.CURRENCIES, currCode) ? window.CURRENCIES[currCode] : { symbol: 'GH₵' }).symbol;

      var html = '<style>' +
        '.invoice-item-row {' +
        'border: 1px solid var(--border-light);' +
        'border-radius: var(--radius-sm);' +
        'padding: 8px;' +
        'background: var(--bg-card);' +
        'position: relative;' +
        '}' +
        '.invoice-item-row .btn-remove-row {' +
        'position: absolute;' +
        'top: 4px;' +
        'right: 4px;' +
        'color: var(--red);' +
        'font-size: 0.7rem;' +
        'cursor: pointer;' +
        'padding: 2px 6px;' +
        'border-radius: 4px;' +
        'border: 1px solid var(--red-light);' +
        'background: var(--red-light);' +
        '}' +
        '</style>' +
        '<div class="modal-header flex flex-between">' +
        '<h3 class="modal-title">' + SavvySpend.escapeHtml(title) + '</h3>' +
        '<button class="btn-icon" onclick="SavvySpend.closeModal()"><i data-lucide="x"></i></button>' +
        '</div>' +
        '<form id="invoice-form" class="mt-md" style="max-height: 70vh; overflow-y: auto; padding-right: 4px;">' +
        '<div class="form-group">' +
        '<label class="form-label" for="inv-number">Invoice Number</label>' +
        '<input class="form-input" type="text" id="inv-number" value="' + SavvySpend.escapeHtml(invoiceNum) + '" required style="height: 40px;">' +
        '</div>' +
        '<div class="form-group mt-md">' +
        '<label class="form-label" for="inv-client">Select Client</label>' +
        '<select class="form-select" id="inv-client" style="height: 44px;">' +
        clientsOptionsHtml +
        '</select>' +
        '</div>' +
        '<div class="flex gap-md mt-md">' +
        '<div class="form-group" style="flex: 1;">' +
        '<label class="form-label" for="inv-date">Issue Date</label>' +
        '<input class="form-input" type="date" id="inv-date" value="' + SavvySpend.escapeHtml(invoiceDate) + '" required>' +
        '</div>' +
        '<div class="form-group" style="flex: 1;">' +
        '<label class="form-label" for="inv-duedate">Due Date</label>' +
        '<input class="form-input" type="date" id="inv-duedate" value="' + SavvySpend.escapeHtml(invoiceDueDate) + '" required>' +
        '</div>' +
        '</div>' +
        '<div class="form-group mt-lg">' +
        '<div class="flex flex-between flex-center mb-sm">' +
        '<label class="form-label" style="margin: 0;">Invoice Line Items</label>' +
        '<button type="button" class="btn btn-outline btn-sm" id="btn-add-invoice-item" style="padding: 4px 8px; font-size: 0.75rem;">+ Add Line</button>' +
        '</div>' +
        '<div id="invoice-items-container" class="flex flex-column gap-sm">' +
        '<!-- Render items dynamically -->' +
        '</div>' +
        '</div>' +
        '<div class="form-group mt-md" style="background: var(--bg-secondary); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border);">' +
        '<div class="flex flex-between flex-center mb-sm">' +
        '<label class="form-label" for="inv-tax" style="margin: 0;">Tax Rate (%)</label>' +
        '<input class="form-input" type="number" id="inv-tax" value="' + SavvySpend.escapeHtml(taxRate) + '" min="0" max="100" style="width: 70px; height: 32px; padding: 4px; text-align: center;">' +
        '</div>' +
        '<div class="border-top pt-sm" style="border-color: var(--border);">' +
        '<div class="flex flex-between text-xs text-secondary">' +
        '<span>Subtotal:</span>' +
        '<span id="inv-lbl-subtotal">GH₵0.00</span>' +
        '</div>' +
        '<div class="flex flex-between text-xs text-secondary mt-xs">' +
        '<span>Estimated Tax:</span>' +
        '<span id="inv-lbl-tax">GH₵0.00</span>' +
        '</div>' +
        '<div class="flex flex-between text-sm font-bold text-primary-text mt-sm">' +
        '<span>Grand Total:</span>' +
        '<span id="inv-lbl-total" style="color: var(--primary);">GH₵0.00</span>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="form-group mt-md">' +
        '<label class="form-label" for="inv-notes">Payment Terms & Notes</label>' +
        '<textarea class="form-input" id="inv-notes" rows="2" style="resize: none;">' + SavvySpend.escapeHtml(notes) + '</textarea>' +
        '</div>' +
        '<div class="modal-footer mt-xl flex gap-md">' +
        '<button type="button" class="btn btn-outline w-full" onclick="SavvySpend.closeModal()">Cancel</button>' +
        '<button type="submit" class="btn btn-primary w-full">Save Invoice</button>' +
        '</div>' +
        '</form>';

      SavvySpend.showModal(html);

      var container = document.getElementById('invoice-items-container');

      function calculateTotals() {
        var subtotal = 0;
        var rows = container.querySelectorAll('.invoice-item-row');
        rows.forEach(function (row) {
          var qty = parseFloat(row.querySelector('.item-qty').value) || 0;
          var rate = parseFloat(row.querySelector('.item-rate').value) || 0;
          var rowTotal = qty * rate;
          row.querySelector('.row-total-val').textContent = SavvySpend.formatCurrencyPlain(rowTotal);
          subtotal += rowTotal;
        });

        var taxRatePct = parseFloat(document.getElementById('inv-tax').value) || 0;
        var taxAmount = subtotal * (taxRatePct / 100);
        var grandTotal = subtotal + taxAmount;

        document.getElementById('inv-lbl-subtotal').textContent = currencySymbol + subtotal.toFixed(2);
        document.getElementById('inv-lbl-tax').textContent = currencySymbol + taxAmount.toFixed(2);
        document.getElementById('inv-lbl-total').textContent = currencySymbol + grandTotal.toFixed(2);
      }

      function createRowHTML(itemData) {
        var row = document.createElement('div');
        row.className = 'invoice-item-row flex flex-column gap-xs';
        row.innerHTML = '<button type="button" class="btn-remove-row">Remove</button>' +
          '<div class="form-group" style="margin-bottom: 4px;">' +
          '<input class="form-input item-desc" type="text" placeholder="Description of service/goods" required style="height: 34px; padding: 4px 8px; font-size: 0.8rem;">' +
          '</div>' +
          '<div class="flex gap-sm">' +
          '<div style="flex: 1;">' +
          '<label class="form-label" style="font-size: 0.6rem; margin-bottom: 2px;">Qty</label>' +
          '<input class="form-input item-qty" type="number" min="1" step="1" required style="height: 34px; padding: 4px 8px; font-size: 0.8rem; text-align: center;">' +
          '</div>' +
          '<div style="flex: 2;">' +
          '<label class="form-label item-rate-lbl" style="font-size: 0.6rem; margin-bottom: 2px;">Rate</label>' +
          '<input class="form-input item-rate" type="number" min="0" step="0.01" required style="height: 34px; padding: 4px 8px; font-size: 0.8rem; text-align: right;">' +
          '</div>' +
          '<div style="flex: 2; text-align: right; display: flex; flex-direction: column; justify-content: flex-end; padding-bottom: 6px;">' +
          '<span class="text-xxs text-secondary">Total</span>' +
          '<span class="text-xs font-bold text-primary-text row-total-val"></span>' +
          '</div>' +
          '</div>';

        row.querySelector('.item-desc').value = itemData.description;
        row.querySelector('.item-qty').value = itemData.quantity;
        row.querySelector('.item-rate-lbl').textContent = 'Rate (' + currencySymbol + ')';
        row.querySelector('.item-rate').value = itemData.rate;
        row.querySelector('.row-total-val').textContent = SavvySpend.formatCurrencyPlain(itemData.quantity * itemData.rate);

        row.querySelector('.btn-remove-row').addEventListener('click', function () {
          if (container.querySelectorAll('.invoice-item-row').length > 1) {
            row.remove();
            calculateTotals();
          } else {
            alert('An invoice must have at least one line item.');
          }
        });

        row.querySelector('.item-qty').addEventListener('input', calculateTotals);
        row.querySelector('.item-rate').addEventListener('input', calculateTotals);

        container.appendChild(row);
      }

      // Render initial items
      items.forEach(function (it) {
        createRowHTML(it);
      });
      calculateTotals();

      // Add line button binding
      document.getElementById('btn-add-invoice-item').addEventListener('click', function () {
        createRowHTML({ description: '', quantity: 1, rate: 0 });
        calculateTotals();
      });

      document.getElementById('inv-tax').addEventListener('input', calculateTotals);

      // Handle Form Submit
      document.getElementById('invoice-form').addEventListener('submit', function (e) {
        e.preventDefault();

        var clientSelect = document.getElementById('inv-client');
        var clientId = clientSelect.value;
        var selectedOpt = clientSelect.selectedOptions ? clientSelect.selectedOptions.item(0) : null;
        var clientName = selectedOpt ? selectedOpt.text.split(' (')[0] : '';

        // Collect items
        var finalItems = [];
        var rows = container.querySelectorAll('.invoice-item-row');
        rows.forEach(function (row) {
          finalItems.push({
            description: row.querySelector('.item-desc').value.trim(),
            quantity: parseFloat(row.querySelector('.item-qty').value) || 1,
            rate: parseFloat(row.querySelector('.item-rate').value) || 0
          });
        });

        var subtotal = finalItems.reduce(function (sum, it) { return sum + (it.quantity * it.rate); }, 0);
        var taxRatePct = parseFloat(document.getElementById('inv-tax').value) || 0;
        var grandTotal = subtotal + (subtotal * (taxRatePct / 100));

        var invData = {
          invoiceNumber: document.getElementById('inv-number').value.trim(),
          clientId: clientId,
          clientName: clientName,
          date: document.getElementById('inv-date').value,
          dueDate: document.getElementById('inv-duedate').value,
          items: finalItems,
          taxRate: taxRatePct,
          amount: grandTotal,
          notes: document.getElementById('inv-notes').value.trim(),
          status: invoice ? invoice.status : 'unpaid',
          txnId: invoice ? invoice.txnId : null
        };

        if (invoice) {
          DataStore.updateInvoice(invoice.id, invData);
          SavvySpend.showToast('Invoice updated!', 'success');
        } else {
          invData.id = 'inv_' + SavvySpend.generateId();
          DataStore.addInvoice(invData);
          SavvySpend.showToast('Invoice created!', 'success');
          DataStore.addXP(20);
        }

        SavvySpend.closeModal();
        SavvySpend.handleRoute();
      });
    }
  };

  window.SavvySpend.components.Modals = Modals;
})();
