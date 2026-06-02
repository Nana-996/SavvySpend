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
      
      // Bind click handlers with haptic-like feedback
      container.addEventListener('click', function (e) {
        var item = e.target.closest('.navbar-item');
        if (item) {
          var route = item.getAttribute('data-route');
          if (route) {
            // Add tap animation
            item.classList.add('navbar-tap');
            setTimeout(function () {
              item.classList.remove('navbar-tap');
            }, 200);
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
          // Animate the active indicator dot
          var dot = item.querySelector('.navbar-dot');
          if (!dot) {
            dot = document.createElement('span');
            dot.className = 'navbar-dot';
            item.appendChild(dot);
          }
        } else {
          item.classList.remove('active');
          var dot = item.querySelector('.navbar-dot');
          if (dot) dot.remove();
        }
      });
    }
  };

  window.SavvySpend.components.Navbar = Navbar;
})();
