/**
 * SavvySpend — Data Layer
 *
 * Constants, DataStore CRUD, seed data, XP/leveling, and CSV export.
 * Relies on window.SecureStorage (js/storage.js) for persistence.
 */
(function () {
  'use strict';

  // ─── Storage keys ────────────────────────────────────────
  var KEYS = {
    transactions: 'ss_transactions',
    budgets:      'ss_budgets',
    goals:        'ss_goals',
    user:         'ss_user',
    game:         'ss_game',
    settings:     'ss_settings',
    modes:        'ss_money_modes',
    jobs:         'ss_money_jobs',
    notes:        'ss_future_notes',
    categories:   'ss_custom_categories'
  };

  // ─── Helpers ─────────────────────────────────────────────
  function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function _read(key) {
    return SecureStorage.get(key);
  }

  function _write(key, value) {
    SecureStorage.set(key, value);
  }

  window.DEFAULT_CATEGORIES = [
    { id: 'food',          name: 'Food & Dining',    icon: 'utensils', color: '#10B981', isCustom: false },
    { id: 'rent',          name: 'Rent & Utilities', icon: 'home', color: '#7C3AED', isCustom: false },
    { id: 'transport',     name: 'Transport',        icon: 'car', color: '#F59E0B', isCustom: false },
    { id: 'shopping',      name: 'Shopping',         icon: 'shopping-bag', color: '#EC4899', isCustom: false },
    { id: 'entertainment', name: 'Entertainment',    icon: 'clapperboard', color: '#3B82F6', isCustom: false },
    { id: 'utilities',     name: 'Utilities',        icon: 'zap', color: '#8B5CF6', isCustom: false },
    { id: 'health',        name: 'Health',           icon: 'activity', color: '#EF4444', isCustom: false },
    { id: 'education',     name: 'Education',        icon: 'graduation-cap', color: '#06B6D4', isCustom: false },
    { id: 'groceries',     name: 'Groceries',        icon: 'shopping-cart', color: '#059669', isCustom: false },
    { id: 'income',        name: 'Income',           icon: 'arrow-down-left', color: '#10B981', isCustom: false },
    { id: 'other',         name: 'Other',            icon: 'package', color: '#9CA3AF', isCustom: false }
  ];

  window.CATEGORIES = {
    food:          { name: 'Food & Dining',    icon: 'utensils', color: '#10B981' },
    rent:          { name: 'Rent & Utilities', icon: 'home', color: '#7C3AED' },
    transport:     { name: 'Transport',        icon: 'car', color: '#F59E0B' },
    shopping:      { name: 'Shopping',         icon: 'shopping-bag', color: '#EC4899' },
    entertainment: { name: 'Entertainment',    icon: 'clapperboard', color: '#3B82F6' },
    utilities:     { name: 'Utilities',        icon: 'zap', color: '#8B5CF6' },
    health:        { name: 'Health',           icon: 'activity', color: '#EF4444' },
    education:     { name: 'Education',        icon: 'graduation-cap', color: '#06B6D4' },
    groceries:     { name: 'Groceries',        icon: 'shopping-cart', color: '#059669' },
    income:        { name: 'Income',           icon: 'arrow-down-left', color: '#10B981' },
    other:         { name: 'Other',            icon: 'package', color: '#9CA3AF' }
  };

  window.CURRENCIES = {
    GHS: { symbol: 'GH₵', name: 'Ghana Cedi', code: 'GHS', rate: 1 }
  };

  window.PRESET_MONEY_MODES = [
    {
      id: 'school_week',
      name: 'School Week',
      isCustom: false,
      budgetOverrides: { food: 250, transport: 100, entertainment: 50, shopping: 80 },
      goalPriorities: {},
      guidanceTip: 'School mode active: Stay focused! Limit entertainment spending and prioritize study materials.'
    },
    {
      id: 'broke_week',
      name: 'Broke Week',
      isCustom: false,
      budgetOverrides: { food: 100, transport: 50, entertainment: 0, shopping: 0, groceries: 150 },
      goalPriorities: {},
      guidanceTip: 'Broke Week alert! Strict limits applied. Cut all non-essential spending. Free activities only!'
    },
    {
      id: 'exam_season',
      name: 'Exam Season',
      isCustom: false,
      budgetOverrides: { food: 350, transport: 80, entertainment: 20, utilities: 120 },
      goalPriorities: {},
      guidanceTip: 'Exam Season active: Spend on nutrition and quiet workspaces. Minimize social travel.'
    },
    {
      id: 'going_home',
      name: 'Going Home',
      isCustom: false,
      budgetOverrides: { transport: 300, food: 150, shopping: 200 },
      goalPriorities: {},
      guidanceTip: 'Going Home: High travel costs expected. Don\'t forget gifts for family, but stay within travel budgets.'
    },
    {
      id: 'project_mode',
      name: 'Project Mode',
      isCustom: false,
      budgetOverrides: { utilities: 200, food: 300, shopping: 50 },
      goalPriorities: {},
      guidanceTip: 'Project Mode: Invest in tools, power, and coffee. Hold off on shopping.'
    }
  ];

  function initCustomCategories() {
    try {
      var list = _read(KEYS.categories);
      if (!list || !Array.isArray(list) || list.length === 0) {
        list = deepCopy(window.DEFAULT_CATEGORIES);
        _write(KEYS.categories, list);
      }
      window.CATEGORIES = {};
      list.forEach(function (cat) {
        window.CATEGORIES[cat.id] = {
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          isCustom: cat.isCustom || false
        };
      });
    } catch (e) {
      console.error('[DataStore] Failed to init custom categories', e);
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  SEED DATA
  // ═══════════════════════════════════════════════════════════

  var SEED_TRANSACTIONS = [];

  var SEED_BUDGETS = [];

  var SEED_GOALS = [];

  var SEED_USER = null;

  var SEED_GAME = {
    level: 1,
    xp: 0,
    xpToNextLevel: 250,
    streak: 0,
    rank: 1000,
    claimedMissions: [],
    badges: [
      { id: 'streak7',         name: 'Streak Keeper',   description: 'Logged in 7 days row',            icon: 'flame', unlocked: false,  unlockedDate: null },
      { id: 'budget_boss',     name: 'Budget Boss',     description: 'Under budget for Jan',             icon: 'landmark', unlocked: false,  unlockedDate: null },
      { id: 'savings_star',    name: 'Savings Star',    description: 'Saved first GH₵1,000',               icon: 'star', unlocked: false,  unlockedDate: null },
      { id: 'debt_destroyer',  name: 'Debt Destroyer',  description: 'Pay off a credit card',            icon: 'credit-card', unlocked: false, unlockedDate: null },
      { id: 'first_budget',    name: 'First Budget',    description: 'Created first budget',             icon: 'bar-chart-3', unlocked: false,  unlockedDate: null },
      { id: 'big_saver',       name: 'Big Saver',       description: 'Saved GH₵5,000 total',               icon: 'gem', unlocked: false, unlockedDate: null },
      { id: 'category_master', name: 'Category Master', description: 'Track 5+ categories',              icon: 'target', unlocked: false,  unlockedDate: null },
      { id: 'early_bird',      name: 'Early Bird',      description: 'Log expense within 1 hour',        icon: 'clock', unlocked: false,  unlockedDate: null },
      { id: 'month_streak',    name: 'Monthly Hero',    description: '30 day logging streak',            icon: 'trophy', unlocked: false, unlockedDate: null },
      { id: 'zero_waste',      name: 'Zero Waste',      description: 'No unnecessary spending for a week',icon: 'recycle', unlocked: false, unlockedDate: null },
      { id: 'goal_getter',     name: 'Goal Getter',     description: 'Complete a savings goal',          icon: 'award', unlocked: false,  unlockedDate: null },
      { id: 'penny_pincher',   name: 'Penny Pincher',   description: 'Save 20% of income',              icon: 'coins', unlocked: false,  unlockedDate: null }
    ]
  };

  var SEED_SETTINGS = {
    currency: 'GHS',
    darkMode: false,
    notifications: { push: true, email: true, sms: true },
    biometricLock: true,
    activeModeId: 'none'
  };

  // ═══════════════════════════════════════════════════════════
  //  SEED INITIALISER
  // ═══════════════════════════════════════════════════════════

  function _seedIfEmpty() {
    if (!_read(KEYS.transactions)) _write(KEYS.transactions, SEED_TRANSACTIONS);
    if (!_read(KEYS.budgets))      _write(KEYS.budgets,      SEED_BUDGETS);
    if (!_read(KEYS.goals))        _write(KEYS.goals,        SEED_GOALS);
    if (SEED_USER !== null && !_read(KEYS.user)) _write(KEYS.user, SEED_USER);
    if (!_read(KEYS.game))         _write(KEYS.game,         SEED_GAME);
    if (!_read(KEYS.settings))     _write(KEYS.settings,     SEED_SETTINGS);
  }

  function _migrateEmojiData() {
    var emojiMap = {
      '🍽️': 'utensils', '🍔': 'utensils',
      '🏠': 'home',
      '🚗': 'car',
      '🛍️': 'shopping-bag',
      '🎬': 'clapperboard',
      '⚡': 'zap', '🔥': 'flame',
      '🏥': 'activity',
      '📚': 'graduation-cap', '🎓': 'graduation-cap',
      '🛒': 'shopping-cart',
      '💰': 'arrow-down-left',
      '📦': 'package',
      '✈️': 'plane',
      '💻': 'laptop',
      '💍': 'shield',
      '🎮': 'target',
      '🏛️': 'landmark',
      '⭐': 'star',
      '💳': 'credit-card',
      '📊': 'bar-chart-3',
      '💎': 'gem',
      '🎯': 'target',
      '🐦': 'clock',
      '🦸': 'trophy',
      '♻️': 'recycle',
      '🏆': 'award',
      '🪙': 'coins'
    };

    function cleanIcon(icon) {
      if (!icon) return 'target';
      if (emojiMap[icon]) return emojiMap[icon];
      if (icon.length <= 2 && !/^[a-zA-Z0-9]$/.test(icon)) {
        return 'target';
      }
      return icon;
    }

    var budgets = _read(KEYS.budgets);
    if (Array.isArray(budgets)) {
      var bUpdated = false;
      budgets.forEach(function (b) {
        var newIcon = cleanIcon(b.icon);
        if (newIcon !== b.icon) {
          b.icon = newIcon;
          bUpdated = true;
        }
      });
      if (bUpdated) _write(KEYS.budgets, budgets);
    }

    var goals = _read(KEYS.goals);
    if (Array.isArray(goals)) {
      var gUpdated = false;
      goals.forEach(function (g) {
        var newIcon = cleanIcon(g.icon);
        if (newIcon !== g.icon) {
          g.icon = newIcon;
          gUpdated = true;
        }
      });
      if (gUpdated) _write(KEYS.goals, goals);
    }

    var game = _read(KEYS.game);
    if (game && Array.isArray(game.badges)) {
      var gameUpdated = false;
      game.badges.forEach(function (b) {
        var newIcon = cleanIcon(b.icon);
        if (newIcon !== b.icon) {
          b.icon = newIcon;
          gameUpdated = true;
        }
      });
      if (gameUpdated) _write(KEYS.game, game);
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  DATA STORE
  // ═══════════════════════════════════════════════════════════

  window.DataStore = {

    // ── Transactions ─────────────────────────────────────────

    getTransactions: function () {
      return deepCopy(_read(KEYS.transactions) || []);
    },

    addTransaction: function (t) {
      var list = _read(KEYS.transactions) || [];
      list.unshift(t); // newest first
      _write(KEYS.transactions, list);
    },

    getTransaction: function (id) {
      var list = _read(KEYS.transactions) || [];
      var found = list.find(function (t) { return t.id === id; });
      return found ? deepCopy(found) : null;
    },

    updateTransaction: function (id, updates) {
      var list = _read(KEYS.transactions) || [];
      var idx = list.findIndex(function (t) { return t.id === id; });
      if (idx !== -1) {
        Object.assign(list[idx], updates);
        _write(KEYS.transactions, list);
      }
    },

    deleteTransaction: function (id) {
      var list = _read(KEYS.transactions) || [];
      list = list.filter(function (t) { return t.id !== id; });
      _write(KEYS.transactions, list);
    },

    // ── Budgets ──────────────────────────────────────────────

    getBudgets: function () {
      var list = deepCopy(_read(KEYS.budgets) || []);
      var settings = _read(KEYS.settings) || {};
      var activeModeId = settings.activeModeId;
      if (activeModeId && activeModeId !== 'none') {
        var modes = this.getMoneyModes();
        var activeMode = modes.find(function (m) { return m.id === activeModeId; });
        if (activeMode && activeMode.budgetOverrides) {
          list.forEach(function (b) {
            if (activeMode.budgetOverrides[b.category] !== undefined) {
              b.limit = activeMode.budgetOverrides[b.category];
            }
          });
        }
      }
      return list;
    },

    addBudget: function (b) {
      var list = _read(KEYS.budgets) || [];
      list.push(b);
      _write(KEYS.budgets, list);
    },

    getBudget: function (id) {
      var list = this.getBudgets();
      var found = list.find(function (b) { return b.id === id; });
      return found ? deepCopy(found) : null;
    },

    updateBudget: function (id, updates) {
      var list = _read(KEYS.budgets) || [];
      var idx = list.findIndex(function (b) { return b.id === id; });
      if (idx !== -1) {
        Object.assign(list[idx], updates);
        _write(KEYS.budgets, list);
      }
    },

    deleteBudget: function (id) {
      var list = _read(KEYS.budgets) || [];
      list = list.filter(function (b) { return b.id !== id; });
      _write(KEYS.budgets, list);
    },

    // ── Goals ────────────────────────────────────────────────

    getGoals: function () {
      var list = deepCopy(_read(KEYS.goals) || []);
      var settings = _read(KEYS.settings) || {};
      var activeModeId = settings.activeModeId;
      if (activeModeId && activeModeId !== 'none') {
        var modes = this.getMoneyModes();
        var activeMode = modes.find(function (m) { return m.id === activeModeId; });
        if (activeMode && activeMode.goalPriorities) {
          list.forEach(function (g) {
            if (activeMode.goalPriorities[g.id] !== undefined) {
              g.priority = activeMode.goalPriorities[g.id];
            }
          });
        }
      }
      return list;
    },

    addGoal: function (g) {
      var list = _read(KEYS.goals) || [];
      list.push(g);
      _write(KEYS.goals, list);
    },

    getGoal: function (id) {
      var list = this.getGoals();
      var found = list.find(function (g) { return g.id === id; });
      return found ? deepCopy(found) : null;
    },

    updateGoal: function (id, updates) {
      var list = _read(KEYS.goals) || [];
      var idx = list.findIndex(function (g) { return g.id === id; });
      if (idx !== -1) {
        Object.assign(list[idx], updates);
        _write(KEYS.goals, list);
      }
    },

    deleteGoal: function (id) {
      var list = _read(KEYS.goals) || [];
      list = list.filter(function (g) { return g.id !== id; });
      _write(KEYS.goals, list);
    },

    addContribution: function (goalId, contribution) {
      var list = _read(KEYS.goals) || [];
      var idx = list.findIndex(function (g) { return g.id === goalId; });
      if (idx !== -1) {
        if (!Array.isArray(list[idx].contributions)) {
          list[idx].contributions = [];
        }
        list[idx].contributions.unshift(contribution);
        list[idx].current = (list[idx].current || 0) + contribution.amount;
        if (list[idx].current > list[idx].target) {
          list[idx].current = list[idx].target;
        }
        _write(KEYS.goals, list);
      }
    },

    // ── User Profile ─────────────────────────────────────────

    getUser: function () {
      var user = _read(KEYS.user);
      if (user) {
        initCustomCategories();
      }
      return user ? deepCopy(user) : null;
    },

    updateUser: function (updates) {
      var user = _read(KEYS.user) || {};
      Object.assign(user, updates);
      _write(KEYS.user, user);
    },

    // ── Game State ───────────────────────────────────────────

    getGameState: function () {
      return deepCopy(_read(KEYS.game) || SEED_GAME);
    },

    updateGameState: function (updates) {
      var game = _read(KEYS.game) || {};
      Object.assign(game, updates);
      _write(KEYS.game, game);
    },

    addXP: function (amount) {
      var game = _read(KEYS.game) || deepCopy(SEED_GAME);
      game.xp = (game.xp || 0) + amount;
      var leveled = false;

      while (game.xp >= game.xpToNextLevel) {
        game.xp -= game.xpToNextLevel;
        game.level = (game.level || 1) + 1;
        game.xpToNextLevel = game.level * 250;
        leveled = true;
      }

      _write(KEYS.game, game);
      return { leveled: leveled, newLevel: game.level };
    },

    unlockBadge: function (badgeId) {
      var game = _read(KEYS.game) || deepCopy(SEED_GAME);
      if (Array.isArray(game.badges)) {
        var badge = game.badges.find(function (b) { return b.id === badgeId; });
        if (badge && !badge.unlocked) {
          badge.unlocked = true;
          badge.unlockedDate = new Date().toISOString().split('T')[0];
          _write(KEYS.game, game);
        }
      }
    },

    // ── Settings ─────────────────────────────────────────────

    getSettings: function () {
      return deepCopy(_read(KEYS.settings) || SEED_SETTINGS);
    },

    updateSettings: function (updates) {
      var settings = _read(KEYS.settings) || {};
      if (updates.notifications && typeof updates.notifications === 'object') {
        settings.notifications = Object.assign({}, settings.notifications || {}, updates.notifications);
        var partial = Object.assign({}, updates);
        delete partial.notifications;
        Object.assign(settings, partial);
      } else {
        Object.assign(settings, updates);
      }
      _write(KEYS.settings, settings);
    },

    // ── Money Modes ──────────────────────────────────────────

    getMoneyModes: function () {
      var custom = _read(KEYS.modes) || [];
      return window.PRESET_MONEY_MODES.concat(custom);
    },

    addMoneyMode: function (mode) {
      var custom = _read(KEYS.modes) || [];
      custom.push(mode);
      _write(KEYS.modes, custom);
    },

    updateMoneyMode: function (id, updates) {
      var custom = _read(KEYS.modes) || [];
      var idx = custom.findIndex(function (m) { return m.id === id; });
      if (idx !== -1) {
        Object.assign(custom[idx], updates);
        _write(KEYS.modes, custom);
      }
    },

    deleteMoneyMode: function (id) {
      var custom = _read(KEYS.modes) || [];
      custom = custom.filter(function (m) { return m.id !== id; });
      _write(KEYS.modes, custom);

      var settings = _read(KEYS.settings) || {};
      if (settings.activeModeId === id) {
        settings.activeModeId = 'none';
        _write(KEYS.settings, settings);
      }
    },

    // ── Money Jobs ───────────────────────────────────────────

    getMoneyJobs: function () {
      var jobs = deepCopy(_read(KEYS.jobs) || []);
      var txns = _read(KEYS.transactions) || [];
      
      jobs.forEach(function (job) {
        var spent = txns
          .filter(function (t) { return t.bucketId === job.id && t.amount < 0; })
          .reduce(function (sum, t) { return sum + Math.abs(t.amount); }, 0);
        job.spent = spent;
      });
      
      return jobs;
    },

    addMoneyJob: function (job) {
      var list = _read(KEYS.jobs) || [];
      list.push(job);
      _write(KEYS.jobs, list);
    },

    updateMoneyJob: function (id, updates) {
      var list = _read(KEYS.jobs) || [];
      var idx = list.findIndex(function (j) { return j.id === id; });
      if (idx !== -1) {
        Object.assign(list[idx], updates);
        _write(KEYS.jobs, list);
      }
    },

    deleteMoneyJob: function (id) {
      var list = _read(KEYS.jobs) || [];
      list = list.filter(function (j) { return j.id !== id; });
      _write(KEYS.jobs, list);

      var txns = _read(KEYS.transactions) || [];
      var txUpdated = false;
      txns.forEach(function (t) {
        if (t.bucketId === id) {
          t.bucketId = null;
          txUpdated = true;
        }
      });
      if (txUpdated) {
        _write(KEYS.transactions, txns);
      }
    },

    // ── Custom Categories ────────────────────────────────────

    getCustomCategories: function () {
      var list = _read(KEYS.categories);
      if (!list || !Array.isArray(list) || list.length === 0) {
        list = deepCopy(window.DEFAULT_CATEGORIES);
        _write(KEYS.categories, list);
      }
      return deepCopy(list);
    },

    addCustomCategory: function (cat) {
      var list = this.getCustomCategories();
      list.push(cat);
      _write(KEYS.categories, list);
      initCustomCategories();
    },

    updateCustomCategory: function (id, updates) {
      var list = this.getCustomCategories();
      var idx = list.findIndex(function (c) { return c.id === id; });
      if (idx !== -1) {
        Object.assign(list[idx], updates);
        _write(KEYS.categories, list);
        initCustomCategories();
      }
    },

    deleteCustomCategory: function (id) {
      var list = this.getCustomCategories();
      list = list.filter(function (c) { return c.id !== id; });
      _write(KEYS.categories, list);
      initCustomCategories();

      var txns = _read(KEYS.transactions) || [];
      var txUpdated = false;
      txns.forEach(function (t) {
        if (t.category === id) {
          t.category = 'other';
          txUpdated = true;
        }
      });
      if (txUpdated) {
        _write(KEYS.transactions, txns);
      }

      var budgets = _read(KEYS.budgets) || [];
      var budFiltered = budgets.filter(function (b) { return b.category !== id; });
      if (budFiltered.length !== budgets.length) {
        _write(KEYS.budgets, budFiltered);
      }
    },

    // ── Future Self Notes ────────────────────────────────────

    getFutureNotes: function () {
      return deepCopy(_read(KEYS.notes) || []);
    },

    getNoteForCategory: function (categoryId) {
      var list = _read(KEYS.notes) || [];
      var found = list.find(function (n) { return n.categoryId === categoryId && n.isActive; });
      return found ? deepCopy(found) : null;
    },

    addFutureNote: function (note) {
      var list = _read(KEYS.notes) || [];
      list.push(note);
      _write(KEYS.notes, list);
    },

    updateFutureNote: function (id, updates) {
      var list = _read(KEYS.notes) || [];
      var idx = list.findIndex(function (n) { return n.id === id; });
      if (idx !== -1) {
        Object.assign(list[idx], updates);
        _write(KEYS.notes, list);
      }
    },

    deleteFutureNote: function (id) {
      var list = _read(KEYS.notes) || [];
      list = list.filter(function (n) { return n.id !== id; });
      _write(KEYS.notes, list);
    },

    // ── Streak Missions ──────────────────────────────────────

    getStreakMissions: function () {
      var game = _read(KEYS.game) || {};
      var claimed = game.claimedMissions || [];
      var txns = _read(KEYS.transactions) || [];
      
      var missions = [
        {
          id: 'consistency_hero',
          name: 'Consistency Hero',
          description: 'Log at least 3 transactions.',
          xpReward: 50,
          progress: txns.length,
          target: 3,
          completed: txns.length >= 3,
          claimed: claimed.includes('consistency_hero')
        },
        {
          id: 'mindful_spender',
          name: 'Mindful Spender',
          description: 'Log 3 "Worth It 😊" transactions.',
          xpReward: 100,
          progress: txns.filter(function (t) { return t.rating === 'worth_it'; }).length,
          target: 3,
          completed: txns.filter(function (t) { return t.rating === 'worth_it'; }).length >= 3,
          claimed: claimed.includes('mindful_spender')
        },
        {
          id: 'streak_master',
          name: 'Streak Master',
          description: 'Reach a streak of 3+ days.',
          xpReward: 75,
          progress: game.streak || 0,
          target: 3,
          completed: (game.streak || 0) >= 3,
          claimed: claimed.includes('streak_master')
        },
        {
          id: 'budget_sentinel',
          name: 'Budget Sentinel',
          description: 'Keep monthly spent under GH₵2,000.',
          xpReward: 150,
          progress: (function () {
            var currentMonth = new Date().toISOString().substring(0, 7);
            var spent = txns
              .filter(function (t) { return t.amount < 0 && t.date.startsWith(currentMonth); })
              .reduce(function (sum, t) { return sum + Math.abs(t.amount); }, 0);
            return spent;
          })(),
          target: 2000,
          completed: (function () {
            var currentMonth = new Date().toISOString().substring(0, 7);
            var thisMonthTxns = txns.filter(function (t) { return t.date.startsWith(currentMonth); });
            if (thisMonthTxns.length === 0) return false;
            var spent = thisMonthTxns
              .filter(function (t) { return t.amount < 0; })
              .reduce(function (sum, t) { return sum + Math.abs(t.amount); }, 0);
            return spent <= 2000;
          })(),
          claimed: claimed.includes('budget_sentinel')
        }
      ];
      return missions;
    },

    claimMissionReward: function (missionId) {
      var game = _read(KEYS.game) || {};
      game.claimedMissions = game.claimedMissions || [];
      if (game.claimedMissions.includes(missionId)) {
        return { success: false, message: 'Reward already claimed.' };
      }
      
      var missions = this.getStreakMissions();
      var mission = missions.find(function (m) { return m.id === missionId; });
      if (!mission) {
        return { success: false, message: 'Mission not found.' };
      }
      if (!mission.completed) {
        return { success: false, message: 'Mission is not completed yet.' };
      }
      
      game.claimedMissions.push(missionId);
      _write(KEYS.game, game);
      
      var xpResult = this.addXP(mission.xpReward);
      return {
        success: true,
        xpReward: mission.xpReward,
        leveled: xpResult.leveled,
        newLevel: xpResult.newLevel
      };
    },

    // ── Habits Insights ──────────────────────────────────────

    getHabitInsights: function () {
      var txns = _read(KEYS.transactions) || [];
      var insights = [];

      if (txns.length === 0) {
        return [{
          type: 'info',
          title: 'Collecting Data',
          message: 'Insights will appear here once you log a few transactions!',
          icon: 'clock',
          color: '#3B82F6'
        }];
      }

      var merchantGroups = {};
      txns.forEach(function (t) {
        if (t.amount < 0) {
          var key = t.merchant.trim().toLowerCase() + '_' + Math.abs(t.amount).toFixed(2);
          merchantGroups[key] = merchantGroups[key] || [];
          merchantGroups[key].push(t);
        }
      });

      Object.keys(merchantGroups).forEach(function (key) {
        var group = merchantGroups[key];
        if (group.length >= 2) {
          var dates = group.map(function (t) { return new Date(t.date); }).sort(function (a, b) { return a - b; });
          var diffMs = dates[dates.length - 1] - dates[0];
          var diffDays = diffMs / 86400000;
          if (diffDays >= 15) {
            var mName = group[0].merchant;
            var amt = SavvySpend.formatCurrencyPlain(Math.abs(group[0].amount));
            insights.push({
              type: 'recurring',
              title: 'Recurring Subscription Detected',
              message: `We noticed you pay ${amt} regularly to <strong>${mName}</strong>. Consider reviewing this subscription if you don't use it.`,
              icon: 'refresh-cw',
              color: '#3B82F6'
            });
          }
        }
      });

      var lateNightTx = txns.filter(function (t) {
        if (t.amount >= 0) return false;
        var hour = -1;
        if (t.time) {
          hour = parseInt(t.time.split(':')[0], 10);
        } else if (t.date && t.date.includes('T')) {
          hour = new Date(t.date).getHours();
        }
        return (hour >= 23 || (hour >= 0 && hour <= 4));
      });

      if (lateNightTx.length >= 2) {
        var totalLateAmt = lateNightTx.reduce(function (sum, t) { return sum + Math.abs(t.amount); }, 0);
        var formattedLateAmt = SavvySpend.formatCurrencyPlain(totalLateAmt);
        insights.push({
          type: 'time',
          title: 'Late Night Spending',
          message: `You spent <strong>${formattedLateAmt}</strong> on ${lateNightTx.length} transactions late at night. Sleep on it next time to avoid impulse buys!`,
          icon: 'moon',
          color: '#8B5CF6'
        });
      }

      var regretTx = txns.filter(function (t) { return t.amount < 0 && t.rating === 'regret'; });
      if (regretTx.length >= 1) {
        var regretMerchants = {};
        regretTx.forEach(function (t) {
          var m = t.merchant.trim();
          regretMerchants[m] = (regretMerchants[m] || 0) + Math.abs(t.amount);
        });

        var worstMerchant = '';
        var worstAmt = 0;
        Object.keys(regretMerchants).forEach(function (m) {
          if (regretMerchants[m] > worstAmt) {
            worstAmt = regretMerchants[m];
            worstMerchant = m;
          }
        });

        if (worstMerchant) {
          insights.push({
            type: 'regret',
            title: 'High Regret Merchant',
            message: `You spent <strong>${SavvySpend.formatCurrencyPlain(worstAmt)}</strong> at <strong>${worstMerchant}</strong> which you later regretted. Try to avoid this merchant!`,
            icon: 'frown',
            color: '#EF4444'
          });
        }
      }

      var now = new Date();
      var sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
      var fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000);

      var spentThisWeek = txns
        .filter(function (t) { return t.amount < 0 && new Date(t.date) >= sevenDaysAgo; })
        .reduce(function (sum, t) { return sum + Math.abs(t.amount); }, 0);

      var spentLastWeek = txns
        .filter(function (t) { return t.amount < 0 && new Date(t.date) >= fourteenDaysAgo && new Date(t.date) < sevenDaysAgo; })
        .reduce(function (sum, t) { return sum + Math.abs(t.amount); }, 0);

      if (spentLastWeek > 0 && spentThisWeek > spentLastWeek * 1.3) {
        var percentIncrease = Math.round(((spentThisWeek - spentLastWeek) / spentLastWeek) * 100);
        insights.push({
          type: 'acceleration',
          title: 'Spending Acceleration',
          message: `Your spending this week is <strong>${percentIncrease}% higher</strong> than last week (${SavvySpend.formatCurrencyPlain(spentThisWeek)} vs ${SavvySpend.formatCurrencyPlain(spentLastWeek)}). Let's slow down!`,
          icon: 'trending-up',
          color: '#F59E0B'
        });
      }

      if (insights.length === 0) {
        insights.push({
          type: 'good',
          title: 'Consistent Habits',
          message: 'Excellent job! No negative spending patterns or accelerating spending detected this week. Keep it up!',
          icon: 'smile',
          color: '#10B981'
        });
      }

      return insights;
    },

    // ── CSV Export ────────────────────────────────────────────

    exportToCSV: function () {
      var txns = _read(KEYS.transactions) || [];
      var headers = ['Date', 'Merchant', 'Category', 'Amount', 'Payment Method', 'Status', 'Notes', 'Tags', 'Rating', 'Bucket'];
      var rows = [headers.join(',')];

      txns.forEach(function (t) {
        var cat = window.CATEGORIES[t.category];
        var catName = cat ? cat.name : t.category;
        
        var ratingLabel = '';
        if (t.rating === 'worth_it') ratingLabel = 'Worth It';
        else if (t.rating === 'neutral') ratingLabel = 'Neutral';
        else if (t.rating === 'regret') ratingLabel = 'Regret';

        var bucketLabel = '';
        if (t.bucketId) {
          var jobs = _read(KEYS.jobs) || [];
          var job = jobs.find(function(j) { return j.id === t.bucketId; });
          if (job) bucketLabel = job.name;
        }

        var row = [
          t.date || '',
          '"' + (t.merchant || '').replace(/"/g, '""') + '"',
          '"' + catName.replace(/"/g, '""') + '"',
          t.amount || 0,
          '"' + (t.paymentMethod || '').replace(/"/g, '""') + '"',
          t.status || '',
          '"' + (t.notes || '').replace(/"/g, '""') + '"',
          '"' + (Array.isArray(t.tags) ? t.tags.join('; ') : '').replace(/"/g, '""') + '"',
          '"' + ratingLabel + '"',
          '"' + bucketLabel.replace(/"/g, '""') + '"'
        ];
        rows.push(row.join(','));
      });

      return rows.join('\n');
    }
  };

  _seedIfEmpty();
  _migrateEmojiData();
  initCustomCategories();

})();
