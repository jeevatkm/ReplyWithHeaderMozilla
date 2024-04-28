/*
 * Copyright (c) Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at
 * https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE
 */

import * as rwhMenus from './modules/menus.mjs';
import * as rwhCompose from './modules/compose.mjs';
import * as rwhTabs from './modules/tabs.mjs';
import * as rwhSettings from './modules/settings.mjs';

rwhMenus.register();

rwhTabs.register('messageCompose', async (tab) => {
    await rwhCompose.process(tab);
});


let rwhDefaultSettings = {
  // RWH Header
  "header.from.style": 2,
  "header.tocc.style": 1,
  "header.lblseq.style": 1,
  "header.locale": "en-US",
  "header.separator.line.color": "#B5C4DF",
  "trans.subject.prefix": true,

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
//   "clean.blockquote": true,
//   "clean.new.blockquote": false,
//   "clean.char.greaterthan": true,
//   "clean.only.new.quote.char": false,
  "clean.plain.header.prefix": false,
}

async function init () {
  for (let [name, value] of Object.entries(rwhDefaultSettings)) {
    await rwhSettings.set(name, value);
  }

}

init();

// console.log(messenger.runtime.getURL("scripts/compose.js"))

// await messenger.composeScripts.register({
//     js: [
//         { file: messenger.runtime.getURL("scripts/compose.js") }
//     ]
// });


// const tabCreated = async tab => {
//     // console.log(tab)

//     // No tab with a compose message?
//     if (tab.type !== 'messageCompose') return;

//     // Get the tab id
//     // const tabId = tab.id;

//     await rwhCompose.process(tab);

//     // Get the compose details of the message in the new created tab
//     const composeDetails = await messenger.compose.getComposeDetails(tabId);
//     console.log(composeDetails);

//     // Get only the needed information from the compose details
//     const {type, relatedMessageId} = composeDetails;

//     // Reply or forward message?
//     if (["reply", "forward"].includes(type)) {

//         // Get the orginal message
//         const relatedMessage = await messenger.messages.get(relatedMessageId);

//         // Get needed information to change the new compose message
//         const calculatedDetails = getCalulatedDetails(relatedMessage, type);

//         // Update the compose details according to the calculated details
//         await messenger.compose.setComposeDetails(tabId, calculatedDetails)

//     }

// }


// Listen for new created tabs
// messenger.tabs.onCreated.addListener(tabCreated);

// browser.tabs.executeScript({
//     file: "compose.js",
//     allFrames: true,
// });

// browser.composeAction.onClicked.addListener(async (tab) => {
//     // Get the existing message.
//     let details = await browser.compose.getComposeDetails(tab.id);
//     console.log(details);

// });

// const PREF_PREFIX = "extensions.replywithheader.";

// const PREF_DEFAULTS = {
//   // RWH default preferences values
//   "enable": true,

//   // RWH Header
//   "header.from.style": 2,
//   "header.tocc.style": 1,
//   "header.lblseq.style": 1,
//   "header.locale": "en-US",
//   "header.font.face": "Tahoma",
//   "header.system.font.face": false,
//   "header.font.size": 13,
//   "header.font.size.unit": "px",
//   "header.font.color": "#000000",
//   "header.system.font.color": false,
//   "header.separator.space.before": 1,
//   "header.space.before": 0,
//   "header.space.after": 1,
//   "header.separator.line.size": 1,
//   "header.separator.line.color": "#B5C4DF",
//   //   "auto.select.lang": false,
//   //   "auto.select.lang.regex.list": "",
//   "trans.subject.prefix": false,
//   //   "use.sender.date": false,
//   //   "use.local.date.regex.list": "",

//   // RWH Date & Time
//   // 0 - Locale date format
//   // 1 - International date format - UTC
//   "header.date.format": 0,

//   // RWH Date style
//   // Full - ddd, MMM d, yyyy
//   // ISO - yyyy-MM-dd
//   //   "header.date.style": 0,

//   // RWH Time style
//   // 0 - 12 hours AM/PM
//   // 1 - 24 hours
//   "header.time.format": 0,

//   // RWH Date header include timezone info
//   "header.date.timezone": false,

//   // RWH Mail message
//   "clean.blockquote": true,
//   "clean.new.blockquote": false,
//   "clean.char.greaterthan": true,
//   "clean.only.new.quote.char": false,
//   "clean.pln.hdr.prefix": false,

//   // RWH Debug settings
//   "debug": false,
// }

// async function init () {
//   for (let [name, value] of Object.entries(PREF_DEFAULTS)) {
//     await browser.LegacyPrefs.setDefaultPref(`${PREF_PREFIX}${name}`, value);
//   }

//   browser.tabs.onCreated.addListener(tab => {
//     browser.ReplyWithHeader.patchTab(tab.id);
//   });
// }

// init();

console.info('Addon loaded successfully');