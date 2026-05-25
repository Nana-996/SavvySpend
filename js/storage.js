/**
 * SavvySpend — Encrypted Storage Layer
 * 
 * Provides AES-encrypted localStorage via CryptoJS.
 * Falls back to plain localStorage if CryptoJS is not available.
 */
(function () {
  'use strict';

  var _encryptionKey = 'SavvySpend_2024_Key';

  /**
   * Check whether CryptoJS is loaded and usable.
   */
  function _hasCrypto() {
    return (
      typeof CryptoJS !== 'undefined' &&
      CryptoJS.AES &&
      typeof CryptoJS.AES.encrypt === 'function' &&
      typeof CryptoJS.AES.decrypt === 'function'
    );
  }

  /**
   * Encrypt a string value.
   */
  function _encrypt(plainText) {
    if (!_hasCrypto()) return plainText;
    try {
      return CryptoJS.AES.encrypt(plainText, _encryptionKey).toString();
    } catch (e) {
      console.warn('[SecureStorage] Encryption failed, storing plain text.', e);
      return plainText;
    }
  }

  /**
   * Decrypt an encrypted string.
   */
  function _decrypt(cipherText) {
    if (!_hasCrypto()) return cipherText;
    try {
      var bytes = CryptoJS.AES.decrypt(cipherText, _encryptionKey);
      var decrypted = bytes.toString(CryptoJS.enc.Utf8);
      // If decryption returns an empty string the data was likely not encrypted
      if (!decrypted) return cipherText;
      return decrypted;
    } catch (e) {
      // Data may not be encrypted — return raw value
      console.warn('[SecureStorage] Decryption failed, returning raw value.', e);
      return cipherText;
    }
  }

  window.SecureStorage = {
    /**
     * Store a value (any serialisable type) under the given key.
     * The value is JSON-stringified, then AES-encrypted before being
     * written to localStorage.
     *
     * @param {string} key
     * @param {*} value
     */
    set: function (key, value) {
      try {
        var json = JSON.stringify(value);
        var encrypted = _encrypt(json);
        localStorage.setItem(key, encrypted);
      } catch (e) {
        console.error('[SecureStorage] set() failed for key "' + key + '":', e);
      }
    },

    /**
     * Retrieve and decrypt a stored value.
     * Returns the parsed object, or null if the key doesn't exist or
     * an error occurs.
     *
     * @param {string} key
     * @returns {*|null}
     */
    get: function (key) {
      try {
        var raw = localStorage.getItem(key);
        if (raw === null) return null;
        var decrypted = _decrypt(raw);
        return JSON.parse(decrypted);
      } catch (e) {
        console.error('[SecureStorage] get() failed for key "' + key + '":', e);
        return null;
      }
    },

    /**
     * Remove a single key from storage.
     *
     * @param {string} key
     */
    remove: function (key) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error('[SecureStorage] remove() failed for key "' + key + '":', e);
      }
    },

    /**
     * Clear all localStorage data.
     */
    clear: function () {
      try {
        localStorage.clear();
      } catch (e) {
        console.error('[SecureStorage] clear() failed:', e);
      }
    },

    /**
     * Change the encryption key used for future set/get calls.
     * NOTE: Existing stored data will NOT be re-encrypted. If you need
     * to migrate data, read it out before changing the key, then write
     * it back.
     *
     * @param {string} newKey
     */
    setKey: function (newKey) {
      if (typeof newKey === 'string' && newKey.length > 0) {
        _encryptionKey = newKey;
      } else {
        console.warn('[SecureStorage] setKey() requires a non-empty string.');
      }
    }
  };
})();
