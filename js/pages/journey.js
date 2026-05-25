/**
 * SavvySpend — Gamification Journey Page
 */
(function () {
  'use strict';

  window.SavvySpend = window.SavvySpend || {};
  window.SavvySpend.pages = window.SavvySpend.pages || {};

  var Journey = {
    render: function (param) {
      var game = DataStore.getGameState();
      var xpPct = Math.round((game.xp / game.xpToNextLevel) * 100);

      // Streak Missions
      var missions = DataStore.getStreakMissions();
      var missionsHtml = '';
      if (!missions || missions.length === 0) {
        missionsHtml = `<p class="text-center text-secondary py-md text-xs">No active missions available.</p>`;
      } else {
        missionsHtml = missions.map(function (m, index) {
          var claimBtnHtml = '';
          if (m.claimed) {
            claimBtnHtml = `
              <span class="status-badge flex flex-center gap-xs px-sm py-xs text-secondary" style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); font-size: 0.65rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                <i data-lucide="check" style="width: 12px; height: 12px; color: var(--primary);"></i> Claimed
              </span>
            `;
          } else if (m.completed) {
            claimBtnHtml = `
              <button class="btn btn-primary btn-sm btn-claim-mission flex flex-center gap-xs" data-id="${m.id}" style="padding: 4px 10px; font-size: 0.75rem;">
                Claim +${m.xpReward} XP
              </button>
            `;
          } else {
            claimBtnHtml = `
              <span class="status-badge flex flex-center gap-xs px-sm py-xs text-secondary" style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); font-size: 0.65rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                ${m.progress}/${m.target}
              </span>
            `;
          }

          var opacityStyle = m.claimed ? 'opacity: 0.65;' : '';
          var iconName = m.completed ? 'check-circle' : 'circle';
          var iconColor = m.completed ? 'var(--primary)' : 'var(--text-tertiary)';
          var isLast = index === missions.length - 1;
          var borderStyle = isLast ? '' : 'border-bottom: 1px solid var(--border-light); padding-bottom: 8px;';

          return `
            <div class="flex flex-between flex-center py-sm" style="${borderStyle} ${opacityStyle} display: flex; justify-content: space-between; align-items: center; gap: 12px;">
              <div class="flex flex-center gap-md" style="display: flex; align-items: center; gap: 12px; flex: 1;">
                <div class="flex flex-center" style="color: ${iconColor}; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                  <i data-lucide="${iconName}" style="width: 20px; height: 20px;"></i>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-primary-text" style="margin: 0 0 2px 0;">${m.name}</h4>
                  <p class="text-xxs text-secondary" style="font-size: 0.65rem; margin: 0; line-height: 1.3;">${m.description}</p>
                </div>
              </div>
              <div style="flex-shrink: 0;">
                ${claimBtnHtml}
              </div>
            </div>
          `;
        }).join('');
      }

      // Render Badge Cards
      var badgesHtml = '';
      if (!game.badges || game.badges.length === 0) {
        badgesHtml = `<p class="text-center text-secondary py-md text-xs col-span-2">No achievements found.</p>`;
      } else {
        badgesHtml = game.badges.map(function (b) {
          var stateClass = b.unlocked ? 'badge-earned' : 'badge-locked';
          var opacityStyle = b.unlocked ? '' : 'filter: grayscale(100%); opacity: 0.45;';
          var statusText = b.unlocked ? `Unlocked on ${SavvySpend.formatDate(b.unlockedDate)}` : 'Locked';

          return `
            <div class="card p-md text-center flex flex-column gap-xs badge-card ${stateClass}" style="border: 1px solid var(--border); background: var(--bg-card); transition: all 0.2s; ${opacityStyle}">
              <div class="flex flex-center" style="height: 50px; color: ${b.unlocked ? 'var(--primary)' : 'var(--text-tertiary)'};">
                <i data-lucide="${b.icon}" style="width: 32px; height: 32px;"></i>
              </div>
              <h4 class="text-xs font-bold text-primary-text" style="margin: 0;">${b.name}</h4>
              <p class="text-xxs text-secondary" style="font-size: 0.65rem; margin: 0; line-height: 1.3; min-height: 28px;">${b.description}</p>
              <span class="text-xxs font-semibold" style="font-size: 0.6rem; color: ${b.unlocked ? 'var(--primary-dark)' : 'var(--text-tertiary)'};">
                ${statusText}
              </span>
            </div>
          `;
        }).join('');
      }

      return `
        <!-- Header -->
        <div class="page-header mt-sm mb-lg">
          <h2 class="page-title text-2xl font-bold">Your Journey</h2>
          <p class="page-subtitle text-xs text-secondary">Earn XP, level up, and unlock trophies</p>
        </div>

        <!-- Level & XP Card (Special Design) -->
        <div class="card p-lg mb-lg level-card text-white" style="background: linear-gradient(135deg, var(--orange), #EA580C); border: none; box-shadow: var(--shadow-lg);">
          <div class="flex flex-between mb-sm">
            <div>
              <span class="text-xs uppercase font-bold text-white-50" style="color: rgba(255,255,255,0.75);">Current Standing</span>
              <h3 class="text-xl font-extrabold mt-xs text-white">Level ${game.level} Adventurer</h3>
            </div>
            <div class="flex flex-center">
              <i data-lucide="award" style="width: 32px; height: 32px; color: rgba(255,255,255,0.95);"></i>
            </div>
          </div>

          <div class="progress-bar w-full mt-md mb-xs" style="height: 10px; background: rgba(255, 255, 255, 0.2); border-radius: var(--radius-full); overflow: hidden;">
            <div class="progress-bar-fill" style="width: ${xpPct}%; background: white; height: 100%; border-radius: var(--radius-full);"></div>
          </div>

          <div class="flex flex-between text-xs mt-xs" style="color: rgba(255,255,255,0.85);">
            <span>XP: <strong>${game.xp}</strong></span>
            <span>Next Level: <strong>${game.xpToNextLevel} XP</strong></span>
          </div>
        </div>

        <!-- Stats row (streak & rank) -->
        <div class="flex gap-md mb-lg">
          
          <!-- Rank Card -->
          <div class="card p-md rank-card text-white" style="flex: 1; background: linear-gradient(135deg, var(--purple), #5B21B6); border: none; box-shadow: var(--shadow-sm);">
            <span class="text-xxs uppercase font-bold" style="color: rgba(255,255,255,0.75);">Global Rank</span>
            <h3 class="text-xl font-black mt-xs">#${game.rank}</h3>
            <span class="text-xxs" style="font-size: 0.65rem; color: rgba(255,255,255,0.8);">Top 5% of young savers</span>
          </div>

          <!-- Streak Card -->
          <div class="card p-md streak-card flex flex-column gap-xs" style="flex: 1; border: 1px solid var(--border); background: var(--bg-card);">
            <div class="flex flex-between">
              <span class="text-xxs uppercase font-bold text-secondary">Active Streak</span>
              <i data-lucide="flame" style="width: 16px; height: 16px; stroke: var(--red); fill: var(--red);"></i>
            </div>
            <h3 class="text-xl font-extrabold text-primary-text mt-xs">${game.streak} Days</h3>
            <span class="text-xxs text-secondary" style="font-size: 0.65rem;">Log in daily to keep saving!</span>
          </div>

        </div>

        <!-- Streak Missions Card -->
        <div class="card p-md mb-lg bg-card" style="border: 1px solid var(--border);">
          <h3 class="section-title text-sm font-bold text-secondary uppercase tracking-wider mb-sm" style="margin-top: 0;">Streak Missions</h3>
          <div class="flex flex-col gap-sm" style="display: flex; flex-direction: column; gap: 8px;">
            ${missionsHtml}
          </div>
        </div>

        <!-- Trophy Case grid -->
        <div class="mb-xl">
          <h3 class="section-title text-sm font-bold text-secondary uppercase tracking-wider mb-sm">Trophy Room</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;" id="badges-grid-container">
            ${badgesHtml}
          </div>
        </div>
      `;
    },

    afterRender: function () {
      // Bind Claim Mission buttons
      var claimBtns = document.querySelectorAll('.btn-claim-mission');
      claimBtns.forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          var id = btn.getAttribute('data-id');
          var result = DataStore.claimMissionReward(id);
          if (result.success) {
            SavvySpend.showToast(`Claimed +${result.xpReward} XP!`, 'success');
            if (result.leveled) {
              setTimeout(function () {
                SavvySpend.showToast(`Leveled Up to Level ${result.newLevel}! 🎉`, 'info');
              }, 1200);
            }
            SavvySpend.handleRoute(); // Refresh UI
          } else {
            SavvySpend.showToast(result.message, 'error');
          }
        });
      });

      // Add hover dynamics for unlocked badges
      var earnedBadges = document.querySelectorAll('.badge-card.badge-earned');
      earnedBadges.forEach(function (badge) {
        badge.addEventListener('mouseenter', function () {
          badge.style.transform = 'scale(1.03)';
          badge.style.boxShadow = 'var(--shadow-md)';
        });
        badge.addEventListener('mouseleave', function () {
          badge.style.transform = '';
          badge.style.boxShadow = '';
        });
      });
    },

    destroy: function () {
      // Cleanup
    }
  };

  window.SavvySpend.pages.Journey = Journey;
})();
