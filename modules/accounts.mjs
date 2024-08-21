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
    let accounts = await messenger.accounts.list(false);
    for (let account of accounts) {
        for (let identity of account.identities) {
            if (identity.id === identityId) {
                return identity.accountId;
            }
        }
    }
    return null;
}

export async function allIdentities() {
    let identities = await messenger.identities.list();
    let res = [];
    for (let identity of identities) {
        res.push({
            'id': identity.id,
            'email': identity.email,
        });
    }
    return res;
}
