/**
 * SavvySpend — Transaction Detail Page
 */
(function () {
  'use strict';

  window.SavvySpend = window.SavvySpend || {};
  window.SavvySpend.pages = window.SavvySpend.pages || {};

  var Transaction = {
    render: function (txnId) {
      var txn = DataStore.getTransaction(txnId);
      if (!txn) {
        return '<div class="page-header mt-sm mb-lg flex flex-center gap-md">' +
          '<button class="btn-icon" onclick="SavvySpend.navigate(\'#/home\')"><i data-lucide="arrow-left"></i></button>' +
          '<h2 class="page-title text-base font-bold">Transaction Not Found</h2>' +
          '</div>' +
          '<div class="card p-lg text-center">' +
          '<p class="text-secondary text-sm">The selected transaction could not be found.</p>' +
          '<button class="btn btn-primary mt-md" onclick="SavvySpend.navigate(\'#/home\')">Back to Home</button>' +
          '</div>';
      }

      var cat = window.CATEGORIES[txn.category] || window.CATEGORIES.other;
      var formattedAmount = SavvySpend.formatCurrency(txn.amount);
      var amountClass = txn.amount > 0 ? 'text-positive' : 'text-primary-text';
      var formattedDate = SavvySpend.formatDate(txn.date);
      var timeLabel = txn.time || '00:00';
      var currCode = DataStore.getSettings().currency;
      var currencySymbol = (currCode && Object.prototype.hasOwnProperty.call(window.CURRENCIES, currCode) ? window.CURRENCIES[currCode] : { symbol: 'GH₵' }).symbol;

      // Render Tags
      var tagsHtml = '';
      if (txn.tags && txn.tags.length > 0) {
        tagsHtml = txn.tags.map(function (tag) {
          return '<span class="tag tag-removable flex flex-center gap-xs" data-tag="' + SavvySpend.escapeHtml(tag) + '">' +
            '#' + SavvySpend.escapeHtml(tag) +
            '<button class="btn-remove-tag" style="border: none; background: transparent; padding: 0 2px; cursor: pointer; color: var(--text-tertiary);"><i data-lucide="x" style="width: 10px; height: 10px;"></i></button>' +
            '</span>';
        }).join('');
      } else {
        tagsHtml = '<p class="text-xs text-secondary italic" id="no-tags-msg">No tags added yet</p>';
      }

      // 1. Unit Economics display if it is a product sale
      var unitEconomicsHtml = '';
      if (txn.productRevenue !== undefined && txn.productRevenue !== null) {
        var profit = txn.amount;
        var cost = txn.productCost || 0;
        var margin = txn.productRevenue > 0 ? Math.round((profit / txn.productRevenue) * 100) : 0;
        var profitClass = profit >= 0 ? 'text-positive' : 'text-negative';
        
        unitEconomicsHtml = '<div class="card p-md mb-lg bg-card" style="border: 1px solid var(--border);">' +
          '<h4 class="text-xs font-bold text-secondary uppercase tracking-wider mb-md">Unit Economics (Product Sales)</h4>' +
          '<div class="flex flex-between py-xs" style="border-bottom: 1px solid var(--border-light);">' +
          '<span class="text-xs text-secondary">Gained from Product (Revenue)</span>' +
          '<span class="text-xs font-semibold text-positive">' + SavvySpend.formatCurrency(txn.productRevenue) + '</span>' +
          '</div>' +
          '<div class="flex flex-between py-xs" style="border-bottom: 1px solid var(--border-light);">' +
          '<span class="text-xs text-secondary">Spent on Product (Cost)</span>' +
          '<span class="text-xs font-semibold text-negative">-' + SavvySpend.formatCurrency(cost) + '</span>' +
          '</div>' +
          '<div class="flex flex-between py-xs" style="border-bottom: 1px solid var(--border-light);">' +
          '<span class="text-xs text-secondary font-bold">Net Profit</span>' +
          '<span class="text-xs font-bold ' + profitClass + '">' + SavvySpend.formatCurrency(profit) + '</span>' +
          '</div>' +
          '<div class="flex flex-between py-xs">' +
          '<span class="text-xs text-secondary">Operating Margin</span>' +
          '<span class="badge" style="background: ' + (profit >= 0 ? 'var(--primary-light)' : 'var(--red-light)') + '; color: ' + (profit >= 0 ? 'var(--primary-dark)' : 'var(--red)') + '; font-size: 0.7rem; padding: 2px 6px; font-weight: 700; border-radius: var(--radius-sm);">' + margin + '% Margin</span>' +
          '</div>' +
          '</div>';
      }

      // 2. Itemized Purchase Breakdown
      var itemizedHtml = '';
      if (txn.isItemized && txn.items && txn.items.length > 0) {
        var itemsRows = txn.items.map(function (it) {
          return '<tr style="border-bottom: 1px solid var(--border-light);">' +
            '<td style="padding: 8px 4px; text-align: left; font-size: 0.8rem; color: var(--text-primary);">' + SavvySpend.escapeHtml(it.description) + '</td>' +
            '<td style="padding: 8px 4px; text-align: center; font-size: 0.8rem; color: var(--text-secondary);">' + it.quantity + '</td>' +
            '<td style="padding: 8px 4px; text-align: right; font-size: 0.8rem; color: var(--text-secondary);">' + SavvySpend.formatCurrencyPlain(it.rate) + '</td>' +
            '<td style="padding: 8px 4px; text-align: right; font-size: 0.8rem; font-weight: bold; color: var(--text-primary);">' + SavvySpend.formatCurrencyPlain(it.quantity * it.rate) + '</td>' +
            '</tr>';
        }).join('');

        itemizedHtml = '<div class="card p-md mb-lg bg-card" style="border: 1px solid var(--border);">' +
          '<h4 class="text-xs font-bold text-secondary uppercase tracking-wider mb-sm">Itemized Purchase Breakdown</h4>' +
          '<table style="width: 100%; border-collapse: collapse; margin-top: 8px;">' +
          '<thead>' +
          '<tr style="border-bottom: 2px solid var(--border); font-size: 0.7rem; text-transform: uppercase; color: var(--text-secondary);">' +
          '<th style="padding: 6px 4px; text-align: left;">Item</th>' +
          '<th style="padding: 6px 4px; text-align: center; width: 40px;">Qty</th>' +
          '<th style="padding: 6px 4px; text-align: right; width: 70px;">Rate</th>' +
          '<th style="padding: 6px 4px; text-align: right; width: 80px;">Total</th>' +
          '</tr>' +
          '</thead>' +
          '<tbody>' +
          itemsRows +
          '</tbody>' +
          '</table>' +
          '<div style="text-align: right; margin-top: 10px; font-size: 0.8rem; font-weight: bold; color: var(--text-primary);">' +
          'Total Amount: ' + SavvySpend.formatCurrency(Math.abs(txn.amount)) +
          '</div>' +
          '</div>';
      }

      // 3. AI Scanned Receipt module
      var receiptHtml = '';
      if (txn.hasReceipt) {
        var receiptItemsHtml = '';
        if (txn.isItemized && txn.items && txn.items.length > 0) {
          receiptItemsHtml = txn.items.map(function (it) {
            return '<div style="display: flex; justify-content: space-between; font-family: monospace; font-size: 0.75rem; margin-bottom: 2px;">' +
              '<span>' + SavvySpend.escapeHtml(it.description) + ' x' + it.quantity + '</span>' +
              '<span>' + SavvySpend.formatCurrencyPlain(it.quantity * it.rate) + '</span>' +
              '</div>';
          }).join('');
        } else {
          receiptItemsHtml = '<div style="display: flex; justify-content: space-between; font-family: monospace; font-size: 0.75rem; margin-bottom: 2px;">' +
            '<span>General Purchase</span>' +
            '<span>' + SavvySpend.formatCurrencyPlain(Math.abs(txn.amount)) + '</span>' +
            '</div>';
        }

        receiptHtml = '<div class="card p-md mb-lg bg-card" style="border: 1px solid var(--border); overflow: hidden; background: #fff; color: #111827; border-radius: var(--radius-md); box-shadow: var(--shadow-sm);">' +
          '<h4 class="text-xs font-bold text-secondary uppercase tracking-wider mb-sm">AI Scanned Receipt Slip</h4>' +
          '<div style="border: 2px dashed #9CA3AF; padding: 16px; background: #FFFDF5; position: relative; color: #374151;">' +
          '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-25deg); opacity: 0.1; font-size: 2.2rem; font-weight: 900; color: #10B981; border: 4px solid #10B981; padding: 4px 12px; border-radius: var(--radius-sm); pointer-events: none; text-transform: uppercase;">' +
          'VERIFIED OCR' +
          '</div>' +
          '<div style="text-align: center; margin-bottom: 12px;">' +
          '<h3 style="font-family: monospace; font-weight: bold; font-size: 0.95rem; margin: 0; text-transform: uppercase;">' + SavvySpend.escapeHtml(txn.merchant) + '</h3>' +
          '<p style="font-family: monospace; font-size: 0.65rem; margin: 2px 0 0; color: #6B7280;">Airport City, Accra, Ghana</p>' +
          '<p style="font-family: monospace; font-size: 0.65rem; margin: 0; color: #6B7280;">Tel: +233 30 200 9999</p>' +
          '</div>' +
          '<div style="border-bottom: 1px dashed #6B7280; margin-bottom: 8px; padding-bottom: 4px; font-family: monospace; font-size: 0.7rem; color: #6B7280;">' +
          '<div>DATE: ' + formattedDate + '</div>' +
          '<div>TIME: ' + timeLabel + '</div>' +
          '<div>RECEIPT NO: GHS-' + txn.id.substring(3).toUpperCase() + '</div>' +
          '</div>' +
          '<div style="margin-bottom: 8px;">' +
          receiptItemsHtml +
          '</div>' +
          '<div style="border-top: 1px dashed #6B7280; padding-top: 8px; font-family: monospace; font-size: 0.75rem; font-weight: bold;">' +
          '<div style="display: flex; justify-content: space-between;">' +
          '<span>SUBTOTAL:</span>' +
          '<span>' + SavvySpend.formatCurrencyPlain(Math.abs(txn.amount)) + '</span>' +
          '</div>' +
          '<div style="display: flex; justify-content: space-between; font-size: 0.65rem; font-weight: normal; color: #6B7280; margin-top: 2px;">' +
          '<span>TAX (VAT 0%):</span>' +
          '<span>0.00</span>' +
          '</div>' +
          '<div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-top: 6px; border-top: 1px solid #374151; padding-top: 4px;">' +
          '<span>GRAND TOTAL:</span>' +
          '<span>' + SavvySpend.escapeHtml(currencySymbol) + ' ' + SavvySpend.formatCurrencyPlain(Math.abs(txn.amount)) + '</span>' +
          '</div>' +
          '</div>' +
          '<div style="border-top: 1px dashed #6B7280; margin-top: 12px; padding-top: 6px; text-align: center; font-family: monospace; font-size: 0.65rem; color: #6B7280;">' +
          '<div>ACCOUNT: ' + SavvySpend.escapeHtml(txn.paymentMethod) + '</div>' +
          '<div style="margin-top: 6px; font-weight: bold; color: #10B981;">*** THANK YOU FOR YOUR VISIT ***</div>' +
          '</div>' +
          '</div>' +
          '</div>';
      }

      var detailRowsHtml = '<div class="detail-row flex flex-between py-sm" style="border-bottom: 1px solid var(--border-light);">' +
        '<span class="text-xs text-secondary">Category</span>' +
        '<span class="text-xs font-semibold text-primary-text">' + cat.name + '</span>' +
        '</div>' +
        '<div class="detail-row flex flex-between py-sm" style="border-bottom: 1px solid var(--border-light);">' +
        '<span class="text-xs text-secondary">Date & Time</span>' +
        '<span class="text-xs font-semibold text-primary-text">' + formattedDate + ' at ' + timeLabel + '</span>' +
        '</div>' +
        '<div class="detail-row flex flex-between py-sm" style="border-bottom: 1px solid var(--border-light);">' +
        '<span class="text-xs text-secondary">Payment Account</span>' +
        '<span class="text-xs font-semibold text-primary-text">' + SavvySpend.escapeHtml(txn.paymentMethod) + '</span>' +
        '</div>';

      if (txn.isRecurring) {
        var intervalLabel = (txn.recurrenceInterval ? txn.recurrenceInterval.charAt(0).toUpperCase() + txn.recurrenceInterval.slice(1) : 'Monthly');
        detailRowsHtml += '<div class="detail-row flex flex-between py-sm" style="border-bottom: 1px solid var(--border-light);">' +
          '<span class="text-xs text-secondary">🔁 Recurrence</span>' +
          '<span class="text-xs font-semibold text-primary">' + intervalLabel + ' Recurring</span>' +
          '</div>';
      }

      detailRowsHtml += '<div class="detail-row flex flex-between py-sm" style="border-bottom: 1px solid var(--border-light); align-items: center;">' +
        '<span class="text-xs text-secondary">💼 Business Transaction</span>' +
        '<label class="toggle-switch" style="transform: scale(0.85); transform-origin: right center;">' +
        '<input type="checkbox" id="btn-toggle-business-txn" class="toggle-input" ' + (txn.isBusiness ? 'checked' : '') + '>' +
        '<span class="toggle-slider"></span>' +
        '</label>' +
        '</div>';

      if (txn.invoiceId) {
        var invoices = DataStore.getInvoices();
        var inv = invoices.find(function (i) { return i.id === txn.invoiceId; });
        var invNum = inv ? inv.invoiceNumber : 'INV-Ref';
        detailRowsHtml += '<div class="detail-row flex flex-between py-sm" style="border-bottom: none;">' +
          '<span class="text-xs text-secondary">📄 Linked Invoice</span>' +
          '<span class="text-xs font-semibold text-primary flex flex-center gap-xxs" style="cursor: pointer;" id="lnk-view-invoice" data-invoice-id="' + txn.invoiceId + '">' +
          SavvySpend.escapeHtml(invNum) + ' <i data-lucide="external-link" style="width: 12px; height: 12px;"></i>' +
          '</span>' +
          '</div>';
      }

      var html = '<!-- Header -->' +
        '<div class="page-header mt-sm mb-md flex flex-between flex-center">' +
        '<div class="flex flex-center gap-md">' +
        '<button class="btn-icon" id="btn-back-home"><i data-lucide="arrow-left"></i></button>' +
        '<div>' +
        '<h2 class="page-title text-lg font-extrabold hero-title" style="margin: 0;">Details</h2>' +
        '<span class="text-xs text-secondary">Transaction Info</span>' +
        '</div>' +
        '</div>' +
        '</div>' +

        '<!-- Big Amount Card -->' +
        '<div class="card p-lg mb-lg text-center bg-card" style="border: 1px solid var(--border); box-shadow: var(--shadow-sm);">' +
        '<div class="flex flex-center mb-sm">' +
        '<div class="flex flex-center" style="width: 56px; height: 56px; border-radius: 50%; background: ' + cat.color + '15; color: ' + cat.color + ';">' +
        '<i data-lucide="' + cat.icon + '" style="width: 28px; height: 28px;"></i>' +
        '</div>' +
        '</div>' +
        '<h1 class="text-3xl font-extrabold ' + amountClass + ' mb-xs" style="letter-spacing: -0.5px;">' + formattedAmount + '</h1>' +
        '<h3 class="text-sm font-bold text-primary-text mb-sm">' + SavvySpend.escapeHtml(txn.merchant) + '</h3>' +
        
        '<div class="flex flex-center gap-xs">' +
        '<span class="status-badge flex flex-center gap-xs px-sm py-xs" style="background: var(--primary-light); color: var(--primary-dark); font-weight: 700; border-radius: var(--radius-full); font-size: 0.7rem; text-transform: uppercase;">' +
        '<i data-lucide="check-circle" style="width: 12px; height: 12px;"></i>' +
        SavvySpend.escapeHtml(txn.status) +
        '</span>' +
        (txn.isBusiness ? 
          '<span class="status-badge flex flex-center gap-xs px-sm py-xs" style="background: var(--orange-light); color: var(--orange); font-weight: 700; border-radius: var(--radius-full); font-size: 0.7rem; text-transform: uppercase; border: 1px solid rgba(200, 130, 66, 0.15);">' +
          '<i data-lucide="briefcase" style="width: 12px; height: 12px;"></i>' +
          'Business' +
          '</span>' : '') +
        (txn.isRecurring ? 
          '<span class="status-badge flex flex-center gap-xs px-sm py-xs" style="background: var(--primary-light); color: var(--primary-dark); font-weight: 700; border-radius: var(--radius-full); font-size: 0.7rem; text-transform: uppercase; border: 1px solid rgba(16, 185, 129, 0.15);">' +
          '<i data-lucide="repeat" style="width: 12px; height: 12px;"></i>' +
          'Recurring' +
          '</span>' : '') +
        '</div>' +
        '</div>' +

        unitEconomicsHtml +
        itemizedHtml +
        receiptHtml +

        '<!-- Detail Table Card -->' +
        '<div class="card p-md mb-lg bg-card" style="border: 1px solid var(--border);">' +
        detailRowsHtml +
        '</div>' +

        '<!-- Notes and Editing Area -->' +
        '<div class="card p-md mb-lg bg-card" style="border: 1px solid var(--border);">' +
        '<h4 class="text-xs font-bold text-secondary uppercase tracking-wider mb-sm">Transaction Notes</h4>' +
        '<textarea class="form-input text-sm" id="txn-detail-notes" rows="3" style="resize: none; width: 100%; border-radius: var(--radius-md); padding: 8px; border: 1px solid var(--border); font-family: var(--font-family);" placeholder="Tap to add notes...">' + SavvySpend.escapeHtml(txn.notes || '') + '</textarea>' +
        '<button class="btn btn-primary btn-sm mt-sm w-full" id="btn-save-notes" style="display: none;">Save Notes</button>' +
        '</div>' +

        '<!-- Tags Area -->' +
        '<div class="card p-md mb-lg bg-card" style="border: 1px solid var(--border);">' +
        '<h4 class="text-xs font-bold text-secondary uppercase tracking-wider mb-sm">Tags</h4>' +
        '<div class="flex flex-wrap gap-xs mb-sm" id="tags-list">' +
        tagsHtml +
        '</div>' +
        '<div class="flex gap-sm">' +
        '<input class="form-input text-xs" type="text" id="input-new-tag" placeholder="Add tag..." style="flex: 1; padding: 6px 10px;">' +
        '<button class="btn btn-outline btn-sm" id="btn-add-tag">Add</button>' +
        '</div>' +
        '</div>' +

        '<!-- Action Grid -->' +
        '<div class="flex gap-md mb-lg">' +
        '<button class="btn btn-outline w-full flex flex-center gap-xs" id="btn-view-receipt" style="background: var(--bg-card); border-color: var(--border);">' +
        '<i data-lucide="receipt"></i> View Receipt' +
        '</button>' +
        '<button class="btn btn-outline w-full flex flex-center gap-xs" id="btn-split-expense" style="background: var(--bg-card); border-color: var(--border);">' +
        '<i data-lucide="split"></i> Split Bill' +
        '</button>' +
        '</div>' +

        '<!-- Delete Transaction Button -->' +
        '<button class="btn btn-danger w-full mb-xl" id="btn-delete-txn">Delete Transaction</button>';

      return html;
    },

    afterRender: function (txnId) {
      var txn = DataStore.getTransaction(txnId);
      if (!txn) return;

      var toggleBiz = document.getElementById('btn-toggle-business-txn');
      if (toggleBiz) {
        toggleBiz.addEventListener('change', function () {
          var isChecked = toggleBiz.checked;
          var tags = txn.tags || [];
          if (isChecked) {
            if (!tags.includes('business')) tags.push('business');
          } else {
            tags = tags.filter(function (t) { return t !== 'business'; });
          }

          DataStore.updateTransaction(txnId, { isBusiness: isChecked, tags: tags });
          SavvySpend.showToast(isChecked ? 'Marked as business transaction!' : 'Removed from business transactions.', 'success');
          SavvySpend.handleRoute();
        });
      }

      var lnkInvoice = document.getElementById('lnk-view-invoice');
      if (lnkInvoice) {
        lnkInvoice.addEventListener('click', function () {
          SavvySpend.navigate('#/business');
        });
      }

      document.getElementById('btn-back-home').addEventListener('click', function () {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          SavvySpend.navigate('#/home');
        }
      });

      var notesArea = document.getElementById('txn-detail-notes');
      var saveNotesBtn = document.getElementById('btn-save-notes');
      
      notesArea.addEventListener('input', function () {
        saveNotesBtn.style.display = 'block';
      });

      saveNotesBtn.addEventListener('click', function () {
        var updatedNotes = notesArea.value.trim();
        DataStore.updateTransaction(txnId, { notes: updatedNotes });
        saveNotesBtn.style.display = 'none';
        SavvySpend.showToast('Notes saved successfully!', 'success');
      });

      document.getElementById('btn-delete-txn').addEventListener('click', function () {
        SavvySpend.confirmAction('Are you sure you want to delete this transaction? This will also revert any linked budget spend calculation.', function () {
          if (txn.amount < 0 && !txn.isBusiness) {
            var budgets = DataStore.getBudgets();
            var b = budgets.find(function (x) { return x.category === txn.category; });
            if (b) {
              b.spent = Math.max(0, b.spent - Math.abs(txn.amount));
              DataStore.updateBudget(b.id, { spent: b.spent });
            }
          }

          DataStore.deleteTransaction(txnId);
          SavvySpend.showToast('Transaction deleted.', 'info');
          SavvySpend.navigate('#/home');
        });
      });

      var addTagBtn = document.getElementById('btn-add-tag');
      var newTagInput = document.getElementById('input-new-tag');
      var tagsList = document.getElementById('tags-list');

      function updateTagsInStorage(newTags) {
        DataStore.updateTransaction(txnId, { tags: newTags });
        txn.tags = newTags;
      }

      addTagBtn.addEventListener('click', function () {
        var val = newTagInput.value.trim().toLowerCase().replace(/#/g, '');
        if (!val) return;

        var currentTags = txn.tags || [];
        if (currentTags.includes(val)) {
          SavvySpend.showToast('Tag already exists.', 'warning');
          return;
        }

        currentTags.push(val);
        updateTagsInStorage(currentTags);
        newTagInput.value = '';

        var noMsg = document.getElementById('no-tags-msg');
        if (noMsg) noMsg.remove();

        var tagSpan = document.createElement('span');
        tagSpan.className = 'tag tag-removable flex flex-center gap-xs';
        tagSpan.setAttribute('data-tag', val);
        tagSpan.innerHTML = '#' + SavvySpend.escapeHtml(val) +
          '<button class="btn-remove-tag" style="border: none; background: transparent; padding: 0 2px; cursor: pointer; color: var(--text-tertiary);"><i data-lucide="x" style="width: 10px; height: 10px;"></i></button>';
        tagsList.appendChild(tagSpan);

        if (window.lucide) lucide.createIcons();
        bindTagRemove(tagSpan, val);
        SavvySpend.showToast('Tag added!', 'success');
      });

      function bindTagRemove(spanEl, tagVal) {
        spanEl.querySelector('.btn-remove-tag').addEventListener('click', function () {
          var currentTags = txn.tags || [];
          currentTags = currentTags.filter(function (t) { return t !== tagVal; });
          updateTagsInStorage(currentTags);
          spanEl.remove();

          if (currentTags.length === 0) {
            tagsList.innerHTML = '<p class="text-xs text-secondary italic" id="no-tags-msg">No tags added yet</p>';
          }
          SavvySpend.showToast('Tag removed.', 'info');
        });
      }

      var tagSpans = tagsList.querySelectorAll('.tag-removable');
      tagSpans.forEach(function (span) {
        var tagVal = span.getAttribute('data-tag');
        bindTagRemove(span, tagVal);
      });

      // Receipt Scan slip display action
      var btnViewReceipt = document.getElementById('btn-view-receipt');
      if (btnViewReceipt) {
        btnViewReceipt.addEventListener('click', function () {
          if (txn.hasReceipt) {
            alert('Receipt slip is shown below in the "AI Scanned Receipt Slip" card.');
          } else {
            alert('No scanned receipt attached to this transaction. You can attach a receipt when creating transactions.');
          }
        });
      }

      // Split Bill Action
      document.getElementById('btn-split-expense').addEventListener('click', function () {
        var count = prompt('How many people to split the bill with (including you)?', '3');
        if (count && !isNaN(count)) {
          var share = Math.abs(txn.amount) / parseInt(count);
          alert('Split details:\nTotal Amount: ' + SavvySpend.formatCurrencyPlain(Math.abs(txn.amount)) + '\nSplit Count: ' + count + '\nEach person owes: ' + SavvySpend.formatCurrencyPlain(share));
          SavvySpend.showToast('Bill split calculation complete!', 'success');
        }
      });
    },

    destroy: function () {
      // Cleanup
    }
  };

  window.SavvySpend.pages.Transaction = Transaction;
})();
