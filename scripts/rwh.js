/*
 * Copyright (c) Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at
 * https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE
 */

// Expected to have "rwh" object exists
if (typeof rwh === 'undefined') {
  throw new Error('RWH mail extension encountered an unexpected error');
}

async function addListeners() {
  messenger.tabs.onCreated.addListener(async function(tab) {
    if (tab.status != 'complete') { return; }

    // get window and check the window type is "messageCompose"
    let mcWin = await messenger.windows.get(tab.windowId);
    if (mcWin && mcWin.type != 'messageCompose') { return; }

    rwh.log.debug('messenger.tabs.onCreated', tab, 'window', mcWin);

    await rwh.processCompose(tab, mcWin);

  });

  // messenger.tabs.onUpdated.addListener(async function(tabId, changeInfo, tab) {
  //   if (tab.status != 'complete' || changeInfo.status != 'complete') { return }

  //   // get window and check the window type is "messageCompose"
  //   let mcWin = await messenger.windows.get(tab.windowId);
  //   if (mcWin && mcWin.type != 'messageCompose') { return }

  //   console.log('tab onUpdated', tabId, changeInfo, tab);

  // });

  messenger.messageDisplay.onMessageDisplayed.addListener(async function(tab, message) {
    rwh.currentMessageTab = tab;
    rwh.currentMessageHeader = message;
  });

  // messenger.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  //   console.log('tab onRemoved', tabId, removeInfo);
  // });

  // messenger.windows.onRemoved.addListener(async (winId) => {
  //   if (winId <= 0) { return; }
  //   let rw = await messenger.windows.get(winId);
  //   console.log('window onRemoved', winId, 'rw', rw);
  // });
}

// RWH Initialize
async function init() {
  await initBase();
  await addListeners();

  // await addEventListeners();

  // let manifest = messenger.runtime.getManifest();
  rwh.log.info(`MailExtension v${rwh.runtime.version} loaded successfully`);
}

init().catch(console.error);


// 'use strict';

// /* globals ReplyWithHeader */

// // Registering RWH into compose window of Thunderbird - msgcomposeWindow
// window.addEventListener('compose-window-init', function() {
//   ReplyWithHeader.Prefs.fixCursorBlink();
//   ReplyWithHeader.init()
// }, true);
