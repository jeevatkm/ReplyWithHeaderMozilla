/*
 * Copyright (c) Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at
 * https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE
 */

// RWH Account Module

export async function findIdByIdentityId(identityId) {
    let accounts = await messenger.accounts.list();
    for (let account of accounts) {
        for (let identity of account.identities) {
            if (identity.id === identityId) {
                return identity.accountId;
            }
        }
    }
    return null;
}

export async function all() {
    let accounts = await messenger.accounts.list();
    let res = [];
    for (let account of accounts) {
        if (account.type === 'none') { continue };
        res.push({
            'id': account.id,
            'name': account.name,
            'type': account.type
        });
    }
    return res;
}
