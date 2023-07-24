/*
 * Copyright (c) Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at
 * https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE
 */

const PREF_PREFIX = "extensions.replywithheader.";

const PREF_DEFAULTS = {
  // RWH default preferences values
  "enable": true,

  // RWH Header
  "header.from.style": 2,
  "header.tocc.style": 1,
  "header.lblseq.style": 1,
  "header.locale": "en-US",
  "header.font.face": "Tahoma",
  "header.font.size": 13,
  "header.font.size.unit": "px",
  "header.font.color": "#000000",
  "header.separator.space.before": 1,
  "header.space.before": 0,
  "header.space.after": 1,
  "header.separator.line.size": 1,
  "header.separator.line.color": "#B5C4DF",
  //   "auto.select.lang": false,
  //   "auto.select.lang.regex.list": "",
  "trans.subject.prefix": false,
  //   "use.sender.date": false,
  //   "use.local.date.regex.list": "",

  // RWH Date & Time
  // 0 - Locale date format
  // 1 - International date format - UTC
  "header.date.format": 0,

  // RWH Date style
  // Full - ddd, MMM d, yyyy
  // ISO - yyyy-MM-dd
  //   "header.date.style": 0,

  // RWH Time style
  // 0 - 12 hours AM/PM
  // 1 - 24 hours
  "header.time.format": 0,

  // RWH Date header include timezone info
  "header.date.timezone": false,

  // RWH Mail message
  "clean.blockquote": true,
  "clean.new.blockquote": false,
  "clean.char.greaterthan": true,
  "clean.only.new.quote.char": false,
  "clean.pln.hdr.prefix": false,

  // RWH Debug settings
  "debug": false,
}

async function init () {
  for (let [name, value] of Object.entries(PREF_DEFAULTS)) {
    await browser.LegacyPrefs.setDefaultPref(`${PREF_PREFIX}${name}`, value);
  }
 
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

}
init();
