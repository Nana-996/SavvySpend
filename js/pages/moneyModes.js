/**
 * SavvySpend — Money Modes Page
 */
(function () {
  'use strict';

  window.SavvySpend = window.SavvySpend || {};
  window.SavvySpend.pages = window.SavvySpend.pages || {};

  var MoneyModes = {
    render: function (param) {
      var modes = DataStore.getMoneyModes();
      var settings = DataStore.getSettings();
      var activeModeId = settings.activeModeId || 'none';
      var categories = DataStore.getCustomCategories();
      var goals = DataStore.getGoals();

      var modesHtml = modes.map(function (m) {
        var isActive = m.id === activeModeId;
        var activeClass = isActive ? 'border-primary' : 'border-light';
        var activeBadge = isActive ? `
          <span class="status-badge flex flex-center gap-xxs" style="background: var(--primary-light); color: var(--primary-dark); font-weight: 600; padding: 2px 8px; border-radius: var(--radius-full); font-size: 0.7rem; border: 1px solid var(--primary-glow);">
            <i data-lucide="check" style="width: 12px; height: 12px;"></i> Active
          </span>
        ` : '';

        // Format overrides preview
        var overridesCount = Object.keys(m.budgetOverrides || {}).length;
        var priorityCount = Object.keys(m.goalPriorities || {}).length;
        
        var detailsHtml = [];
        if (overridesCount > 0) {
          detailsHtml.push(`<span class="flex flex-center gap-xxs"><i data-lucide="wallet" style="width: 12px; height: 12px;"></i> ${overridesCount} Budgets</span>`);
        }
        if (priorityCount > 0) {
          detailsHtml.push(`<span class="flex flex-center gap-xxs"><i data-lucide="target" style="width: 12px; height: 12px;"></i> ${priorityCount} Priorities</span>`);
        }
        var detailsString = detailsHtml.length > 0 ? detailsHtml.join(' • ') : 'Standard settings';

        var editButtons = m.isCustom ? `
          <button class="btn btn-outline btn-sm btn-edit-mode" data-id="${m.id}" style="padding: 4px 10px; font-size: 0.75rem; background: var(--bg-card);">Edit</button>
          <button class="btn btn-outline btn-sm text-negative btn-delete-mode" data-id="${m.id}" style="padding: 4px 10px; font-size: 0.75rem; border-color: var(--red-light); background: var(--bg-card);">Delete</button>
        ` : '';

        var activateButton = !isActive ? `
          <button class="btn btn-primary btn-sm btn-activate-mode" data-id="${m.id}" style="padding: 4px 12px; font-size: 0.75rem;">Activate</button>
        ` : `
          <button class="btn btn-outline btn-sm btn-deactivate-mode" data-id="${m.id}" style="padding: 4px 12px; font-size: 0.75rem; color: var(--text-secondary); background: var(--bg-secondary);">Deactivate</button>
        `;

        return `
          <div class="card p-md mb-md ${activeClass}" style="border: 1px solid ${isActive ? 'var(--primary)' : 'var(--border)'}; background: var(--bg-card); transition: box-shadow 0.2s;">
            <div class="flex flex-between mb-xs">
              <div class="flex flex-center gap-sm">
                <div class="flex flex-center" style="width: 32px; height: 32px; border-radius: 50%; background: ${m.isCustom ? 'var(--orange-light)' : 'var(--primary-light)'}; color: ${m.isCustom ? 'var(--orange)' : 'var(--primary)'};">
                  <i data-lucide="${m.isCustom ? 'sliders' : 'zap'}" style="width: 16px; height: 16px;"></i>
                </div>
                <div>
                  <h4 class="text-sm font-bold" style="margin: 0;">${m.name}</h4>
                  <p class="text-xxs text-secondary" style="margin: 0; line-height: 1.3;">${detailsString}</p>
                </div>
              </div>
              ${activeBadge}
            </div>

            <p class="text-xs text-primary-text italic mt-xs mb-sm" style="opacity: 0.8; line-height: 1.4;">
              "${m.guidanceTip}"
            </p>

            <div class="flex flex-between mt-md pt-sm border-top" style="border-color: var(--border-light);">
              <div class="flex gap-xs">
                ${editButtons}
              </div>
              <div>
                ${activateButton}
              </div>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="page-header flex flex-between mt-sm mb-lg">
          <div>
            <button class="btn-icon mb-xs" onclick="window.history.back()" style="margin-left: -8px;">
              <i data-lucide="arrow-left"></i>
            </button>
            <h1 class="page-title text-2xl font-black">Money Modes</h1>
            <p class="page-subtitle text-xs text-secondary">Switch budget rules to fit your real life.</p>
          </div>
          <button class="btn btn-primary btn-sm flex flex-center gap-xs" id="btn-create-mode" style="height: 36px; border-radius: var(--radius-md);">
            <i data-lucide="plus" style="width: 16px; height: 16px;"></i> Create Mode
          </button>
        </div>

        <div class="modes-list mt-md">
          ${modesHtml}
        </div>

        <div class="card p-md mt-lg text-center" style="background: var(--bg-secondary); border: 1px dashed var(--border);">
          <i data-lucide="info" class="text-secondary mb-xs" style="width: 20px; height: 20px; margin: 0 auto 4px;"></i>
          <p class="text-xs text-secondary" style="margin: 0; line-height: 1.4;">
            Active modes automatically scale your budget categories and adjust goal priorities on your dashboard and budget pages.
          </p>
        </div>
      `;
    },

    afterRender: function (param) {
      // ── Activate Mode ──
      var actButtons = document.querySelectorAll('.btn-activate-mode');
      actButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-id');
          DataStore.updateSettings({ activeModeId: id });
          SavvySpend.showToast('Mode activated!', 'success');
          var xpRes = DataStore.addXP(10);
          if (xpRes.leveled) {
            SavvySpend.showToast(`Level Up! You reached Level ${xpRes.newLevel}!`, 'success');
          }
          SavvySpend.handleRoute();
        });
      });

      // ── Deactivate Mode ──
      var deactButtons = document.querySelectorAll('.btn-deactivate-mode');
      deactButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          DataStore.updateSettings({ activeModeId: 'none' });
          SavvySpend.showToast('Money mode disabled. Restored defaults.', 'info');
          SavvySpend.handleRoute();
        });
      });

      // ── Delete Mode ──
      var delButtons = document.querySelectorAll('.btn-delete-mode');
      delButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-id');
          if (confirm('Are you sure you want to delete this custom mode?')) {
            DataStore.deleteMoneyMode(id);
            SavvySpend.showToast('Mode deleted.', 'info');
            SavvySpend.handleRoute();
          }
        });
      });

      // ── Create Custom Mode ──
      document.getElementById('btn-create-mode').addEventListener('click', function () {
        MoneyModes.openCreateModal();
      });

      // ── Edit Custom Mode ──
      var editButtons = document.querySelectorAll('.btn-edit-mode');
      editButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-id');
          MoneyModes.openCreateModal(id);
        });
      });
    },

    openCreateModal: function (modeId) {
      var categories = DataStore.getCustomCategories();
      var goals = DataStore.getGoals();
      var mode = modeId ? DataStore.getMoneyModes().find(function (m) { return m.id === modeId; }) : null;

      var title = mode ? 'Edit Money Mode' : 'Create Money Mode';
      var modeName = mode ? mode.name : '';
      var modeTip = mode ? mode.guidanceTip : '';
      
      // Category budget overrides grid
      var categoryFieldsHtml = categories
        .filter(function (c) { return c.id !== 'income'; })
        .map(function (c) {
          var existingVal = (mode && mode.budgetOverrides && mode.budgetOverrides[c.id] !== undefined)
            ? mode.budgetOverrides[c.id]
            : '';
          
          return `
            <div class="flex flex-between flex-center mb-sm" style="background: var(--bg-secondary); padding: 8px; border-radius: var(--radius-sm);">
              <div class="flex flex-center gap-xs text-xs font-semibold">
                <div style="width: 8px; height: 8px; border-radius: 50%; background: ${c.color};"></div>
                ${c.name}
              </div>
              <div style="width: 90px; position: relative;">
                <input class="form-input override-input" type="number" data-category="${c.id}" value="${existingVal}" placeholder="Auto" style="height: 32px; padding: 4px 8px; font-size: 0.8rem; text-align: right;">
              </div>
            </div>
          `;
        }).join('');

      // Goal Priorities overrides grid
      var goalFieldsHtml = goals.length === 0 ? '<p class="text-xs text-secondary">No goals created yet.</p>' : goals.map(function (g) {
        var existingVal = (mode && mode.goalPriorities && mode.goalPriorities[g.id] !== undefined)
          ? mode.goalPriorities[g.id]
          : 'medium';
        
        return `
          <div class="flex flex-between flex-center mb-sm" style="background: var(--bg-secondary); padding: 8px; border-radius: var(--radius-sm);">
            <span class="text-xs font-semibold truncate" style="max-width: 140px;">🎯 ${g.name}</span>
            <select class="form-select priority-select" data-goal="${g.id}" style="height: 32px; width: 100px; padding: 4px; font-size: 0.8rem;">
              <option value="high" ${existingVal === 'high' ? 'selected' : ''}>🔥 High</option>
              <option value="medium" ${existingVal === 'medium' ? 'selected' : ''}>⚡ Medium</option>
              <option value="low" ${existingVal === 'low' ? 'selected' : ''}>💤 Low</option>
            </select>
          </div>
        `;
      }).join('');

      var html = `
        <div class="modal-header flex flex-between">
          <h3 class="modal-title">${title}</h3>
          <button class="btn-icon" onclick="SavvySpend.closeModal()"><i data-lucide="x"></i></button>
        </div>
        <form id="mode-form" class="mt-md" style="max-height: 70vh; overflow-y: auto; padding-right: 4px;">
          <div class="form-group">
            <label class="form-label" for="mode-name">Mode Name</label>
            <input class="form-input" type="text" id="mode-name" value="${modeName}" placeholder="e.g. School Week, Project Mode" required style="height: 40px;">
          </div>

          <div class="form-group mt-md">
            <label class="form-label" for="mode-tip">Guidance & Tips</label>
            <textarea class="form-input" id="mode-tip" placeholder="What advice should show up when active?" required rows="2" style="resize: none;">${modeTip}</textarea>
          </div>

          <div class="form-group mt-lg">
            <label class="form-label">Category Budget Limits (Overrides)</label>
            <p class="text-xxs text-secondary mb-sm" style="line-height: 1.3;">Set custom limit values for this mode. Leave empty to keep default limits.</p>
            ${categoryFieldsHtml}
          </div>

          <div class="form-group mt-lg">
            <label class="form-label">Goal Priorities Override</label>
            <p class="text-xxs text-secondary mb-sm" style="line-height: 1.3;">Set target goal priority when this mode is active.</p>
            ${goalFieldsHtml}
          </div>

          <div class="modal-footer mt-xl flex gap-md">
            <button type="button" class="btn btn-outline w-full" onclick="SavvySpend.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary w-full">Save Mode</button>
          </div>
        </form>
      `;

      SavvySpend.showModal(html);

      // Handle submit
      document.getElementById('mode-form').addEventListener('submit', function (e) {
        e.preventDefault();

        var name = document.getElementById('mode-name').value.trim();
        var tip = document.getElementById('mode-tip').value.trim();

        if (!name || !tip) {
          alert('Please fill out all fields.');
          return;
        }

        // Gather budget overrides
        var budgetOverrides = {};
        var overrideInputs = document.querySelectorAll('.override-input');
        overrideInputs.forEach(function (inp) {
          var val = inp.value.trim();
          if (val !== '') {
            var num = parseFloat(val);
            if (!isNaN(num) && num >= 0) {
              budgetOverrides[inp.getAttribute('data-category')] = num;
            }
          }
        });

        // Gather goal priorities
        var goalPriorities = {};
        var prioritySelects = document.querySelectorAll('.priority-select');
        prioritySelects.forEach(function (sel) {
          goalPriorities[sel.getAttribute('data-goal')] = sel.value;
        });

        if (mode) {
          // Update
          DataStore.updateMoneyMode(mode.id, {
            name: name,
            guidanceTip: tip,
            budgetOverrides: budgetOverrides,
            goalPriorities: goalPriorities
          });
          SavvySpend.showToast('Mode updated!', 'success');
        } else {
          // Create
          var newMode = {
            id: 'mode_' + SavvySpend.generateId(),
            name: name,
            isCustom: true,
            budgetOverrides: budgetOverrides,
            goalPriorities: goalPriorities,
            guidanceTip: tip
          };
          DataStore.addMoneyMode(newMode);
          SavvySpend.showToast('Mode created!', 'success');
          
          var xpRes = DataStore.addXP(20);
          if (xpRes.leveled) {
            SavvySpend.showToast(`Level Up! You reached Level ${xpRes.newLevel}!`, 'success');
          }
        }

        SavvySpend.closeModal();
        SavvySpend.handleRoute();
      });
    },

    destroy: function () {
      // Cleanup
    }
  };

  window.SavvySpend.pages.MoneyModes = MoneyModes;
})();
