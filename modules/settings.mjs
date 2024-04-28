/*
 * Copyright (c) Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at
 * https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE
 */

// RWH Settings Module

const optionsPrefix = 'extensions.replywithheader.';

async function get(key, fallback) {
  let fullKey = optionsPrefix + key;
  let obj = await messenger.storage.local.get(fullKey);
  console.debug(obj);

  let result = obj[fullKey];
  return result !== 'undefined' ? result : fallback;
}

async function set(key, value) {
  let fullKey = optionsPrefix + key;
  console.debug(fullKey, value);
  messenger.storage.local.set({ [fullKey]: value });
}

export { optionsPrefix, get, set };
