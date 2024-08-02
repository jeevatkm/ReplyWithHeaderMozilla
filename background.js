/*
 * Copyright (c) Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at
 * https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE
 */

import { rwhLogger } from './modules/logger.mjs';
import * as rwhMenus from './modules/menus.mjs';
import * as rwhCompose from './modules/compose.mjs';
import * as rwhTabs from './modules/tabs.mjs';
import * as rwhSettings from './modules/settings.mjs';
import * as rwhAccounts from './modules/accounts.mjs';
import * as rwhI18n from './modules/headers-i18n.mjs';

messenger.runtime.onInstalled.addListener(async function (details) {
    // About 'details' argument
    // Refer here: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onInstalled
    rwhLogger.debug(details);
    let accounts = await rwhAccounts.all();
    rwhSettings.setAccountDefaults(accounts);
});

messenger.accounts.onCreated.addListener(async function (id, account) {
    rwhLogger.debug('onCreated', id, account);
    if (account.type === 'imap' || account.type === 'pop3') {
        rwhSettings.setDefault(`${id}.enabled`, true);
    }
});

messenger.accounts.onDeleted.addListener(async function (id) {
    rwhLogger.debug('onDeleted', id);
    rwhSettings.remove(`${id}.enabled`);
});

async function detectLocaleAndSetAsDefault() {
    let userSelected = await rwhSettings.isHeaderLocaleUserSelected();
    if (userSelected) {
        return;
    }

    let uiLocale = messenger.i18n.getUILanguage();
    let selected = rwhI18n.i18n.lang[uiLocale];
    let currentLocale = await rwhSettings.getHeaderLocale();
    rwhLogger.debug('currentLocale:', currentLocale, 'uiLocale:', uiLocale, 'selected:', selected);
    if (selected !== 'undefined' && currentLocale !== uiLocale) {
        await rwhSettings.set('header.locale', uiLocale);
    }
}

async function init() {
    await rwhSettings.setDefaults();

    await rwhMenus.register();

    rwhTabs.register('messageCompose', async (tab) => {
        await rwhCompose.process(tab);
    });

    await detectLocaleAndSetAsDefault();
}

try {
    init();
    rwhLogger.info('Addon loaded successfully');
} catch (e) {
    rwhLogger.error(e);
}
