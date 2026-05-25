# SavvySpend Architecture Specification

## Module Patterns

### Pages
```js
(function() {
  window.SavvySpend = window.SavvySpend || {};
  window.SavvySpend.pages = window.SavvySpend.pages || {};
  window.SavvySpend.pages.PageName = {
    render(param) { return `<div class="page page-xxx">...</div>`; },
    afterRender(param) { /* bind events, init charts */ },
    destroy() { /* cleanup intervals, chart instances */ }
  };
})();
```

### Components
```js
(function() {
  window.SavvySpend = window.SavvySpend || {};
  window.SavvySpend.components = window.SavvySpend.components || {};
  window.SavvySpend.components.CompName = {
    render(props) { return `<div>...</div>`; },
    init(container) { /* bind events */ }
  };
})();
```

## Data Models

### Transaction
```js
{ id: 'tx_abc123', amount: -142.50, merchant: 'Whole Foods Market', category: 'groceries',
  date: '2023-10-24', time: '14:30', paymentMethod: 'Apple Pay', paymentLast4: '4092',
  status: 'completed', notes: '', tags: ['weekend'], currency: 'USD' }
```

### Budget
```js
{ id: 'bud_abc', category: 'food', name: 'Food & Dining', limit: 500, spent: 350,
  period: 'monthly', icon: '🍽️', color: '#10B981' }
```

### Goal
```js
{ id: 'goal_abc', name: 'European Vacation', target: 5000, current: 3250,
  deadline: '2024-10-15', icon: '✈️', color: '#10B981',
  contributions: [
    { id: 'c1', amount: 50, date: '2023-10-24', type: 'auto', source: 'Weekly Savings' },
    { id: 'c2', amount: 200, date: '2023-10-01', type: 'manual', source: 'From Checking' }
  ]
}
```

### UserProfile
```js
{ name: 'Alex Johnson', email: 'alex.johnson@example.com',
  avatarUrl: 'https://ui-avatars.com/api/?name=Alex+Johnson&background=1a1a2e&color=fff&size=128&bold=true',
  membership: 'Pro Member' }
```

### GameState
```js
{ level: 12, xp: 2450, xpToNextLevel: 3000, streak: 14, rank: 42,
  badges: [
    { id: 'streak7', name: 'Streak Keeper', description: 'Logged in 7 days row', icon: '⚡', unlocked: true, unlockedDate: '2023-10-15' },
    { id: 'budget_boss', name: 'Budget Boss', description: 'Under budget for Jan', icon: '🏛️', unlocked: true, unlockedDate: '2023-01-31' },
    { id: 'savings_star', name: 'Savings Star', description: 'Saved first $1,000', icon: '⭐', unlocked: true, unlockedDate: '2023-06-15' },
    { id: 'debt_destroyer', name: 'Debt Destroyer', description: 'Pay off a credit card', icon: '💳', unlocked: false, unlockedDate: null },
    { id: 'first_budget', name: 'First Budget', description: 'Created first budget', icon: '📊', unlocked: true, unlockedDate: '2023-01-05' },
    { id: 'big_saver', name: 'Big Saver', description: 'Saved $5,000 total', icon: '💎', unlocked: false, unlockedDate: null },
    { id: 'category_master', name: 'Category Master', description: 'Track 5+ categories', icon: '🎯', unlocked: true, unlockedDate: '2023-03-20' },
    { id: 'early_bird', name: 'Early Bird', description: 'Log expense within 1 hour', icon: '🐦', unlocked: true, unlockedDate: '2023-02-14' },
    { id: 'month_streak', name: 'Monthly Hero', description: '30 day logging streak', icon: '🦸', unlocked: false, unlockedDate: null },
    { id: 'zero_waste', name: 'Zero Waste', description: 'No unnecessary spending for a week', icon: '♻️', unlocked: false, unlockedDate: null },
    { id: 'goal_getter', name: 'Goal Getter', description: 'Complete a savings goal', icon: '🏆', unlocked: false, unlockedDate: null },
    { id: 'penny_pincher', name: 'Penny Pincher', description: 'Save 20% of income', icon: '🪙', unlocked: true, unlockedDate: '2023-07-31' }
  ]
}
```

### AppSettings
```js
{ currency: 'USD', darkMode: false,
  notifications: { push: true, email: true, sms: true },
  biometricLock: true }
```

## Global APIs

### DataStore (window.DataStore) — js/data.js
```
getTransactions()                  → Transaction[]
addTransaction(t)                  → void
getTransaction(id)                 → Transaction | null
updateTransaction(id, updates)     → void
deleteTransaction(id)              → void

getBudgets()                       → Budget[]
addBudget(b)                       → void
getBudget(id)                      → Budget | null
updateBudget(id, updates)          → void
deleteBudget(id)                   → void

getGoals()                         → Goal[]
addGoal(g)                         → void
getGoal(id)                        → Goal | null
updateGoal(id, updates)            → void
deleteGoal(id)                     → void
addContribution(goalId, c)         → void

getUser()                          → UserProfile
updateUser(updates)                → void

getGameState()                     → GameState
updateGameState(updates)           → void
addXP(amount)                      → { leveled: bool, newLevel: number }
unlockBadge(badgeId)               → void

getSettings()                      → AppSettings
updateSettings(updates)            → void

exportToCSV()                      → string (CSV content)
```

