/*
 * Copyright (c) Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at
 * https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE
 */

// RWH Tabs Module

const tabListeners = {};

messenger.tabs.onCreated.addListener(async (tab) => {
    tabListeners[tab.type](tab);
});

async function findTab(messageId) {
    let tabs = await messenger.tabs.query();
    for (let tab of tabs) {
        let msg = await messenger.messageDisplay.getDisplayedMessage(tab.id);
        if (msg?.id == messageId) {
            return tab;
        }
    }
    return null;
}

async function register(tabType, listener) {
    if (tabListeners[tabType]) {
        console.warn(`Overwriting existing listener for ${tabType}`)
    }

    tabListeners[tabType] = listener;
}

export { register, findTab };