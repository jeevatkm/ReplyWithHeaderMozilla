'use strict';

/*
 * Copyright (c) 2015-2018 Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code is subject to terms of MIT License.
 * Please refer to LICENSE.txt in the root folder of RWH extension.
 * You can download a copy of license at https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE.txt
 */

/* globals ReplyWithHeader */

// Registering RWH into compose window of Thunderbird/Postbox
window.setTimeout(function(){
  ReplyWithHeader.Prefs.fixCursorBlink();

  document.getElementById('msgcomposeWindow')
              .addEventListener('compose-window-init', ReplyWithHeader.init, false);
},15);
