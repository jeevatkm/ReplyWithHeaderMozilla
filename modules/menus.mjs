/*
 * Copyright (c) Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at
 * https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE
 */

// RWH Menu Module

import * as rwhSettings from './settings.mjs';

let separatorIdCounter = 0;

export async function register() {
    let rwhMenuId = await messenger.menus.create({
        title: 'RWH',
        contexts: [
            'tools_menu'
        ],
    });

    await messenger.menus.create({
        title: 'Options',
        parentId: rwhMenuId,
        onclick: async () => {
            rwhSettings.set('options.ui.target.command', 'openHeadersTab');
            messenger.runtime.openOptionsPage();
        }
    });

    await messenger.menus.create({
        title: 'About',
        parentId: rwhMenuId,
        onclick: async () => {
            rwhSettings.set('options.ui.target.command', 'openAboutTab');
            messenger.runtime.openOptionsPage();
        }
    });

    await messenger.menus.create({
        id: `separator-${separatorIdCounter++}`,
        type: 'separator',
        parentId: rwhMenuId
    });

    await messenger.menus.create({
        title: 'Donate via PayPal',
        parentId: rwhMenuId,
        onclick: async () => {
            messenger.windows.openDefaultBrowser(rwhSettings.paypalDonateUrl);
        }
    });

    await messenger.menus.create({
        title: 'Sponsor via GitHub',
        parentId: rwhMenuId,
        onclick: async () => {
            messenger.windows.openDefaultBrowser(rwhSettings.gitHubSponsorUrl);
        }
    });
}
