/*
 * Copyright (c) Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at
 * https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE
 */

// Import any needed modules.
var Services = globalThis.Services || ChromeUtils.import(
  "resource://gre/modules/Services.jsm"
).Services;

// Load an additional JavaScript file.
Services.scriptloader.loadSubScript('chrome://replywithheader/content/core.js', window, 'UTF-8');
Services.scriptloader.loadSubScript('chrome://replywithheader/content/prefs.js', window, 'UTF-8');
Services.scriptloader.loadSubScript('chrome://replywithheader/content/i18n.js', window, 'UTF-8');
// Services.scriptloader.loadSubScript('chrome://replywithheader/content/rwh-prefs.js', window, 'UTF-8');

function onLoad(activatedWhileWindowOpen) {
  // Registering RWH into compose window of Thunderbird - msgcomposeWindow
  window.addEventListener('compose-window-init', function() {
    window.ReplyWithHeader.Prefs.fixCursorBlink();
    window.ReplyWithHeader.init()
  }, true);
}

function onUnload(deactivatedWhileWindowOpen) {
  /* unused */
}