### SavvySpend App (window.SavvySpend) — js/app.js
```
navigate(hash)                     → void (e.g. '#/goals/goal_abc')
handleRoute()                      → void (re-render current page)
showModal(htmlString)              → void
closeModal()                       → void
showToast(message, type)           → void ('success'|'warning'|'error'|'info')
formatCurrency(amount)             → string (with sign: '+$50.00', '-$142.50')
formatCurrencyPlain(amount)        → string (no sign: '$3,250.00')
formatDate(isoStr)                 → string ('Oct 24, 2023')
formatDateShort(isoStr)            → string ('Today', 'Yesterday', 'Oct 24')
generateId()                       → string
```

### Components
```
SavvySpend.components.Navbar.render()        → HTML string
SavvySpend.components.Navbar.init(el)        → void
SavvySpend.components.Navbar.setActive(name) → void

SavvySpend.components.Charts.createBarChart(canvasId, config)   → Chart
SavvySpend.components.Charts.createDonutChart(canvasId, config) → Chart
SavvySpend.components.Charts.destroyAll()                       → void

SavvySpend.components.Modals.addTransaction() → void
SavvySpend.components.Modals.addBudget()      → void
SavvySpend.components.Modals.addGoal()        → void
SavvySpend.components.Modals.addFunds(goalId) → void
SavvySpend.components.Modals.editBudget(id)   → void

SavvySpend.components.Notifications.show(msg, type) → void
SavvySpend.components.Notifications.checkBudgetAlerts() → void
```

## Constants

### CATEGORIES (window.CATEGORIES)
```js
const CATEGORIES = {
  food:          { name: 'Food & Dining',    icon: '🍽️', color: '#10B981' },
  rent:          { name: 'Rent & Utilities', icon: '🏠', color: '#7C3AED' },
  transport:     { name: 'Transport',        icon: '🚗', color: '#F59E0B' },
  shopping:      { name: 'Shopping',         icon: '🛍️', color: '#EC4899' },
  entertainment: { name: 'Entertainment',    icon: '🎬', color: '#3B82F6' },
  utilities:     { name: 'Utilities',        icon: '⚡', color: '#8B5CF6' },
  health:        { name: 'Health',           icon: '🏥', color: '#EF4444' },
  education:     { name: 'Education',        icon: '📚', color: '#06B6D4' },
  groceries:     { name: 'Groceries',        icon: '🛒', color: '#059669' },
  income:        { name: 'Income',           icon: '💰', color: '#10B981' },
  other:         { name: 'Other',            icon: '📦', color: '#9CA3AF' }
};
```

### CURRENCIES (window.CURRENCIES)
```js
const CURRENCIES = {
  USD: { symbol: '$',  name: 'US Dollar',      code: 'USD', rate: 1 },
  EUR: { symbol: '€',  name: 'Euro',           code: 'EUR', rate: 0.85 },
  GBP: { symbol: '£',  name: 'British Pound',  code: 'GBP', rate: 0.73 },
  JPY: { symbol: '¥',  name: 'Japanese Yen',   code: 'JPY', rate: 110.0 },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', code: 'CAD', rate: 1.25 }
};
```

## CSS Design Tokens
```css
:root {
  --primary: #10B981;
  --primary-light: #D1FAE5;
  --primary-dark: #059669;
  --purple: #7C3AED;
  --purple-light: #EDE9FE;
  --red: #EF4444;
  --red-light: #FEE2E2;
  --orange: #F59E0B;
  --orange-light: #FEF3C7;
  --blue: #3B82F6;
  --blue-light: #DBEAFE;
  --pink: #EC4899;
  --bg: #FFFFFF;
  --bg-secondary: #F9FAFB;
  --bg-card: #FFFFFF;
  --text-primary: #111827;
  --text-secondary: #6B7280;
  --text-tertiary: #9CA3AF;
  --border: #E5E7EB;
  --border-light: #F3F4F6;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04);
  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
  --radius-full: 9999px;
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
.dark {
  --bg: #0F172A;
  --bg-secondary: #1E293B;
  --bg-card: #1E293B;
  --text-primary: #F1F5F9;
  --text-secondary: #94A3B8;
  --text-tertiary: #64748B;
  --border: #334155;
  --border-light: #1E293B;
}
```

## Lucide Icons
Use `<i data-lucide="icon-name"></i>`. After rendering, call `lucide.createIcons()`.
Common: home, wallet, bar-chart-3, target, user, bell, plus, arrow-left, more-horizontal, calendar, credit-card, download, moon, shield, lock, log-out, chevron-right, trending-up, trending-down, trophy, zap, flame, star, check-circle, x, edit-2, tag, flag, receipt, split, help-circle, external-link, search, filter, share-2, refresh-cw, circle-check, minus, arrow-up-right, arrow-down-left

## Layout
- Mobile-first, max-width: 430px, centered with auto margins
- Bottom navbar: fixed, 64px height, 5 tabs
- Page container: padding-bottom 80px for navbar clearance
- Modal: bottom-sheet style, slides up, backdrop overlay
- Toast: top-center, auto-dismiss 3s
- All pages scroll vertically within the page container
