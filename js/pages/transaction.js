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
        return `
          <div class="page-header mt-sm mb-lg flex flex-center gap-md">
            <button class="btn-icon" onclick="SavvySpend.navigate('#/home')"><i data-lucide="arrow-left"></i></button>
            <h2 class="page-title text-base font-bold">Transaction Not Found</h2>
          </div>
          <div class="card p-lg text-center">
            <p class="text-secondary text-sm">The selected transaction could not be found.</p>
            <button class="btn btn-primary mt-md" onclick="SavvySpend.navigate('#/home')">Back to Home</button>
          </div>
        `;
      }

      var cat = window.CATEGORIES[txn.category] || window.CATEGORIES.other;
      var formattedAmount = SavvySpend.formatCurrency(txn.amount);
      var amountClass = txn.amount > 0 ? 'text-positive' : 'text-primary-text';
      var formattedDate = SavvySpend.formatDate(txn.date);
      var timeLabel = txn.time || '00:00';

      // Render Tags
      var tagsHtml = '';
      if (txn.tags && txn.tags.length > 0) {
        tagsHtml = txn.tags.map(function (tag) {
          return `
            <span class="tag tag-removable flex flex-center gap-xs" data-tag="${tag}">
              #${tag}
              <button class="btn-remove-tag" style="border: none; background: transparent; padding: 0 2px; cursor: pointer; color: var(--text-tertiary);"><i data-lucide="x" style="width: 10px; height: 10px;"></i></button>
            </span>
          `;
        }).join('');
      } else {
        tagsHtml = `<p class="text-xs text-secondary italic" id="no-tags-msg">No tags added yet</p>`;
      }

      return `
        <!-- Header -->
        <div class="page-header mt-sm mb-md flex flex-between flex-center">
          <div class="flex flex-center gap-md">
            <button class="btn-icon" id="btn-back-home"><i data-lucide="arrow-left"></i></button>
            <div>
              <h2 class="page-title text-lg font-extrabold" style="margin: 0;">Details</h2>
              <span class="text-xs text-secondary">Transaction Info</span>
            </div>
          </div>
        </div>

        <!-- Big Amount Card -->
        <div class="card p-lg mb-lg text-center bg-card" style="border: 1px solid var(--border); box-shadow: var(--shadow-sm);">
          <div class="flex flex-center mb-sm">
            <div class="flex flex-center" style="width: 56px; height: 56px; border-radius: 50%; background: ${cat.color}15; color: ${cat.color};">
              <i data-lucide="${cat.icon}" style="width: 28px; height: 28px;"></i>
            </div>
          </div>
          <h1 class="text-3xl font-extrabold ${amountClass} mb-xs" style="letter-spacing: -0.5px;">${formattedAmount}</h1>
          <h3 class="text-sm font-bold text-primary-text mb-sm">${txn.merchant}</h3>
          
          <div class="flex flex-center">
            <span class="status-badge flex flex-center gap-xs px-sm py-xs" style="background: var(--primary-light); color: var(--primary-dark); font-weight: 700; border-radius: var(--radius-full); font-size: 0.7rem; text-transform: uppercase;">
              <i data-lucide="check-circle" style="width: 12px; height: 12px;"></i>
              ${txn.status}
            </span>
          </div>
        </div>

        <!-- Detail Table Card -->
        <div class="card p-md mb-lg bg-card" style="border: 1px solid var(--border);">
          <div class="detail-row flex flex-between py-sm" style="border-bottom: 1px solid var(--border-light);">
            <span class="text-xs text-secondary">Category</span>
            <span class="text-xs font-semibold text-primary-text">${cat.name}</span>
          </div>
          <div class="detail-row flex flex-between py-sm" style="border-bottom: 1px solid var(--border-light);">
            <span class="text-xs text-secondary">Date & Time</span>
            <span class="text-xs font-semibold text-primary-text">${formattedDate} at ${timeLabel}</span>
          </div>
          <div class="detail-row flex flex-between py-sm" style="border-bottom: 1px solid var(--border-light);">
            <span class="text-xs text-secondary">Payment Method</span>
            <span class="text-xs font-semibold text-primary-text">${txn.paymentMethod} (****${txn.paymentLast4 || '0000'})</span>
          </div>
        </div>

        <!-- Notes and Editing Area -->
        <div class="card p-md mb-lg bg-card" style="border: 1px solid var(--border);">
          <h4 class="text-xs font-bold text-secondary uppercase tracking-wider mb-sm">Transaction Notes</h4>
          <textarea class="form-input text-sm" id="txn-detail-notes" rows="3" style="resize: none; width: 100%; border-radius: var(--radius-md); padding: 8px; border: 1px solid var(--border); font-family: var(--font-family);" placeholder="Tap to add notes...">${txn.notes || ''}</textarea>
          <button class="btn btn-primary btn-sm mt-sm w-full" id="btn-save-notes" style="display: none;">Save Notes</button>
        </div>

        <!-- Tags Area -->
        <div class="card p-md mb-lg bg-card" style="border: 1px solid var(--border);">
          <h4 class="text-xs font-bold text-secondary uppercase tracking-wider mb-sm">Tags</h4>
          <div class="flex flex-wrap gap-xs mb-sm" id="tags-list">
            ${tagsHtml}
          </div>
          <div class="flex gap-sm">
            <input class="form-input text-xs" type="text" id="input-new-tag" placeholder="Add tag..." style="flex: 1; padding: 6px 10px;">
            <button class="btn btn-outline btn-sm" id="btn-add-tag">Add</button>
          </div>
        </div>

        <!-- Action Grid -->
        <div class="flex gap-md mb-lg">
          <button class="btn btn-outline w-full flex flex-center gap-xs" id="btn-view-receipt" style="background: var(--bg-card); border-color: var(--border);">
            <i data-lucide="receipt"></i> Receipt
          </button>
          <button class="btn btn-outline w-full flex flex-center gap-xs" id="btn-split-expense" style="background: var(--bg-card); border-color: var(--border);">
            <i data-lucide="split"></i> Split Bill
          </button>
        </div>

        <!-- Delete Transaction Button -->
        <button class="btn btn-danger w-full mb-xl" id="btn-delete-txn">Delete Transaction</button>
      `;
    },

    afterRender: function (txnId) {
      var txn = DataStore.getTransaction(txnId);
      if (!txn) return;

      // Back navigation
      document.getElementById('btn-back-home').addEventListener('click', function () {
        // Go back in history or default to home
        if (window.history.length > 1) {
          window.history.back();
        } else {
          SavvySpend.navigate('#/home');
        }
      });

      // Notes edit logic
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

      // Delete Transaction logic
      document.getElementById('btn-delete-txn').addEventListener('click', function () {
        if (confirm('Are you sure you want to delete this transaction? This will also revert any linked budget spend calculation.')) {
          
          // Revert budget spent calculation if it's an expense
          if (txn.amount < 0) {
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
        }
      });

      // Tag add logic
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

        // Re-render tags HTML area
        var noMsg = document.getElementById('no-tags-msg');
        if (noMsg) noMsg.remove();

        var tagSpan = document.createElement('span');
        tagSpan.className = 'tag tag-removable flex flex-center gap-xs';
        tagSpan.setAttribute('data-tag', val);
        tagSpan.innerHTML = `
          #${val}
          <button class="btn-remove-tag" style="border: none; background: transparent; padding: 0 2px; cursor: pointer; color: var(--text-tertiary);"><i data-lucide="x" style="width: 10px; height: 10px;"></i></button>
        `;
        tagsList.appendChild(tagSpan);

        if (window.lucide) lucide.createIcons();

        // Bind delete on new tag
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
            tagsList.innerHTML = `<p class="text-xs text-secondary italic" id="no-tags-msg">No tags added yet</p>`;
          }
          SavvySpend.showToast('Tag removed.', 'info');
        });
      }

      // Bind all existing tags for deletion
      var tagSpans = tagsList.querySelectorAll('.tag-removable');
      tagSpans.forEach(function (span) {
        var tagVal = span.getAttribute('data-tag');
        bindTagRemove(span, tagVal);
      });

      // Receipt Mock Action
      document.getElementById('btn-view-receipt').addEventListener('click', function () {
        SavvySpend.showToast('Smart receipt matching is enabled! No physical receipt image uploaded.', 'info');
      });

      // Split Bill Mock Action
      document.getElementById('btn-split-expense').addEventListener('click', function () {
        var count = prompt('How many people to split the bill with (including you)?', '3');
        if (count && !isNaN(count)) {
          var share = Math.abs(txn.amount) / parseInt(count);
          alert(`Split details:\nTotal Amount: ${SavvySpend.formatCurrencyPlain(Math.abs(txn.amount))}\nSplit Count: ${count}\nEach person owes: ${SavvySpend.formatCurrencyPlain(share)}`);
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
