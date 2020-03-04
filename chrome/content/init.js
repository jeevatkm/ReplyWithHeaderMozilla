/*
 * Copyright (c) Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at
 * https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE
 */

'use strict';

/* globals ReplyWithHeader */

// Registering RWH into compose window of Thunderbird - msgcomposeWindow
window.addEventListener('compose-window-init', function() { 
  ReplyWithHeader.Prefs.fixCursorBlink();
  ReplyWithHeader.init()
}, true);