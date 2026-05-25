/**
 * SavvySpend — Bottom Navigation Component
 */
(function () {
  'use strict';

  window.SavvySpend = window.SavvySpend || {};
  window.SavvySpend.components = window.SavvySpend.components || {};

  var Navbar = {
    render: function () {
      return `
        <div class="navbar-items flex flex-between w-full h-full">
          <button class="navbar-item" data-route="home">
            <i data-lucide="home"></i>
            <span>Home</span>
          </button>
          <button class="navbar-item" data-route="budgets">
            <i data-lucide="wallet"></i>
            <span>Budgets</span>
          </button>
          <button class="navbar-item" data-route="analytics">
            <i data-lucide="bar-chart-3"></i>
            <span>Analytics</span>
          </button>
          <button class="navbar-item" data-route="goals">
            <i data-lucide="target"></i>
            <span>Goals</span>
          </button>
          <button class="navbar-item" data-route="profile">
            <i data-lucide="user"></i>
            <span>Profile</span>
          </button>
        </div>
      `;
    },

    init: function (container) {
      if (!container) return;
      
      // Bind click handlers to navigate
      container.addEventListener('click', function (e) {
        var item = e.target.closest('.navbar-item');
        if (item) {
          var route = item.getAttribute('data-route');
          if (route) {
            SavvySpend.navigate('#/' + route);
          }
        }
      });
    },

    setActive: function (routeName) {
      var items = document.querySelectorAll('.navbar-item');
      items.forEach(function (item) {
        var route = item.getAttribute('data-route');
        if (route === routeName) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }
  };

  window.SavvySpend.components.Navbar = Navbar;
})();
