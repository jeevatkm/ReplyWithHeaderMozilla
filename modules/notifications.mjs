/*
 * Copyright (c) Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at
 * https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE
 */

// RWH Notification Module

async function show(title, msg) {
    messenger.notifications.create({
        "type": "basic",
        "iconUrl": "images/rwh.png",
        "title": title,
        "message": msg
    });
}

export { show };
