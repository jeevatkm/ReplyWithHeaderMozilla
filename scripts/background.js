/*
 * Copyright (c) Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at
 * https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE
 */

(async () => {
    // For preferences
    messenger.WindowListener.registerDefaultPrefs('defaults/preferences/rwh-defaults.js');

    // For chrome.manifest
    //  content replywithheader chrome/content/
    //  resource replywithheader chrome/
    messenger.WindowListener.registerChromeUrl([ 
        ['content',  'replywithheader', 'chrome/content/'],
        ['resource', 'replywithheader', 'chrome/']
    ]);

    // For manifest.json - legacy section
    //      "legacy": {
    //          "options": {
    //              "page": "chrome://replywithheader/content/rwh-prefs.xul"
    //          }
    //      },
    messenger.WindowListener.registerOptionsPage('chrome://replywithheader/content/rwh-prefs.xul');

    // For chrome.manifest
    //  # messengercompose.xul [MailCompose Window]
    //  overlay chrome://messenger/content/messengercompose/messengercompose.xul    chrome://replywithheader/content/messengerComposeOverlay.xul
    messenger.WindowListener.registerWindow(
        'chrome://messenger/content/messengercompose/messengercompose.xhtml',
        'chrome://replywithheader/content/messengercompose.js'
    );
    
    messenger.WindowListener.startListening();

})();
