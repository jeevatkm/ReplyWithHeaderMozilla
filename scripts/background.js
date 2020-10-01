/*
 * Copyright (c) Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at
 * https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE
 */

(async () => {

  messenger.WindowListener.registerDefaultPrefs("defaults/preferences/rwh-defaults.js");

  messenger.WindowListener.registerChromeUrl([
    ["content",  "replywithheader", "chrome/content/"],
    ["resource", "replywithheader", "skin/"]
  ]);

  messenger.WindowListener.registerOptionsPage("chrome://replywithheader/content/rwh-prefs.xhtml");

  messenger.WindowListener.registerWindow(
    "chrome://messenger/content/messengercompose/messengercompose.xhtml",
    "chrome://replywithheader/content/scripts/messengercompose.js"
  );

  messenger.WindowListener.startListening();

})()