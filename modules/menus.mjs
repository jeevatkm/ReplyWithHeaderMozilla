/*
 * Copyright (c) Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at
 * https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE
 */

// RWH Menu Module

import * as rwhNotifications from './notifications.mjs';

async function register() {
    let rwhMenuId = await messenger.menus.create({
        title: "RWH",
        contexts: [
            "tools_menu"
        ],
    });

    await messenger.menus.create({
        title: "Options",
        parentId: rwhMenuId,
        onclick: async () => {
            let openingPage = messenger.runtime.openOptionsPage();
        }
    });

    await messenger.menus.create({
        title: "About",
        parentId: rwhMenuId,
        onclick: async () => {
            // let openingPage = messenger.runtime.openOptionsPage();
            // rwhNotifications.show('RWH', "this is test message of about from onclick");
        }
    });

    // Message Display Menu
    // let msgDisMenuId = await messenger.menus.create({
    //     title: "Options",
    //     contexts: [
    //         "all"
    //     ],
    //     onclick: async () => {
    //         messenger.notifications.create({
    //             "type": "basic",
    //             "iconUrl": "images/icon.png",
    //             "title": "RWH",
    //             "message": "hey msg display button"
    //         });
    //     }
    // });
}


export { register };