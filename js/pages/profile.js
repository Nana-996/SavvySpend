/**
 * SavvySpend — Profile & Settings Page
 */
(function () {
  'use strict';

  window.SavvySpend = window.SavvySpend || {};
  window.SavvySpend.pages = window.SavvySpend.pages || {};

  var Profile = {
    render: function (param) {
      var user = DataStore.getUser();
      var settings = DataStore.getSettings();
      var game = DataStore.getGameState();

      if (param === 'categories') {
        var categories = DataStore.getCustomCategories();
        var categoriesListHtml = categories.map(function (c) {
          var isCustom = c.isCustom || false;
          var badge = isCustom ? `
            <span class="status-badge" style="background: rgba(245, 158, 11, 0.1); color: #D97706; border: 1px solid rgba(245, 158, 11, 0.2); font-size: 0.7rem; font-weight: 600; padding: 2px 6px; border-radius: var(--radius-full);">Custom</span>
          ` : `
            <span class="status-badge" style="background: var(--primary-light); color: var(--primary-dark); border: 1px solid var(--primary-glow); font-size: 0.7rem; font-weight: 600; padding: 2px 6px; border-radius: var(--radius-full);">Default</span>
          `;

          var actions = `
            <button class="btn btn-outline btn-sm btn-edit-category" data-id="${c.id}" style="padding: 4px 10px; font-size: 0.75rem; background: var(--bg-card);">Edit</button>
          `;
          if (isCustom) {
            actions += `
              <button class="btn btn-outline btn-sm text-negative btn-delete-category" data-id="${c.id}" style="padding: 4px 10px; font-size: 0.75rem; border-color: var(--red-light); background: var(--bg-card);">Delete</button>
            `;
          }

          return `
            <div class="card p-md mb-md border-light" style="background: var(--bg-card); display: flex; flex-direction: column; gap: 12px;">
              <div class="flex flex-between flex-center">
                <div class="flex flex-center gap-sm">
                  <div class="flex flex-center" style="width: 36px; height: 36px; border-radius: 50%; background: ${c.color}22; color: ${c.color};">
                    <i data-lucide="${c.icon || 'tag'}" style="width: 18px; height: 18px;"></i>
                  </div>
                  <div>
                    <h4 class="text-sm font-bold" style="margin: 0; color: var(--text-primary);">${c.name}</h4>
                  </div>
                </div>
                ${badge}
              </div>
              <div class="flex flex-between border-top pt-sm" style="border-color: var(--border-light);">
                <div></div>
                <div class="flex gap-xs">
                  ${actions}
                </div>
              </div>
            </div>
          `;
        }).join('');

        return `
          <div class="page-header flex flex-between mt-sm mb-lg">
            <div>
              <button class="btn-icon mb-xs" onclick="SavvySpend.navigate('#/profile')" style="margin-left: -8px;">
                <i data-lucide="arrow-left"></i>
              </button>
              <h1 class="page-title text-2xl font-black">Custom Categories</h1>
              <p class="page-subtitle text-xs text-secondary">Manage your personal spending categories</p>
            </div>
            <button class="btn btn-primary btn-sm flex flex-center gap-xs" id="btn-create-category" style="height: 36px; border-radius: var(--radius-md);">
              <i data-lucide="plus" style="width: 16px; height: 16px;"></i> Create Category
            </button>
          </div>

          <div class="categories-list mt-md">
            ${categoriesListHtml}
          </div>

          <div class="card p-md mt-lg text-center" style="background: var(--bg-secondary); border: 1px dashed var(--border);">
            <i data-lucide="info" class="text-secondary mb-xs" style="width: 20px; height: 20px; margin: 0 auto 4px;"></i>
            <p class="text-xs text-secondary" style="margin: 0; line-height: 1.4;">
              Creating a custom category makes it immediately available when adding transactions and setting monthly budgets.
            </p>
          </div>
        `;
      }

      if (param === 'notes') {
        var notes = DataStore.getFutureNotes();
        var customCategories = DataStore.getCustomCategories();
        var notesListHtml = notes.length === 0 ? `
          <div class="card p-xl text-center" style="background: var(--bg-card); border: 1px dashed var(--border);">
            <i data-lucide="sticky-note" class="text-secondary mb-xs" style="width: 32px; height: 32px; margin: 0 auto 8px; opacity: 0.5;"></i>
            <h4 class="text-sm font-bold mb-xs" style="color: var(--text-primary);">No notes created yet</h4>
            <p class="text-xs text-secondary" style="margin: 0; line-height: 1.4;">
              Create warning notes to pop up whenever you select a specific category in the Add Transaction form!
            </p>
          </div>
        ` : notes.map(function (n) {
          var cat = customCategories.find(function (c) { return c.id === n.categoryId; }) || { name: 'Unknown Category', icon: 'tag', color: '#9CA3AF' };
          var activeClass = n.isActive ? 'border-primary' : 'border-light';
          var statusBadge = n.isActive ? `
            <span class="status-badge flex flex-center gap-xxs" style="background: var(--primary-light); color: var(--primary-dark); font-weight: 600; padding: 2px 8px; border-radius: var(--radius-full); font-size: 0.7rem; border: 1px solid var(--primary-glow);">
              <i data-lucide="check" style="width: 12px; height: 12px;"></i> Enabled
            </span>
          ` : `
            <span class="status-badge flex flex-center gap-xxs" style="background: var(--bg-secondary); color: var(--text-secondary); font-weight: 600; padding: 2px 8px; border-radius: var(--radius-full); font-size: 0.7rem; border: 1px solid var(--border);">
              Disabled
            </span>
          `;

          return `
            <div class="card p-md mb-md ${activeClass}" style="background: var(--bg-card); border: 1px solid ${n.isActive ? 'var(--primary)' : 'var(--border)'}; display: flex; flex-direction: column; gap: 12px;">
              <div class="flex flex-between flex-center">
                <div class="flex flex-center gap-xs">
                  <div class="flex flex-center" style="width: 24px; height: 24px; border-radius: 50%; background: ${cat.color}22; color: ${cat.color};">
                    <i data-lucide="${cat.icon || 'tag'}" style="width: 12px; height: 12px;"></i>
                  </div>
                  <span class="text-xs font-bold" style="color: var(--text-primary);">${cat.name} Note</span>
                </div>
                ${statusBadge}
              </div>
              
              <p class="text-xs italic text-primary-text" style="margin: 0; line-height: 1.4; color: var(--text-primary);">
                "${n.message}"
              </p>

              <div class="flex flex-between border-top pt-sm" style="border-color: var(--border-light);">
                <div>
                  <label class="toggle-switch flex-center" style="transform: scale(0.85); transform-origin: left center;">
                    <input type="checkbox" class="toggle-note-status" data-id="${n.id}" ${n.isActive ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                <div class="flex gap-xs">
                  <button class="btn btn-outline btn-sm btn-edit-note" data-id="${n.id}" style="padding: 4px 10px; font-size: 0.75rem; background: var(--bg-card);">Edit</button>
                  <button class="btn btn-outline btn-sm text-negative btn-delete-note" data-id="${n.id}" style="padding: 4px 10px; font-size: 0.75rem; border-color: var(--red-light); background: var(--bg-card);">Delete</button>
                </div>
              </div>
            </div>
          `;
        }).join('');

        return `
          <div class="page-header flex flex-between mt-sm mb-lg">
            <div>
              <button class="btn-icon mb-xs" onclick="SavvySpend.navigate('#/profile')" style="margin-left: -8px;">
                <i data-lucide="arrow-left"></i>
              </button>
              <h1 class="page-title text-2xl font-black">Future Self Notes</h1>
              <p class="page-subtitle text-xs text-secondary">Private warnings triggered during spending</p>
            </div>
            <button class="btn btn-primary btn-sm flex flex-center gap-xs" id="btn-create-note" style="height: 36px; border-radius: var(--radius-md);">
              <i data-lucide="plus" style="width: 16px; height: 16px;"></i> Create Note
            </button>
          </div>

          <div class="notes-list mt-md">
            ${notesListHtml}
          </div>

          <div class="card p-md mt-lg text-center" style="background: var(--bg-secondary); border: 1px dashed var(--border);">
            <i data-lucide="info" class="text-secondary mb-xs" style="width: 20px; height: 20px; margin: 0 auto 4px;"></i>
            <p class="text-xs text-secondary" style="margin: 0; line-height: 1.4;">
              Future Self Notes act as gentle interventions to keep you on track. When you log an expense, selecting the category displays your note immediately.
            </p>
          </div>
        `;
      }

      var currencyOptions = Object.keys(CURRENCIES).map(function (code) {
        var curr = CURRENCIES[code];
        var isSelected = settings.currency === code ? 'selected' : '';
        return `<option value="${code}" ${isSelected}>${curr.symbol} ${curr.name} (${code})</option>`;
      }).join('');

      return `
        <style>
          .profile-view {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          /* Profile Card Redesign */
          .profile-card-custom {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 24px 20px;
            text-align: center;
            position: relative;
            box-shadow: var(--shadow-sm);
            transition: box-shadow var(--transition-fast), border-color var(--transition-fast);
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .profile-card-custom:hover {
            box-shadow: var(--shadow-md);
            border-color: var(--text-tertiary);
          }

          .avatar-container-custom {
            position: relative;
            display: inline-block;
            width: 84px;
            height: 84px;
            margin: 0 auto;
          }

          .avatar-img-custom {
            width: 84px;
            height: 84px;
            border-radius: 50%;
            border: 1px solid var(--border);
            padding: 3px;
            background: var(--bg-card);
            transition: border-color var(--transition-base);
          }

          .avatar-container-custom:hover .avatar-img-custom {
            border-color: var(--primary);
          }

          .avatar-edit-badge-custom {
            position: absolute;
            bottom: 0;
            right: 0;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background: var(--primary);
            color: #FFFFFF;
            border: 2px solid var(--bg-card);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color var(--transition-fast), transform var(--transition-fast);
          }

          .avatar-edit-badge-custom:hover {
            background: var(--primary-dark);
            transform: scale(1.1);
          }

          .user-name-custom {
            font-size: 1.125rem;
            font-weight: 700;
            color: var(--text-primary);
            margin: 0;
            letter-spacing: -0.015em;
          }

          .user-email-custom {
            font-size: 0.8125rem;
            color: var(--text-secondary);
            display: block;
            margin-top: 4px;
          }

          .btn-profile-edit {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            font-size: 0.75rem;
            padding: 8px 16px;
            height: 34px;
            background: var(--bg-card);
            color: var(--text-primary);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            font-weight: 600;
            transition: background-color var(--transition-fast), border-color var(--transition-fast);
            cursor: pointer;
            margin-top: 12px;
          }

          .btn-profile-edit:hover {
            background: var(--bg-secondary);
            border-color: var(--text-secondary);
          }

          .pro-badge-custom {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            background: var(--primary-light);
            color: var(--primary);
            font-weight: 700;
            border-radius: var(--radius-full);
            font-size: 0.75rem;
            border: 1px solid rgba(61, 130, 121, 0.12);
            cursor: pointer;
            transition: transform var(--transition-fast), background-color var(--transition-fast);
          }

          .pro-badge-custom:hover {
            transform: translateY(-1px);
            background: rgba(61, 130, 121, 0.18);
          }

          /* Settings Section Headers */
          .settings-section-title-custom {
            font-size: 0.75rem;
            font-weight: 700;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin: 24px 0 8px 4px;
          }

          /* Settings Cards */
          .settings-card-custom {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-sm);
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }

          /* Preference / Settings list items */
          .settings-item-custom {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            border-bottom: 1px solid var(--border-light);
            transition: background-color var(--transition-fast);
          }

          .settings-item-custom:last-child {
            border-bottom: none;
          }

          .settings-item-custom.clickable {
            cursor: pointer;
          }

          .settings-item-custom.clickable:hover {
            background-color: var(--bg-hover);
          }

          .settings-item-custom.clickable:hover .chevron-icon-custom {
            transform: translateX(3px);
          }

          .settings-item-left {
            display: flex;
            align-items: center;
            gap: 14px;
            flex: 1;
            min-width: 0;
          }

          .settings-item-icon-wrapper-custom {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: var(--bg-secondary);
            color: var(--text-secondary);
            flex-shrink: 0;
            transition: background-color var(--transition-fast), color var(--transition-fast);
          }

          .settings-item-custom.clickable:hover .settings-item-icon-wrapper-custom {
            background: var(--border);
            color: var(--text-primary);
          }

          .settings-item-text-custom {
            display: flex;
            flex-direction: column;
            min-width: 0;
          }

          .settings-item-title-custom {
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--text-primary);
            line-height: 1.3;
          }

          .settings-item-subtitle-custom {
            font-size: 0.75rem;
            color: var(--text-secondary);
            margin-top: 2px;
            line-height: 1.3;
          }

          .chevron-icon-custom {
            width: 16px;
            height: 16px;
            color: var(--text-tertiary);
            transition: transform var(--transition-fast), color var(--transition-fast);
            flex-shrink: 0;
          }

          .settings-item-custom.clickable:hover .chevron-icon-custom {
            color: var(--text-secondary);
          }

          /* Active Badge styled beautifully */
          .active-badge-custom {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-size: 0.75rem;
            font-weight: 700;
            color: var(--primary);
            background: var(--primary-light);
            padding: 4px 10px;
            border-radius: var(--radius-full);
            border: 1px solid rgba(61, 130, 121, 0.12);
            flex-shrink: 0;
          }

          .active-dot-custom {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: var(--primary);
            animation: pulseDotCustom 2s infinite;
          }

          @keyframes pulseDotCustom {
            0% { transform: scale(0.9); opacity: 0.6; }
            50% { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(0.9); opacity: 0.6; }
          }

          /* Custom select dropdown */
          .select-container-custom {
            position: relative;
            display: inline-block;
            width: 156px;
            flex-shrink: 0;
          }

          .select-custom {
            width: 100%;
            font-size: 0.75rem;
            font-weight: 600;
            padding: 6px 28px 6px 10px;
            height: 34px;
            border-radius: var(--radius-md);
            border: 1px solid var(--border);
            background-color: var(--bg-card);
            color: var(--text-primary);
            cursor: pointer;
            appearance: none;
            -webkit-appearance: none;
            transition: border-color var(--transition-fast), background-color var(--transition-fast);
          }

          .select-custom:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 2px var(--primary-glow);
          }

          .select-container-custom::after {
            content: '';
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            border-left: 4px solid transparent;
            border-right: 4px solid transparent;
            border-top: 4px solid var(--text-secondary);
            pointer-events: none;
          }

          /* Reset option danger style */
          .settings-item-danger-custom {
            color: var(--red) !important;
          }

          .settings-item-danger-custom .settings-item-icon-wrapper-custom {
            background: var(--red-light) !important;
            color: var(--red) !important;
          }

          .settings-item-custom.clickable:hover .settings-item-danger-custom-icon-hover {
            background: rgba(194, 89, 83, 0.18) !important;
          }

          .settings-item-danger-custom .settings-item-title-custom {
            color: var(--red) !important;
          }

          .settings-item-danger-custom .settings-item-subtitle-custom {
            color: var(--red) !important;
            opacity: 0.9;
          }

          .settings-item-danger-custom .chevron-icon-custom {
            color: var(--red) !important;
          }
        </style>

        <div class="profile-view">
          <div class="page-header mt-sm mb-lg">
            <h2 class="page-title text-2xl font-bold">Profile</h2>
            <p class="page-subtitle text-xs text-secondary">Manage settings & preferences</p>
          </div>

          <!-- User Profile Card -->
          <div class="profile-card-custom">
            <div class="avatar-container-custom">
              <img class="avatar-img-custom" src="${user.avatarUrl}" alt="${user.name}">
              <button class="avatar-edit-badge-custom" id="btn-edit-avatar">
                <i data-lucide="edit-2" style="width: 12px; height: 12px;"></i>
              </button>
            </div>
            <div>
              <h3 class="user-name-custom" id="user-display-name">${user.name}</h3>
              <span class="user-email-custom">${user.email}</span>
              <div>
                <button class="btn-profile-edit" id="btn-edit-profile-text">
                  <i data-lucide="edit" style="width: 12px; height: 12px; color: var(--primary);"></i> Edit Profile Details
                </button>
              </div>
            </div>
            <div class="flex flex-center">
              <span class="pro-badge-custom" onclick="SavvySpend.navigate('#/journey')">
                <i data-lucide="trophy" style="width: 12px; height: 12px;"></i>
                Level ${game.level} Pro Member
              </span>
            </div>
          </div>

          <!-- Preferences Section -->
          <div class="mb-lg">
            <h4 class="settings-section-title-custom">Preferences</h4>
            <div class="settings-card-custom">
              
              <!-- Personal Details Menu Item -->
              <div class="settings-item-custom clickable" id="item-edit-profile">
                <div class="settings-item-left">
                  <div class="settings-item-icon-wrapper-custom">
                    <i data-lucide="user"></i>
                  </div>
                  <div class="settings-item-text-custom">
                    <span class="settings-item-title-custom">Personal Details</span>
                    <span class="settings-item-subtitle-custom">Change name, email, and avatar theme</span>
                  </div>
                </div>
                <i data-lucide="chevron-right" class="chevron-icon-custom"></i>
              </div>

              <!-- Custom Categories Menu Item -->
              <div class="settings-item-custom clickable" id="item-custom-categories" onclick="SavvySpend.navigate('#/profile/categories')">
                <div class="settings-item-left">
                  <div class="settings-item-icon-wrapper-custom">
                    <i data-lucide="tag"></i>
                  </div>
                  <div class="settings-item-text-custom">
                    <span class="settings-item-title-custom">Custom Categories</span>
                    <span class="settings-item-subtitle-custom">Manage your personal spending categories</span>
                  </div>
                </div>
                <i data-lucide="chevron-right" class="chevron-icon-custom"></i>
              </div>

              <!-- Future Self Notes Menu Item -->
              <div class="settings-item-custom clickable" id="item-future-notes" onclick="SavvySpend.navigate('#/profile/notes')">
                <div class="settings-item-left">
                  <div class="settings-item-icon-wrapper-custom">
                    <i data-lucide="sticky-note"></i>
                  </div>
                  <div class="settings-item-text-custom">
                    <span class="settings-item-title-custom">Future Self Notes</span>
                    <span class="settings-item-subtitle-custom">Set reminders that warn you when spending</span>
                  </div>
                </div>
                <i data-lucide="chevron-right" class="chevron-icon-custom"></i>
              </div>

              <!-- Business Mode toggle -->
              <div class="settings-item-custom">
                <div class="settings-item-left">
                  <div class="settings-item-icon-wrapper-custom">
                    <i data-lucide="briefcase"></i>
                  </div>
                  <div class="settings-item-text-custom">
                    <span class="settings-item-title-custom">Business Mode</span>
                    <span class="settings-item-subtitle-custom">Enable invoicing, client directory & tax estimates</span>
                  </div>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" id="pref-businessmode" class="toggle-input" ${settings.businessModeEnabled ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <!-- Business Hub Menu Item -->
              <div class="settings-item-custom clickable" id="item-business-hub" style="display: ${settings.businessModeEnabled ? 'flex' : 'none'};" onclick="SavvySpend.navigate('#/business')">
                <div class="settings-item-left">
                  <div class="settings-item-icon-wrapper-custom" style="background: var(--orange-light); color: var(--orange);">
                    <i data-lucide="line-chart"></i>
                  </div>
                  <div class="settings-item-text-custom">
                    <span class="settings-item-title-custom">Business Hub</span>
                    <span class="settings-item-subtitle-custom">Track P&L, invoices, clients, and taxes</span>
                  </div>
                </div>
                <i data-lucide="chevron-right" class="chevron-icon-custom"></i>
              </div>

              <!-- Currency selector -->
              <div class="settings-item-custom">
                <div class="settings-item-left">
                  <div class="settings-item-icon-wrapper-custom">
                    <i data-lucide="credit-card"></i>
                  </div>
                  <div class="settings-item-text-custom">
                    <span class="settings-item-title-custom">Currency</span>
                    <span class="settings-item-subtitle-custom">Default display currency</span>
                  </div>
                </div>
                <div class="select-container-custom">
                  <select class="select-custom" id="pref-currency">
                    ${currencyOptions}
                  </select>
                </div>
              </div>

              <!-- Dark mode toggle -->
              <div class="settings-item-custom">
                <div class="settings-item-left">
                  <div class="settings-item-icon-wrapper-custom">
                    <i data-lucide="moon"></i>
                  </div>
                  <div class="settings-item-text-custom">
                    <span class="settings-item-title-custom">Dark Mode</span>
                    <span class="settings-item-subtitle-custom">Switch color theme</span>
                  </div>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" id="pref-darkmode" class="toggle-input" ${settings.darkMode ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <!-- Notifications toggle -->
              <div class="settings-item-custom">
                <div class="settings-item-left">
                  <div class="settings-item-icon-wrapper-custom">
                    <i data-lucide="bell"></i>
                  </div>
                  <div class="settings-item-text-custom">
                    <span class="settings-item-title-custom">Push Alerts</span>
                    <span class="settings-item-subtitle-custom">Budget threshold reminders</span>
                  </div>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" id="pref-push" class="toggle-input" ${settings.notifications.push ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
              </div>

            </div>
          </div>

          <!-- Security Section -->
          <div class="mb-lg">
            <h4 class="settings-section-title-custom">Security & Privacy</h4>
            <div class="settings-card-custom">
              
              <div class="settings-item-custom">
                <div class="settings-item-left">
                  <div class="settings-item-icon-wrapper-custom">
                    <i data-lucide="shield"></i>
                  </div>
                  <div class="settings-item-text-custom">
                    <span class="settings-item-title-custom">Secure Storage</span>
                    <span class="settings-item-subtitle-custom">Crypto AES-256 local encryption</span>
                  </div>
                </div>
                <span class="active-badge-custom"><span class="active-dot-custom"></span><i data-lucide="lock" style="width: 12px; height: 12px; margin-right: 2px;"></i> Active</span>
              </div>

              <!-- Face ID toggle for iPhone 12 -->
              <div class="settings-item-custom">
                <div class="settings-item-left">
                  <div class="settings-item-icon-wrapper-custom">
                    <i data-lucide="scan"></i>
                  </div>
                  <div class="settings-item-text-custom">
                    <span class="settings-item-title-custom">Face ID Lock</span>
                    <span class="settings-item-subtitle-custom">Require Face ID to log in</span>
                  </div>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" id="pref-faceid" class="toggle-input" ${localStorage.getItem('ss_bio_enabled') === 'true' ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <div class="settings-item-custom clickable" id="item-change-pass">
                <div class="settings-item-left">
                  <div class="settings-item-icon-wrapper-custom">
                    <i data-lucide="lock"></i>
                  </div>
                  <div class="settings-item-text-custom">
                    <span class="settings-item-title-custom">Change Password</span>
                    <span class="settings-item-subtitle-custom">Update your login password</span>
                  </div>
                </div>
                <i data-lucide="chevron-right" class="chevron-icon-custom"></i>
              </div>

              <div class="settings-item-custom clickable" id="item-view-recovery">
                <div class="settings-item-left">
                  <div class="settings-item-icon-wrapper-custom">
                    <i data-lucide="key"></i>
                  </div>
                  <div class="settings-item-text-custom">
                    <span class="settings-item-title-custom">View Recovery Key</span>
                    <span class="settings-item-subtitle-custom">Show my private backup recovery key</span>
                  </div>
                </div>
                <i data-lucide="chevron-right" class="chevron-icon-custom"></i>
              </div>

              <div class="settings-item-custom clickable" id="item-lock-vault">
                <div class="settings-item-left">
                  <div class="settings-item-icon-wrapper-custom">
                    <i data-lucide="lock"></i>
                    <span class="settings-item-title-custom" style="display:none;"></span>
                  </div>
                  <div class="settings-item-text-custom">
                    <span class="settings-item-title-custom">Log Out</span>
                    <span class="settings-item-subtitle-custom">Lock app and return to login</span>
                  </div>
                </div>
                <i data-lucide="chevron-right" class="chevron-icon-custom"></i>
              </div>

            </div>
          </div>

          <!-- Data & System Section -->
          <div class="mb-xl">
            <h4 class="settings-section-title-custom">App Tools</h4>
            <div class="settings-card-custom">
              
              <!-- CSV Download -->
              <div class="settings-item-custom clickable" id="item-export-csv">
                <div class="settings-item-left">
                  <div class="settings-item-icon-wrapper-custom">
                    <i data-lucide="download"></i>
                  </div>
                  <div class="settings-item-text-custom">
                    <span class="settings-item-title-custom">Backup Transactions</span>
                    <span class="settings-item-subtitle-custom">Download raw data as CSV</span>
                  </div>
                </div>
                <i data-lucide="chevron-right" class="chevron-icon-custom"></i>
              </div>

              <!-- Gamification link -->
              <div class="settings-item-custom clickable" onclick="SavvySpend.navigate('#/journey')">
                <div class="settings-item-left">
                  <div class="settings-item-icon-wrapper-custom">
                    <i data-lucide="trophy"></i>
                  </div>
                  <div class="settings-item-text-custom">
                    <span class="settings-item-title-custom">Gamified Journey</span>
                    <span class="settings-item-subtitle-custom">Streaks, Badges and XP info</span>
                  </div>
                </div>
                <i data-lucide="chevron-right" class="chevron-icon-custom"></i>
              </div>

              <!-- Clear/Reset Data -->
              <div class="settings-item-custom clickable settings-item-danger-custom" id="item-reset-all">
                <div class="settings-item-left">
                  <div class="settings-item-icon-wrapper-custom settings-item-danger-custom-icon-hover">
                    <i data-lucide="log-out"></i>
                  </div>
                  <div class="settings-item-text-custom">
                    <span class="settings-item-title-custom">Reset App Data</span>
                    <span class="settings-item-subtitle-custom">Erase all encrypted local storage</span>
                  </div>
                </div>
                <i data-lucide="chevron-right" class="chevron-icon-custom"></i>
              </div>

            </div>
          </div>

          <div class="text-center text-secondary text-xxs mb-md" style="font-size: 0.7rem; opacity: 0.6;">
            SavvySpend v1.0.0 • Crafted for Young Adults
          </div>
        </div>
      `;
    },

    afterRender: function (param) {
      if (param === 'categories') {
        // Create Category button
        var btnCreateCat = document.getElementById('btn-create-category');
        if (btnCreateCat) {
          btnCreateCat.addEventListener('click', function () {
            if (SavvySpend.components.Modals && SavvySpend.components.Modals.addCustomCategory) {
              SavvySpend.components.Modals.addCustomCategory();
            }
          });
        }

        // Edit Category buttons
        var editCatBtns = document.querySelectorAll('.btn-edit-category');
        editCatBtns.forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-id');
            if (SavvySpend.components.Modals && SavvySpend.components.Modals.addCustomCategory) {
              SavvySpend.components.Modals.addCustomCategory(id);
            }
          });
        });

        // Delete Category buttons
        var deleteCatBtns = document.querySelectorAll('.btn-delete-category');
        deleteCatBtns.forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this custom category? All transactions in this category will be mapped to "Other", and any associated budgets will be deleted.')) {
              DataStore.deleteCustomCategory(id);
              SavvySpend.showToast('Category deleted.', 'info');
              SavvySpend.handleRoute();
            }
          });
        });

        return; // Skip default profile bindings
      }

      if (param === 'notes') {
        // Create Note button
        var btnCreateNote = document.getElementById('btn-create-note');
        if (btnCreateNote) {
          btnCreateNote.addEventListener('click', function () {
            if (SavvySpend.components.Modals && SavvySpend.components.Modals.addFutureNote) {
              SavvySpend.components.Modals.addFutureNote();
            }
          });
        }

        // Edit Note buttons
        var editNoteBtns = document.querySelectorAll('.btn-edit-note');
        editNoteBtns.forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-id');
            if (SavvySpend.components.Modals && SavvySpend.components.Modals.addFutureNote) {
              SavvySpend.components.Modals.addFutureNote(id);
            }
          });
        });

        // Delete Note buttons
        var deleteNoteBtns = document.querySelectorAll('.btn-delete-note');
        deleteNoteBtns.forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this Future Self Note?')) {
              DataStore.deleteFutureNote(id);
              SavvySpend.showToast('Note deleted.', 'info');
              SavvySpend.handleRoute();
            }
          });
        });

        // Note status toggle
        var noteToggleBtns = document.querySelectorAll('.toggle-note-status');
        noteToggleBtns.forEach(function (toggle) {
          toggle.addEventListener('change', function (e) {
            var id = toggle.getAttribute('data-id');
            var isActive = e.target.checked;
            DataStore.updateFutureNote(id, { isActive: isActive });
            SavvySpend.showToast(isActive ? 'Note enabled.' : 'Note disabled.', 'success');
            SavvySpend.handleRoute();
          });
        });

        return; // Skip default profile bindings
      }

      // 1. Currency selector change
      var curSelect = document.getElementById('pref-currency');
      if (curSelect) {
        curSelect.addEventListener('change', function (e) {
          var val = e.target.value;
          DataStore.updateSettings({ currency: val });
          SavvySpend.showToast('Display currency updated to ' + val, 'success');
          // Re-render
          SavvySpend.handleRoute();
        });
      }

      // 2. Dark mode toggle switch
      var darkToggle = document.getElementById('pref-darkmode');
      if (darkToggle) {
        darkToggle.addEventListener('change', function (e) {
          var isDark = e.target.checked;
          if (isDark) {
            document.body.classList.add('dark');
          } else {
            document.body.classList.remove('dark');
          }
          DataStore.updateSettings({ darkMode: isDark });
          SavvySpend.showToast('Theme updated!', 'success');
        });
      }

      // 3. Push notifications toggle
      var pushToggle = document.getElementById('pref-push');
      if (pushToggle) {
        pushToggle.addEventListener('change', function (e) {
          var isPush = e.target.checked;
          DataStore.updateSettings({ notifications: { push: isPush } });
          SavvySpend.showToast('Notification preferences saved.', 'success');
        });
      }

      // 3b. Business Mode toggle listener
      var bizModeToggle = document.getElementById('pref-businessmode');
      if (bizModeToggle) {
        bizModeToggle.addEventListener('change', function (e) {
          var isBiz = e.target.checked;
          DataStore.updateSettings({ businessModeEnabled: isBiz });
          SavvySpend.showToast(isBiz ? 'Business Mode enabled! Hub unlocked.' : 'Business Mode disabled.', 'success');
          SavvySpend.handleRoute();
        });
      }

      // 4. Edit User Name/Avatar click
      var editAvatarBtn = document.getElementById('btn-edit-avatar');
      if (editAvatarBtn) {
        editAvatarBtn.addEventListener('click', function () {
          if (SavvySpend.components.Modals && SavvySpend.components.Modals.editProfile) {
            SavvySpend.components.Modals.editProfile();
          }
        });
      }

      var editProfileTextBtn = document.getElementById('btn-edit-profile-text');
      if (editProfileTextBtn) {
        editProfileTextBtn.addEventListener('click', function () {
          if (SavvySpend.components.Modals && SavvySpend.components.Modals.editProfile) {
            SavvySpend.components.Modals.editProfile();
          }
        });
      }

      var editProfileItem = document.getElementById('item-edit-profile');
      if (editProfileItem) {
        editProfileItem.addEventListener('click', function () {
          if (SavvySpend.components.Modals && SavvySpend.components.Modals.editProfile) {
            SavvySpend.components.Modals.editProfile();
          }
        });
      }

      // 5. Change Password
      var passItem = document.getElementById('item-change-pass');
      if (passItem) {
        passItem.addEventListener('click', function () {
          var oldPass = prompt('Enter your current password:');
          if (!oldPass) return;

          // Verify old pass
          SecureStorage.setKey(oldPass);
          var testUser = DataStore.getUser();
          if (!testUser) {
            SecureStorage.setKey('SavvySpend_dummy_key_reset');
            alert('Incorrect password.');
            return;
          }

          var pass = prompt('Enter your new password:', '');
          if (pass && pass.trim()) {
            var newPass = pass.trim();

            // Decrypt Recovery Key using oldPass
            var wrappedRec = localStorage.getItem('ss_recovery_key_wrapped_user');
            var recoveryKey = '';
            if (wrappedRec) {
              try {
                var bytes = CryptoJS.AES.decrypt(wrappedRec, oldPass);
                recoveryKey = bytes.toString(CryptoJS.enc.Utf8);
              } catch (e) {}
            }
            if (!recoveryKey) {
              var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
              var part1 = ''; var part2 = ''; var part3 = '';
              for (var i = 0; i < 4; i++) {
                part1 += chars.charAt(Math.floor(Math.random() * chars.length));
                part2 += chars.charAt(Math.floor(Math.random() * chars.length));
                part3 += chars.charAt(Math.floor(Math.random() * chars.length));
              }
              recoveryKey = 'SAVVY-' + part1 + '-' + part2 + '-' + part3;
            }

            // Read all existing data under the old key (which is validated)
            var txs = DataStore.getTransactions();
            var budgets = DataStore.getBudgets();
            var goals = DataStore.getGoals();
            var user = DataStore.getUser();
            var game = DataStore.getGameState();
            var settings = DataStore.getSettings();

            // Set new key in storage
            SecureStorage.setKey(newPass);

            // Re-encrypt and write all data back under the new key
            SecureStorage.set('ss_transactions', txs);
            SecureStorage.set('ss_budgets', budgets);
            SecureStorage.set('ss_goals', goals);
            SecureStorage.set('ss_user', user);
            SecureStorage.set('ss_game', game);
            SecureStorage.set('ss_settings', settings);

            // Re-wrap recovery files using newPass
            var wrappedPass = CryptoJS.AES.encrypt(newPass, recoveryKey).toString();
            var wrappedRecNew = CryptoJS.AES.encrypt(recoveryKey, newPass).toString();
            localStorage.setItem('ss_recovery_wrapped_pass', wrappedPass);
            localStorage.setItem('ss_recovery_key_wrapped_user', wrappedRecNew);

            // Re-wrap biometric key if Face ID is enabled
            if (localStorage.getItem('ss_bio_enabled') === 'true') {
              var deviceSalt = localStorage.getItem('ss_device_salt') || 'SavvySpend_Device_Salt';
              var wrappedBioNew = CryptoJS.AES.encrypt(newPass, deviceSalt).toString();
              localStorage.setItem('ss_bio_passphrase_wrapped', wrappedBioNew);
            }

            SavvySpend.showToast('Password updated successfully!', 'success');
            SavvySpend.handleRoute();
          }
        });
      }

      // 5a. Face ID toggle switch
      var faceidToggle = document.getElementById('pref-faceid');
      if (faceidToggle) {
        faceidToggle.addEventListener('change', function (e) {
          var isEnabled = e.target.checked;
          if (isEnabled) {
            var activePass = prompt('Enter your password to enable Face ID:');
            if (!activePass) {
              faceidToggle.checked = false;
              return;
            }
            
            SecureStorage.setKey(activePass);
            var testUser = DataStore.getUser();
            if (!testUser) {
              SecureStorage.setKey('SavvySpend_dummy_key_reset');
              alert('Incorrect password. Face ID setup cancelled.');
              faceidToggle.checked = false;
              return;
            }
            
            SecureStorage.setKey(activePass); // restore active key
            
            var deviceSalt = localStorage.getItem('ss_device_salt') || SavvySpend.generateId();
            localStorage.setItem('ss_device_salt', deviceSalt);
            
            var wrappedPass = CryptoJS.AES.encrypt(activePass, deviceSalt).toString();
            
            // Perform native WebAuthn platform authenticator registration
            if (window.isSecureContext && window.PublicKeyCredential) {
              var challenge = new Uint8Array(32);
              window.crypto.getRandomValues(challenge);
              
              var createOptions = {
                publicKey: {
                  challenge: challenge,
                  rp: { name: "SavvySpend" },
                  user: {
                    id: new Uint8Array(16),
                    name: testUser.email || "nana@gmail.com",
                    displayName: testUser.name || "nana"
                  },
                  pubKeyCredParams: [{ type: "public-key", alg: -7 }],
                  authenticatorSelection: {
                    authenticatorAttachment: "platform",
                    userVerification: "required"
                  },
                  timeout: 60000
                }
              };

              navigator.credentials.create(createOptions).then(function (newCredential) {
                var credIdBase64 = btoa(String.fromCharCode.apply(null, new Uint8Array(newCredential.rawId)));
                localStorage.setItem('ss_bio_credential_id', credIdBase64);
                localStorage.setItem('ss_bio_enabled', 'true');
                localStorage.setItem('ss_bio_passphrase_wrapped', wrappedPass);
                DataStore.updateSettings({ biometricLock: true });
                SavvySpend.showToast('Face ID Lock enabled natively!', 'success');
              }).catch(function (err) {
                console.warn('WebAuthn failed, using simulation overlay', err);
                if (SavvySpend.components.Modals && SavvySpend.components.Modals.showFaceIDScan) {
                  SavvySpend.components.Modals.showFaceIDScan(function () {
                    localStorage.setItem('ss_bio_enabled', 'true');
                    localStorage.setItem('ss_bio_passphrase_wrapped', wrappedPass);
                    DataStore.updateSettings({ biometricLock: true });
                    SavvySpend.showToast('Face ID Lock enabled (simulated)!', 'success');
                  });
                } else {
                  localStorage.setItem('ss_bio_enabled', 'true');
                  localStorage.setItem('ss_bio_passphrase_wrapped', wrappedPass);
                  DataStore.updateSettings({ biometricLock: true });
                  SavvySpend.showToast('Face ID Lock enabled!', 'success');
                }
              });
            } else {
              if (SavvySpend.components.Modals && SavvySpend.components.Modals.showFaceIDScan) {
                SavvySpend.components.Modals.showFaceIDScan(function () {
                  localStorage.setItem('ss_bio_enabled', 'true');
                  localStorage.setItem('ss_bio_passphrase_wrapped', wrappedPass);
                  DataStore.updateSettings({ biometricLock: true });
                  SavvySpend.showToast('Face ID Lock enabled (simulated)!', 'success');
                });
              } else {
                localStorage.setItem('ss_bio_enabled', 'true');
                localStorage.setItem('ss_bio_passphrase_wrapped', wrappedPass);
                DataStore.updateSettings({ biometricLock: true });
                SavvySpend.showToast('Face ID Lock enabled!', 'success');
              }
            }
          } else {
            localStorage.removeItem('ss_bio_enabled');
            localStorage.removeItem('ss_bio_passphrase_wrapped');
            localStorage.removeItem('ss_bio_credential_id');
            DataStore.updateSettings({ biometricLock: false });
            SavvySpend.showToast('Face ID Lock disabled.', 'info');
          }
        });
      }

      // 5b. View Recovery Key click
      var viewRecItem = document.getElementById('item-view-recovery');
      if (viewRecItem) {
        viewRecItem.addEventListener('click', function () {
          var pass = prompt('Enter your password to view your Recovery Key:');
          if (!pass) return;

          SecureStorage.setKey(pass);
          var testUser = DataStore.getUser();
          if (!testUser) {
            SecureStorage.setKey('SavvySpend_dummy_key_reset');
            alert('Incorrect password.');
            return;
          }

          var wrappedRec = localStorage.getItem('ss_recovery_key_wrapped_user');
          var recoveryKey = '';
          if (wrappedRec) {
            try {
              var bytes = CryptoJS.AES.decrypt(wrappedRec, pass);
              recoveryKey = bytes.toString(CryptoJS.enc.Utf8);
            } catch (e) {}
          }

          if (!recoveryKey) {
            var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            var part1 = ''; var part2 = ''; var part3 = '';
            for (var i = 0; i < 4; i++) {
              part1 += chars.charAt(Math.floor(Math.random() * chars.length));
              part2 += chars.charAt(Math.floor(Math.random() * chars.length));
              part3 += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            recoveryKey = 'SAVVY-' + part1 + '-' + part2 + '-' + part3;

            var wrappedPass = CryptoJS.AES.encrypt(pass, recoveryKey).toString();
            var newWrappedRec = CryptoJS.AES.encrypt(recoveryKey, pass).toString();
            localStorage.setItem('ss_recovery_wrapped_pass', wrappedPass);
            localStorage.setItem('ss_recovery_key_wrapped_user', newWrappedRec);
          }

          var html = `
            <div class="modal-header flex flex-between">
              <h3 class="modal-title">Your Recovery Key</h3>
              <button class="btn-icon" onclick="SavvySpend.closeModal()"><i data-lucide="x"></i></button>
            </div>
            <div class="mt-md text-center">
              <p class="text-xs text-secondary mb-md" style="line-height: 1.4;">
                This is your unique 16-character backup key. You can use it to reset your password if you ever forget it. Keep it private.
              </p>
              <div class="card p-md bg-secondary" style="border: 1px solid var(--border); border-radius: var(--radius-md); margin-bottom: 16px;">
                <span class="text-md font-mono font-bold text-primary select-all" id="profile-recovery-key-text" style="letter-spacing: 0.5px; font-size: 1.1rem; color: var(--primary);">${recoveryKey}</span>
              </div>
              <div class="flex gap-md">
                <button type="button" class="btn btn-outline w-full" id="btn-copy-profile-rec">Copy Key</button>
                <button type="button" class="btn btn-primary w-full" onclick="SavvySpend.closeModal()">Close</button>
              </div>
            </div>
          `;
          SavvySpend.showModal(html);

          var btnCopyProfile = document.getElementById('btn-copy-profile-rec');
          if (btnCopyProfile) {
            btnCopyProfile.addEventListener('click', function () {
              navigator.clipboard.writeText(recoveryKey).then(function () {
                SavvySpend.showToast('Copied to clipboard!', 'success');
              }).catch(function () {
                alert('Recovery Key: ' + recoveryKey);
              });
            });
          }
        });
      }

      // 5b. Log Out click
      var lockVaultItem = document.getElementById('item-lock-vault');
      if (lockVaultItem) {
        lockVaultItem.addEventListener('click', function () {
          // Lock by setting dummy invalid encryption key and navigating to login
          SecureStorage.setKey('SavvySpend_dummy_key_reset');
          if (SavvySpend.components.Notifications) {
            SavvySpend.components.Notifications.show('Logged out.', 'info');
          }
          setTimeout(function () {
            window.location.hash = '#/welcome';
            window.location.reload();
          }, 300);
        });
      }

      // 6. CSV Backup click
      var csvExportItem = document.getElementById('item-export-csv');
      if (csvExportItem) {
        csvExportItem.addEventListener('click', function () {
          try {
            var csvContent = DataStore.exportToCSV();
            var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            var url = URL.createObjectURL(blob);
            var link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', 'SavvySpend_Backup_' + new Date().toISOString().split('T')[0] + '.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            SavvySpend.showToast('Backup download started!', 'success');
          } catch (e) {
            console.error(e);
            SavvySpend.showToast('Failed to generate CSV backup.', 'error');
          }
        });
      }

      // 7. Reset all app data
      var resetItem = document.getElementById('item-reset-all');
      if (resetItem) {
        resetItem.addEventListener('click', function () {
          if (confirm('CAUTION: This will permanently delete all your transactions, budgets, goals, profile information, and game progress from this device. Are you sure?')) {
            SecureStorage.clear();
            localStorage.clear();
            sessionStorage.clear();
            SecureStorage.setKey('SavvySpend_2024_Key');
            alert('All application data has been wiped. The app will now reload.');
            window.location.hash = '#/welcome';
            window.location.reload();
          }
        });
      }
    },

    destroy: function () {
      // Cleanup
    }
  };

  window.SavvySpend.pages.Profile = Profile;
})();
