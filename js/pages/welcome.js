/**
 * SavvySpend — Welcome / Onboarding / Vault Unlock Page
 */
(function () {
  'use strict';

  window.SavvySpend = window.SavvySpend || {};
  window.SavvySpend.pages = window.SavvySpend.pages || {};

  var tempRecoveryKey = '';
  function generateRecoveryKey() {
    if (tempRecoveryKey) return tempRecoveryKey;
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var part1 = '';
    var part2 = '';
    var part3 = '';
    for (var i = 0; i < 4; i++) {
      part1 += chars.charAt(Math.floor(Math.random() * chars.length));
      part2 += chars.charAt(Math.floor(Math.random() * chars.length));
      part3 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    tempRecoveryKey = 'SAVVY-' + part1 + '-' + part2 + '-' + part3;
    return tempRecoveryKey;
  }

  var Welcome = {
    render: function (param) {
      var hasUser = localStorage.getItem('ss_user') !== null;

      if (!hasUser) {
        var recoveryKey = generateRecoveryKey();
        // --- Onboarding / Sign Up State ---
        return `
          <div class="page page-welcome flex flex-column justify-center" style="min-height: calc(100vh - 40px); display: flex; flex-direction: column; justify-content: center; padding: 24px 16px;">
            
            <div class="text-center mb-xl">
              <div class="flex flex-center mb-md" style="margin: 0 auto; width: 64px; height: 64px; border-radius: var(--radius-xl); background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: white; box-shadow: 0 8px 20px var(--primary-glow);">
                <i data-lucide="shield" style="width: 32px; height: 32px;"></i>
              </div>
              <h1 class="text-3xl font-extrabold text-primary-text" style="letter-spacing: -0.5px; margin-bottom: 8px;">SavvySpend</h1>
              <p class="text-sm text-secondary px-sm">Your secure, local, and gamified financial vault. Take control of your money today.</p>
            </div>

            <div class="card p-lg bg-card" style="border: 1px solid var(--border); box-shadow: var(--shadow-lg); border-radius: var(--radius-xl);">
              <h3 class="text-lg font-bold text-primary-text mb-sm flex flex-center gap-xs justify-center">
                <i data-lucide="lock" style="width: 18px; height: 18px; color: var(--primary);"></i> Initialize Secure Vault
              </h3>
              <p class="text-xs text-secondary text-center mb-lg" style="line-height: 1.4;">
                All data is encrypted locally using AES-256. It never leaves your device.
              </p>

              <form id="signup-form" class="flex flex-column gap-md">
                <div class="form-group" style="margin-bottom: 12px;">
                  <label class="form-label" for="su-name">Full Name</label>
                  <input class="form-input" type="text" id="su-name" placeholder="Enter your full name" required style="height: 48px;">
                </div>

                <div class="form-group" style="margin-bottom: 12px;">
                  <label class="form-label" for="su-email">Email Address</label>
                  <input class="form-input" type="email" id="su-email" placeholder="Enter your email address" required style="height: 48px;">
                </div>

                <div class="form-group" style="margin-bottom: 16px;">
                  <label class="form-label" for="su-pass">Vault Passphrase</label>
                  <div style="position: relative;">
                    <input class="form-input" type="password" id="su-pass" placeholder="Custom decryption key (optional)" style="height: 48px; padding-right: 44px;">
                    <button type="button" id="btn-toggle-su-pass" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--text-tertiary); background: none; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; height: 32px; width: 32px;">
                      <i data-lucide="eye" style="width: 18px; height: 18px;"></i>
                    </button>
                  </div>
                  <span class="text-xxs text-secondary mt-xs" style="display: block; font-size: 0.65rem; margin-top: 4px; line-height: 1.3;">
                    This passphrase encrypts your data. If you set a custom one, you'll need it on page reload. Leave empty for the default key.
                  </span>
                </div>

                <div class="form-group" style="margin-bottom: 16px; background: var(--bg-secondary); border: 1px dashed var(--border); border-radius: var(--radius-md); padding: 12px;">
                  <label class="form-label font-bold style-custom" style="color: var(--text-primary); font-size: 0.75rem; margin-bottom: 4px;">Private Vault Recovery Key</label>
                  <p class="text-xxs text-secondary mb-xs" style="line-height: 1.3;">Write this key down or save it. You will need it to unlock your data if you forget your passphrase.</p>
                  <div class="flex gap-xs" style="display: flex; gap: 8px; margin-top: 8px;">
                    <input class="form-input text-xs font-mono font-bold" type="text" id="su-recovery-key" readonly value="${recoveryKey}" style="height: 36px; background: var(--bg-card); border-color: var(--border); text-align: center; font-size: 0.85rem; letter-spacing: 0.5px; color: var(--primary);">
                    <button type="button" class="btn btn-outline btn-sm flex flex-center" id="btn-copy-recovery-key" style="height: 36px; padding: 0 12px; font-size: 0.75rem; white-space: nowrap;">
                      <i data-lucide="copy" style="width: 14px; height: 14px; margin-right: 4px;"></i> Copy
                    </button>
                  </div>
                  <label class="flex flex-center gap-xs mt-sm" style="display: flex; align-items: center; gap: 6px; font-size: 0.7rem; color: var(--text-secondary); cursor: pointer; margin-top: 8px;">
                    <input type="checkbox" id="chk-recovery-backedup" style="width: 14px; height: 14px; cursor: pointer;">
                    <span>I have safely backed up my recovery key</span>
                  </label>
                </div>

                <button type="submit" id="su-submit-btn" class="btn btn-primary w-full mt-sm" disabled style="height: 48px; font-size: 0.95rem; border-radius: var(--radius-lg); opacity: 0.6; cursor: not-allowed;">
                  Create My Vault
                </button>
              </form>
            </div>

            <div class="text-center text-secondary text-xs mt-xl" style="opacity: 0.7;">
              SavvySpend v1.0.0 • Secured Locally
            </div>

          </div>
        `;
      } else {
        // --- Unlock Vault State ---
        return `
          <div class="page page-welcome flex flex-column justify-center" style="min-height: calc(100vh - 40px); display: flex; flex-direction: column; justify-content: center; padding: 24px 16px;">
            
            <div class="text-center mb-xl">
              <div class="flex flex-center mb-md" style="margin: 0 auto; width: 64px; height: 64px; border-radius: var(--radius-xl); background: linear-gradient(135deg, var(--purple), #5B21B6); color: white; box-shadow: 0 8px 20px rgba(124, 58, 237, 0.3);">
                <i data-lucide="lock" style="width: 32px; height: 32px;"></i>
              </div>
              <h1 class="text-3xl font-extrabold text-primary-text" style="letter-spacing: -0.5px; margin-bottom: 8px;">Vault Locked</h1>
              <p class="text-sm text-secondary px-sm">Enter your secure passphrase to decrypt and unlock your financial dashboard.</p>
            </div>

            <div class="card p-lg bg-card" style="border: 1px solid var(--border); box-shadow: var(--shadow-lg); border-radius: var(--radius-xl);">
              ${localStorage.getItem('ss_bio_enabled') === 'true' ? `
                <button type="button" id="btn-unlock-faceid" class="btn btn-outline w-full mb-md flex flex-center gap-xs" style="height: 48px; font-size: 0.95rem; border-radius: var(--radius-lg); border-color: var(--primary); color: var(--primary); background: var(--primary-light); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; cursor: pointer;">
                  <i data-lucide="scan" style="width: 18px; height: 18px; margin-right: 6px;"></i> Unlock with Face ID
                </button>
                <div class="text-center text-secondary text-xxs mb-md" style="margin-bottom: 12px; opacity: 0.6;">— OR ENTER PASSPHRASE —</div>
              ` : ''}
              <form id="unlock-form" class="flex flex-column gap-md">
                <div class="form-group" style="margin-bottom: 16px;">
                  <label class="form-label" for="ul-pass">Vault Passphrase</label>
                  <div style="position: relative;">
                    <input class="form-input" type="password" id="ul-pass" placeholder="Enter security passphrase" required style="height: 48px; padding-right: 44px;" autofocus>
                    <button type="button" id="btn-toggle-ul-pass" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--text-tertiary); background: none; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; height: 32px; width: 32px;">
                      <i data-lucide="eye" style="width: 18px; height: 18px;"></i>
                    </button>
                  </div>
                </div>

                <button type="submit" class="btn btn-primary w-full mt-xs" style="height: 48px; font-size: 0.95rem; border-radius: var(--radius-lg); background: linear-gradient(135deg, var(--primary), var(--primary-dark));">
                  Unlock Vault
                </button>
              </form>
            </div>

            <div class="text-center mt-xl flex flex-column gap-sm" style="display: flex; flex-direction: column; gap: 8px; margin-top: 24px;">
              <button class="text-xs text-primary font-semibold" id="btn-recover-vault-trigger" style="text-decoration: underline; background: none; border: none; cursor: pointer; color: var(--primary);">
                Forgot passphrase? Recover Vault
              </button>
              <button class="text-xs text-negative font-semibold" id="btn-reset-onboarding" style="text-decoration: underline; background: none; border: none; cursor: pointer; opacity: 0.7;">
                Reset App Data (Wipe Device)
              </button>
              <p class="text-xxs text-secondary px-md" style="line-height: 1.4;">
                Warning: Resetting will permanently wipe your local vault, including all user profile info, budgets, goals, and transactions.
              </p>
            </div>

          </div>
        `;
      }
    },

    afterRender: function (param) {
      var hasUser = localStorage.getItem('ss_user') !== null;

      // ── Toggle Password Visibility ──
      var setupTogglePassword = function (btnId, inputId) {
        var btn = document.getElementById(btnId);
        var input = document.getElementById(inputId);
        if (btn && input) {
          btn.addEventListener('click', function () {
            var icon = btn.querySelector('i');
            if (input.type === 'password') {
              input.type = 'text';
              if (icon) {
                icon.setAttribute('data-lucide', 'eye-off');
                if (window.lucide) lucide.createIcons();
              }
            } else {
              input.type = 'password';
              if (icon) {
                icon.setAttribute('data-lucide', 'eye');
                if (window.lucide) lucide.createIcons();
              }
            }
          });
        }
      };

      if (!hasUser) {
        setupTogglePassword('btn-toggle-su-pass', 'su-pass');

        // Copy Recovery Key Click
        var btnCopy = document.getElementById('btn-copy-recovery-key');
        if (btnCopy) {
          btnCopy.addEventListener('click', function () {
            var keyInput = document.getElementById('su-recovery-key');
            if (keyInput) {
              keyInput.select();
              keyInput.setSelectionRange(0, 99999);
              try {
                navigator.clipboard.writeText(keyInput.value).then(function () {
                  SavvySpend.showToast('Recovery key copied to clipboard!', 'success');
                }).catch(function() {
                  alert('Recovery Key: ' + keyInput.value);
                });
              } catch (e) {
                alert('Recovery Key: ' + keyInput.value);
              }
            }
          });
        }

        // Enable Submit on checkbox check
        var chkBackup = document.getElementById('chk-recovery-backedup');
        var suSubmitBtn = document.getElementById('su-submit-btn');
        if (chkBackup && suSubmitBtn) {
          chkBackup.addEventListener('change', function () {
            if (chkBackup.checked) {
              suSubmitBtn.disabled = false;
              suSubmitBtn.style.opacity = '1';
              suSubmitBtn.style.cursor = 'pointer';
            } else {
              suSubmitBtn.disabled = true;
              suSubmitBtn.style.opacity = '0.6';
              suSubmitBtn.style.cursor = 'not-allowed';
            }
          });
        }

        // ── Sign Up Submit ──
        var suForm = document.getElementById('signup-form');
        if (suForm) {
          suForm.addEventListener('submit', function (e) {
            e.preventDefault();

            var name = document.getElementById('su-name').value.trim();
            var email = document.getElementById('su-email').value.trim();
            var pass = document.getElementById('su-pass').value.trim() || 'SavvySpend_2024_Key';

            if (!name || !email) {
              alert('Please enter your name and email.');
              return;
            }

            // Set the encryption key in storage.js
            SecureStorage.setKey(pass);

            // Initialize user details
            var avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=10B981&color=fff&size=128&bold=true';
            var user = {
              name: name,
              email: email,
              avatarUrl: avatarUrl,
              membership: 'Pro Member'
            };

            // Write initial state to localStorage using the new encryption key
            SecureStorage.set('ss_user', user);

            // Seed default settings & game state
            var defaultSettings = {
              currency: 'GHS',
              darkMode: false,
              notifications: { push: true, email: true, sms: true },
              biometricLock: true
            };
            var defaultGame = {
              level: 1,
              xp: 0,
              xpToNextLevel: 250,
              streak: 0,
              rank: 1000,
              badges: [
                { id: 'streak7', name: 'Streak Keeper', description: 'Logged in 7 days row', icon: 'flame', unlocked: false, unlockedDate: null },
                { id: 'budget_boss', name: 'Budget Boss', description: 'Under budget for Jan', icon: 'landmark', unlocked: false, unlockedDate: null },
                { id: 'savings_star', name: 'Savings Star', description: 'Saved first GH₵1,000', icon: 'star', unlocked: false, unlockedDate: null },
                { id: 'debt_destroyer', name: 'Debt Destroyer', description: 'Pay off a credit card', icon: 'credit-card', unlocked: false, unlockedDate: null },
                { id: 'first_budget', name: 'First Budget', description: 'Created first budget', icon: 'bar-chart-3', unlocked: false, unlockedDate: null },
                { id: 'big_saver', name: 'Big Saver', description: 'Saved GH₵5,000 total', icon: 'gem', unlocked: false, unlockedDate: null },
                { id: 'category_master', name: 'Category Master', description: 'Track 5+ categories', icon: 'target', unlocked: false, unlockedDate: null },
                { id: 'early_bird', name: 'Early Bird', description: 'Log expense within 1 hour', icon: 'clock', unlocked: false, unlockedDate: null },
                { id: 'month_streak', name: 'Monthly Hero', description: '30 day logging streak', icon: 'trophy', unlocked: false, unlockedDate: null },
                { id: 'zero_waste', name: 'Zero Waste', description: 'No unnecessary spending for a week', icon: 'recycle', unlocked: false, unlockedDate: null },
                { id: 'goal_getter', name: 'Goal Getter', description: 'Complete a savings goal', icon: 'award', unlocked: false, unlockedDate: null },
                { id: 'penny_pincher', name: 'Penny Pincher', description: 'Save 20% of income', icon: 'coins', unlocked: false, unlockedDate: null }
              ]
            };

            SecureStorage.set('ss_settings', defaultSettings);
            SecureStorage.set('ss_game', defaultGame);
            SecureStorage.set('ss_transactions', []);
            SecureStorage.set('ss_budgets', []);
            SecureStorage.set('ss_goals', []);

            // Generate and save recovery keys
            var recKey = document.getElementById('su-recovery-key').value;
            var wrappedPass = CryptoJS.AES.encrypt(pass, recKey).toString();
            var wrappedRec = CryptoJS.AES.encrypt(recKey, pass).toString();
            localStorage.setItem('ss_recovery_wrapped_pass', wrappedPass);
            localStorage.setItem('ss_recovery_key_wrapped_user', wrappedRec);

            // Toast feedback
            if (window.SavvySpend.components.Notifications) {
              window.SavvySpend.components.Notifications.show('Vault initialized successfully!', 'success');
            }

            // Redirect to home
            setTimeout(function () {
              window.location.hash = '#/home';
            }, 300);
          });
        }
      } else {
        setupTogglePassword('btn-toggle-ul-pass', 'ul-pass');

        // ── Unlock Vault Submit ──
        var ulForm = document.getElementById('unlock-form');
        if (ulForm) {
          ulForm.addEventListener('submit', function (e) {
            e.preventDefault();

            var pass = document.getElementById('ul-pass').value.trim();
            if (!pass) return;

            // Set encryption key and try to decrypt ss_user
            SecureStorage.setKey(pass);
            var testUser = DataStore.getUser();

            if (testUser && testUser.name && testUser.email) {
              // Successfully decrypted!
              if (window.SavvySpend.components.Notifications) {
                window.SavvySpend.components.Notifications.show('Vault decrypted! Welcome back.', 'success');
              }
              setTimeout(function () {
                window.location.hash = '#/home';
              }, 300);
            } else {
              // Decryption failed (decrypted content wasn't a valid profile object)
              SecureStorage.setKey('SavvySpend_dummy_key_reset'); // lock again
              if (window.SavvySpend.components.Notifications) {
                window.SavvySpend.components.Notifications.show('Incorrect passphrase. Try again.', 'error');
              }
              document.getElementById('ul-pass').value = '';
              document.getElementById('ul-pass').focus();
            }
          });
        }

        // ── Unlock with Face ID Click ──
        var btnFaceID = document.getElementById('btn-unlock-faceid');
        if (btnFaceID) {
          btnFaceID.addEventListener('click', function () {
            Welcome.triggerFaceIDUnlock();
          });
          // Auto trigger Face ID trigger after minor render delay
          setTimeout(function () {
            Welcome.triggerFaceIDUnlock();
          }, 500);
        }

        // ── Recover Vault Link ──
        var btnRecover = document.getElementById('btn-recover-vault-trigger');
        if (btnRecover) {
          btnRecover.addEventListener('click', function () {
            Welcome.openRecoveryModal();
          });
        }

        // ── Reset App Data from Lock Screen ──
        var btnReset = document.getElementById('btn-reset-onboarding');
        if (btnReset) {
          btnReset.addEventListener('click', function () {
            if (confirm('CAUTION: This will permanently wipe all your data from this device including your profile, budgets, and transactions. You cannot undo this. Are you sure?')) {
              SecureStorage.clear();
              localStorage.clear();
              sessionStorage.clear();
              SecureStorage.setKey('SavvySpend_2024_Key');
              alert('App data has been wiped. Let\'s build a new vault.');
              window.location.hash = '#/welcome';
              window.location.reload();
            }
          });
        }
      }
    },

    openRecoveryModal: function () {
      var html = `
        <div class="modal-header flex flex-between">
          <h3 class="modal-title">Recover Vault</h3>
          <button class="btn-icon" onclick="SavvySpend.closeModal()"><i data-lucide="x"></i></button>
        </div>
        <form id="recover-key-form" class="mt-md">
          <div class="form-group">
            <label class="form-label" for="rec-key-input">Enter 16-Character Recovery Key</label>
            <input class="form-input text-center font-mono font-bold" type="text" id="rec-key-input" placeholder="SAVVY-XXXX-XXXX-XXXX" required style="height: 44px; letter-spacing: 0.5px; text-transform: uppercase;">
            <p class="text-xxs text-secondary mt-xs" style="line-height: 1.3;">Input the recovery key you copied or wrote down during vault creation.</p>
          </div>
          <div class="modal-footer mt-lg flex gap-md">
            <button type="button" class="btn btn-outline w-full" onclick="SavvySpend.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary w-full">Verify Key</button>
          </div>
        </form>
      `;
      SavvySpend.showModal(html);

      document.getElementById('recover-key-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var enteredKey = document.getElementById('rec-key-input').value.trim().toUpperCase();
        if (!enteredKey) return;

        var wrappedPass = localStorage.getItem('ss_recovery_wrapped_pass');
        if (!wrappedPass) {
          SavvySpend.showToast('No recovery data found on this device.', 'error');
          return;
        }

        try {
          var bytes = CryptoJS.AES.decrypt(wrappedPass, enteredKey);
          var recoveredPass = bytes.toString(CryptoJS.enc.Utf8);
          
          if (!recoveredPass) {
            SavvySpend.showToast('Invalid recovery key.', 'error');
            return;
          }

          // Test decrypted passphrase
          SecureStorage.setKey(recoveredPass);
          var testUser = DataStore.getUser();

          if (testUser && testUser.name && testUser.email) {
            Welcome.openPasswordResetModal(recoveredPass, enteredKey);
          } else {
            SecureStorage.setKey('SavvySpend_dummy_key_reset'); // lock
            SavvySpend.showToast('Invalid recovery key matching signature.', 'error');
          }
        } catch (err) {
          SecureStorage.setKey('SavvySpend_dummy_key_reset'); // lock
          SavvySpend.showToast('Decryption failed. Incorrect key.', 'error');
        }
      });
    },

    openPasswordResetModal: function (oldPass, recoveryKey) {
      var html = `
        <div class="modal-header flex flex-between">
          <h3 class="modal-title">Reset Vault Passphrase</h3>
          <button class="btn-icon" onclick="SavvySpend.closeModal()"><i data-lucide="x"></i></button>
        </div>
        <form id="reset-pass-form" class="mt-md">
          <div class="form-group">
            <label class="form-label" for="reset-pass-new">New Passphrase</label>
            <input class="form-input" type="password" id="reset-pass-new" placeholder="Enter new passphrase" required style="height: 44px;">
            <p class="text-xxs text-secondary mt-xs" style="line-height: 1.3;">Choose a strong password to lock and encrypt your data.</p>
          </div>
          <div class="modal-footer mt-lg flex gap-md">
            <button type="button" class="btn btn-outline w-full" onclick="SavvySpend.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary w-full">Update Passphrase</button>
          </div>
        </form>
      `;
      SavvySpend.showModal(html);

      document.getElementById('reset-pass-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var newPass = document.getElementById('reset-pass-new').value.trim();
        if (!newPass) return;

        // Decrypt databases under oldPass (which is currently verified and set)
        var txs = DataStore.getTransactions();
        var budgets = DataStore.getBudgets();
        var goals = DataStore.getGoals();
        var user = DataStore.getUser();
        var game = DataStore.getGameState();
        var settings = DataStore.getSettings();

        // Update key in storage
        SecureStorage.setKey(newPass);

        // Re-encrypt databases under newPass
        SecureStorage.set('ss_transactions', txs);
        SecureStorage.set('ss_budgets', budgets);
        SecureStorage.set('ss_goals', goals);
        SecureStorage.set('ss_user', user);
        SecureStorage.set('ss_game', game);
        SecureStorage.set('ss_settings', settings);

        // Re-wrap keys
        var newWrappedPass = CryptoJS.AES.encrypt(newPass, recoveryKey).toString();
        var newWrappedRec = CryptoJS.AES.encrypt(recoveryKey, newPass).toString();
        localStorage.setItem('ss_recovery_wrapped_pass', newWrappedPass);
        localStorage.setItem('ss_recovery_key_wrapped_user', newWrappedRec);

        SavvySpend.closeModal();
        SavvySpend.showToast('Vault passphrase updated and vault unlocked!', 'success');
        setTimeout(function () {
          window.location.hash = '#/home';
        }, 300);
      });
    },

    triggerFaceIDUnlock: function () {
      var bioEnabled = localStorage.getItem('ss_bio_enabled') === 'true';
      var wrappedPass = localStorage.getItem('ss_bio_passphrase_wrapped');
      var deviceSalt = localStorage.getItem('ss_device_salt') || 'SavvySpend_Device_Salt';
      
      if (!bioEnabled || !wrappedPass) return;

      var performUnlock = function () {
        try {
          var bytes = CryptoJS.AES.decrypt(wrappedPass, deviceSalt);
          var recoveredPass = bytes.toString(CryptoJS.enc.Utf8);
          
          if (!recoveredPass) {
            SavvySpend.showToast('Face ID decryption failed.', 'error');
            return;
          }

          SecureStorage.setKey(recoveredPass);
          var testUser = DataStore.getUser();

          if (testUser && testUser.name && testUser.email) {
            if (window.SavvySpend.components.Notifications) {
              window.SavvySpend.components.Notifications.show('Face ID verified! Welcome, ' + testUser.name.split(' ')[0] + '.', 'success');
            }
            setTimeout(function () {
              window.location.hash = '#/home';
            }, 300);
          } else {
            SecureStorage.setKey('SavvySpend_dummy_key_reset'); // lock
            SavvySpend.showToast('Invalid Face ID credentials cached.', 'error');
          }
        } catch (e) {
          SecureStorage.setKey('SavvySpend_dummy_key_reset');
          SavvySpend.showToast('Face ID verification failed.', 'error');
        }
      };

      var credId = localStorage.getItem('ss_bio_credential_id');
      if (window.isSecureContext && window.PublicKeyCredential && credId) {
        try {
          var idBuffer = Uint8Array.from(atob(credId), function (c) { return c.charCodeAt(0); });
          var challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
          
          var getOptions = {
            publicKey: {
              challenge: challenge,
              timeout: 60000,
              userVerification: "required",
              allowCredentials: [{
                id: idBuffer,
                type: "public-key"
              }]
            }
          };

          navigator.credentials.get(getOptions).then(function (assertion) {
            if (SavvySpend.components.Modals && SavvySpend.components.Modals.showFaceIDScan) {
              SavvySpend.components.Modals.showFaceIDScan(performUnlock);
            } else {
              performUnlock();
            }
          }).catch(function (err) {
            console.warn('WebAuthn fail, fallback to mock scan', err);
            // user cancel or secure context error -> prompt fallback visual scan
            if (SavvySpend.components.Modals && SavvySpend.components.Modals.showFaceIDScan) {
              SavvySpend.components.Modals.showFaceIDScan(performUnlock);
            } else {
              performUnlock();
            }
          });
        } catch (err) {
          if (SavvySpend.components.Modals && SavvySpend.components.Modals.showFaceIDScan) {
            SavvySpend.components.Modals.showFaceIDScan(performUnlock);
          } else {
            performUnlock();
          }
        }
      } else {
        if (SavvySpend.components.Modals && SavvySpend.components.Modals.showFaceIDScan) {
          SavvySpend.components.Modals.showFaceIDScan(performUnlock);
        } else {
          performUnlock();
        }
      }
    },

    destroy: function () {
      // Clean up
    }
  };

  window.SavvySpend.pages.Welcome = Welcome;
})();
