'use strict';

/*
 * Copyright (c) Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at
 * https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE
 */

/* globals ReplyWithHeader */

// Registering RWH into compose window of Thunderbird/Postbox
window.setTimeout(function(){
  ReplyWithHeader.Prefs.migrate();
  ReplyWithHeader.Prefs.fixCursorBlink();

  document.getElementById('msgcomposeWindow')
              .addEventListener('compose-window-init', ReplyWithHeader.init, false);
},15);
