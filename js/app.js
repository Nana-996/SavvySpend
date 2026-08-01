(function () {
  'use strict';

  window.SavvySpend = window.SavvySpend || {};
  const App = window.SavvySpend;

  const STORAGE_KEYS = {
    entries: 'savvyspend_entries_v2',
    profile: 'savvyspend_profile_v2'
  };

  App.state = App.state || {
    entries: [],
    profile: { name: '', defaultLocation: 'wallet' },
    currentRoute: 'home',
    formMode: 'savings'
  };

  function parseAmount(value) {
    const parsed = Number(String(value).replace(/,/g, '').trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function formatCurrency(value) {
    const amount = Number(value) || 0;
    return `GHS ${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function loadState() {
    const savedEntries = SecureStorage.get(STORAGE_KEYS.entries);
    const savedProfile = SecureStorage.get(STORAGE_KEYS.profile);

    App.state.entries = Array.isArray(savedEntries) ? savedEntries : [];
    App.state.profile = {
      name: '',
      defaultLocation: 'wallet',
      ...(savedProfile || {})
    };
  }

  function saveState() {
    SecureStorage.set(STORAGE_KEYS.entries, App.state.entries);
    SecureStorage.set(STORAGE_KEYS.profile, App.state.profile);
  }

  function getLocationLabel(key) {
    const labels = {
      wallet: 'Pocket',
      mobile_money: 'Mobile money',
      bank: 'Bank',
      savings_box: 'Savings box',
      other: 'Other'
    };
    return labels[key] || 'Other';
  }

  function getLocationAccent(key) {
    const accents = {
      wallet: 'accent-teal',
      mobile_money: 'accent-purple',
      bank: 'accent-blue',
      savings_box: 'accent-gold',
      other: 'accent-rose'
    };
    return accents[key] || 'accent-rose';
  }

  function getTotals() {
    let totalSaved = 0;
    let totalBusinessProfit = 0;
    const locationTotals = {
      wallet: 0,
      mobile_money: 0,
      bank: 0,
      savings_box: 0,
      other: 0
    };

    App.state.entries.forEach((entry) => {
      if (entry.type === 'savings') {
        totalSaved += parseAmount(entry.amount);
        locationTotals[entry.location] += parseAmount(entry.amount);
      }

      if (entry.type === 'business') {
        const kept = parseAmount(entry.amountReceived) - parseAmount(entry.amountSpent);
        totalSaved += kept;
        totalBusinessProfit += kept;
        locationTotals[entry.location] += kept;
      }
    });

    return { totalSaved, totalBusinessProfit, locationTotals };
  }

  function getSummaryWindow(days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return App.state.entries.filter((entry) => new Date(entry.createdAt) >= cutoff);
  }

  function getSummaryStats() {
    const today = getSummaryWindow(1);
    const week = getSummaryWindow(7);

    const todaySaved = today.reduce((sum, entry) => {
      if (entry.type === 'savings') return sum + parseAmount(entry.amount);
      if (entry.type === 'business') return sum + (parseAmount(entry.amountReceived) - parseAmount(entry.amountSpent));
      return sum;
    }, 0);

    const weekSaved = week.reduce((sum, entry) => {
      if (entry.type === 'savings') return sum + parseAmount(entry.amount);
      if (entry.type === 'business') return sum + (parseAmount(entry.amountReceived) - parseAmount(entry.amountSpent));
      return sum;
    }, 0);

    return { todaySaved, weekSaved };
  }

  function getSortedEntries() {
    return [...App.state.entries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function renderNav() {
    const nav = document.getElementById('bottom-navbar');
    if (!nav) return;

    nav.innerHTML = `
      <button class="nav-btn ${App.state.currentRoute === 'home' ? 'active' : ''}" data-route="home">
        <span>⌂</span>
        <span>Home</span>
      </button>
      <button class="nav-btn ${App.state.currentRoute === 'new' ? 'active' : ''}" data-route="new">
        <span>+</span>
        <span>Log</span>
      </button>
      <button class="nav-btn ${App.state.currentRoute === 'history' ? 'active' : ''}" data-route="history">
        <span>☰</span>
        <span>History</span>
      </button>
    `;
  }

  function renderHome() {
    const totals = getTotals();
    const summary = getSummaryStats();
    const locationEntries = Object.entries(totals.locationTotals)
      .filter(([, amount]) => amount > 0)
      .sort((a, b) => b[1] - a[1]);
    const recentEntries = getSortedEntries().slice(0, 4);

    const page = document.getElementById('page-container');
    if (!page) return;

    page.innerHTML = `
      <section class="page">
        <div class="hero-card">
          <div>
            <p class="eyebrow">Your money snapshot</p>
            <h2>See how much you kept and where it sits.</h2>
            <p class="hero-copy">Every savings deposit and business task now has a clear home.</p>
          </div>
          <button class="btn btn-primary" data-route="new">+ New record</button>
        </div>

        <div class="summary-grid">
          <article class="card metric-card">
            <p class="eyebrow">Total kept</p>
            <h3>${formatCurrency(totals.totalSaved)}</h3>
            <span>All savings plus business profit</span>
          </article>
          <article class="card metric-card">
            <p class="eyebrow">Business profit</p>
            <h3>${formatCurrency(totals.totalBusinessProfit)}</h3>
            <span>Received minus what you spent</span>
          </article>
        </div>

        <section class="card">
          <div class="card-title-row">
            <h3>Today and this week</h3>
            <span class="pill">Live summary</span>
          </div>
          <div class="summary-grid small-grid">
            <div class="mini-stat">
              <p class="eyebrow">Today</p>
              <strong>${formatCurrency(summary.todaySaved)}</strong>
            </div>
            <div class="mini-stat">
              <p class="eyebrow">This week</p>
              <strong>${formatCurrency(summary.weekSaved)}</strong>
            </div>
          </div>
        </section>

        <section class="card">
          <div class="card-title-row">
            <h3>Where your money lives</h3>
            <span class="pill">${locationEntries.length ? 'Live breakdown' : 'No entries yet'}</span>
          </div>
          ${locationEntries.length ? `
            <div class="stack">
              ${locationEntries.map(([key, amount]) => `
                <div class="location-row">
                  <div class="location-name">
                    <span class="dot ${getLocationAccent(key)}"></span>
                    <span>${getLocationLabel(key)}</span>
                  </div>
                  <strong>${formatCurrency(amount)}</strong>
                </div>
              `).join('')}
            </div>
          ` : `<div class="empty-state">Start by logging your first savings deposit or business task.</div>`}
        </section>

        <section class="card">
          <div class="card-title-row">
            <h3>Recent activity</h3>
            <button class="text-link" data-route="history">View all</button>
          </div>
          ${recentEntries.length ? `
            <div class="stack">
              ${recentEntries.map((entry) => {
                const kept = entry.type === 'business' ? parseAmount(entry.amountReceived) - parseAmount(entry.amountSpent) : parseAmount(entry.amount);
                return `
                  <div class="entry-item">
                    <div>
                      <p class="entry-title">${escapeHtml(entry.description || 'Untitled entry')}</p>
                      <p class="entry-meta">${entry.type === 'business' ? 'Business task' : 'Savings deposit'} • ${new Date(entry.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div class="entry-right">
                      <strong>${formatCurrency(kept)}</strong>
                      <span class="pill">${getLocationLabel(entry.location)}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `<div class="empty-state">Nothing here yet. Add your first entry to begin tracking.</div>`}
        </section>
      </section>
    `;
  }

  function renderNewEntry() {
    const page = document.getElementById('page-container');
    if (!page) return;

    const mode = App.state.formMode || 'savings';

    page.innerHTML = `
      <section class="page">
        <div class="card">
          <div class="card-title-row">
            <div>
              <p class="eyebrow">New record</p>
              <h3>Log what you saved or what work you completed</h3>
            </div>
          </div>

          <div class="mode-switch" role="tablist" aria-label="Entry type">
            <button type="button" class="mode-btn ${mode === 'savings' ? 'active' : ''}" data-mode="savings">Savings</button>
            <button type="button" class="mode-btn ${mode === 'business' ? 'active' : ''}" data-mode="business">Business</button>
          </div>

          <form id="entry-form" class="stack" novalidate>
            <label class="field-label" for="description">What happened?</label>
            <input id="description" name="description" type="text" placeholder="Saved cash from freelance work" required />

            <div class="field-group ${mode === 'savings' ? '' : 'hidden'}">
              <label class="field-label" for="amount">How much did you save?</label>
              <input id="amount" name="amount" type="number" min="0" step="0.01" placeholder="250" />
            </div>

            <div class="field-group ${mode === 'business' ? '' : 'hidden'}">
              <div class="field-grid">
                <div>
                  <label class="field-label" for="amountReceived">Amount received</label>
                  <input id="amountReceived" name="amountReceived" type="number" min="0" step="0.01" placeholder="500" />
                </div>
                <div>
                  <label class="field-label" for="amountSpent">Amount spent</label>
                  <input id="amountSpent" name="amountSpent" type="number" min="0" step="0.01" placeholder="120" />
                </div>
              </div>
              <div class="field-grid">
                <div>
                  <label class="field-label" for="category">Category</label>
                  <input id="category" name="category" type="text" placeholder="Delivery, repair, design" />
                </div>
                <div>
                  <label class="field-label" for="receiptNote">Receipt note</label>
                  <input id="receiptNote" name="receiptNote" type="text" placeholder="Transport, supply, etc." />
                </div>
              </div>
            </div>

            <label class="field-label" for="location">Where do you want to keep it?</label>
            <select id="location" name="location">
              <option value="wallet">Pocket</option>
              <option value="mobile_money">Mobile money</option>
              <option value="bank">Bank</option>
              <option value="savings_box">Savings box</option>
              <option value="other">Other</option>
            </select>

            <label class="field-label" for="notes">Note</label>
            <textarea id="notes" name="notes" rows="3" placeholder="Optional details about the task or savings"></textarea>

            <button class="btn btn-primary" type="submit">Save record</button>
          </form>
        </div>
      </section>
    `;

    document.querySelectorAll('.mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        App.state.formMode = btn.dataset.mode;
        renderNewEntry();
      });
    });

    const form = document.getElementById('entry-form');
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const payload = new FormData(form);
      const description = String(payload.get('description') || '').trim();
      const location = String(payload.get('location') || App.state.profile.defaultLocation || 'wallet');
      const notes = String(payload.get('notes') || '').trim();

      if (!description) {
        showToast('Add a short description first.');
        return;
      }

      const selectedMode = App.state.formMode || 'savings';

      if (selectedMode === 'savings') {
        const amount = parseAmount(payload.get('amount'));
        if (!amount) {
          showToast('Add a savings amount.');
          return;
        }

        App.state.entries.unshift({
          id: Date.now().toString(),
          type: 'savings',
          description,
          amount,
          location,
          note: notes,
          createdAt: new Date().toISOString()
        });
      } else {
        const amountReceived = parseAmount(payload.get('amountReceived'));
        const amountSpent = parseAmount(payload.get('amountSpent'));
        if (!amountReceived) {
          showToast('Add the money you received.');
          return;
        }

        const category = String(payload.get('category') || '').trim();
        const receiptNote = String(payload.get('receiptNote') || '').trim();

        App.state.entries.unshift({
          id: Date.now().toString(),
          type: 'business',
          description,
          amountReceived,
          amountSpent,
          category,
          receiptNote,
          location,
          note: notes,
          createdAt: new Date().toISOString()
        });
      }

      saveState();
      showToast(selectedMode === 'business' ? 'Business task saved successfully.' : 'Savings record saved successfully.');
      App.state.currentRoute = 'history';
      window.location.hash = '#/history';
    });
  }

  function renderHistory() {
    const page = document.getElementById('page-container');
    if (!page) return;

    const sorted = getSortedEntries();

    page.innerHTML = `
      <section class="page">
        <div class="card">
          <div class="card-title-row">
            <div>
              <p class="eyebrow">History</p>
              <h3>All your savings and business activity</h3>
            </div>
            <button class="btn btn-primary" data-route="new">+ Add</button>
          </div>

          ${sorted.length ? `
            <div class="stack">
              ${sorted.map((entry) => {
                const kept = entry.type === 'business'
                  ? parseAmount(entry.amountReceived) - parseAmount(entry.amountSpent)
                  : parseAmount(entry.amount);
                return `
                  <div class="history-card">
                    <div class="history-card-top">
                      <div>
                        <p class="entry-title">${escapeHtml(entry.description || 'Untitled entry')}</p>
                        <p class="entry-meta">${entry.type === 'business' ? 'Business task' : 'Savings'} • ${new Date(entry.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button class="icon-btn" data-delete="${entry.id}" aria-label="Delete entry">×</button>
                    </div>
                    <div class="history-card-body">
                      <div>
                        <p class="eyebrow">Amount kept</p>
                        <strong>${formatCurrency(kept)}</strong>
                      </div>
                      <div>
                        <p class="eyebrow">Stored at</p>
                        <span class="pill">${getLocationLabel(entry.location)}</span>
                      </div>
                    </div>
                    ${entry.type === 'business' && (entry.category || entry.receiptNote) ? `<div class="stack">
                      ${entry.category ? `<p class="entry-note"><strong>Category:</strong> ${escapeHtml(entry.category)}</p>` : ''}
                      ${entry.receiptNote ? `<p class="entry-note"><strong>Receipt:</strong> ${escapeHtml(entry.receiptNote)}</p>` : ''}
                    </div>` : ''}
                    ${entry.note ? `<p class="entry-note">${escapeHtml(entry.note)}</p>` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          ` : `<div class="empty-state">No entries yet. Your savings story will appear here.</div>`}
        </div>
      </section>
    `;
  }

  function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 250);
    }, 2200);
  }

  function navigate(route) {
    App.state.currentRoute = route;
    window.location.hash = `#/${route}`;
  }

  function handlePageClick(event) {
    const button = event.target.closest('[data-route]');
    if (button) {
      event.preventDefault();
      navigate(button.dataset.route);
      return;
    }

    const deleteButton = event.target.closest('[data-delete]');
    if (deleteButton) {
      const id = deleteButton.dataset.delete;
      App.state.entries = App.state.entries.filter((entry) => entry.id !== id);
      saveState();
      showToast('Entry removed.');
      renderHistory();
    }
  }

  function renderRoute() {
    const hash = window.location.hash || '#/home';
    const route = hash.replace('#/', '').split('/')[0] || 'home';
    App.state.currentRoute = route;
    renderNav();

    if (App.routes[route]) {
      App.routes[route]();
    } else {
      App.state.currentRoute = 'home';
      renderHome();
    }
  }

  App.routes = {
    home: renderHome,
    new: renderNewEntry,
    history: renderHistory
  };

  App.init = function () {
    loadState();
    document.addEventListener('click', handlePageClick);

    window.addEventListener('hashchange', renderRoute);

    if (!window.location.hash || window.location.hash === '#/' || window.location.hash === '#') {
      window.location.hash = '#/home';
    } else {
      renderRoute();
    }
  };

  document.addEventListener('DOMContentLoaded', App.init);
})();