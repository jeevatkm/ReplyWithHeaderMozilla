/*
 * Copyright (c) Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at
 * https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE
 */

import * as rwhMenus from './modules/menus.mjs';
import * as rwhCompose from './modules/compose.mjs';
import * as rwhTabs from './modules/tabs.mjs';
import * as rwhSettings from './modules/settings.mjs';

async function init() {

    rwhMenus.register();

    rwhTabs.register('messageCompose', async (tab) => {
        await rwhCompose.process(tab);
    });

    rwhSettings.setDefaults();
}

try {
    init();
    console.info('Addon loaded successfully');
} catch(e) {
    console.error(e);
}
