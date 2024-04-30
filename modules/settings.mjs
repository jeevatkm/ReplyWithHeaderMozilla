/*
 * Copyright (c) Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at
 * https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE
 */

// RWH Settings Module

import * as rwhUtils from './utils.mjs';

export const optionsPrefix = 'extensions.replywithheader.';

export const headerLabelSeqStyleSettings = {
    0: ['subject', 'date', 'from', 'to', 'cc', 'reply-to'], // Thunderbird
    1: ['from', 'date', 'to', 'cc', 'reply-to', 'subject'], // Outlook
    2: ['from', 'date', 'subject'],             // Simple
    3: ['from', 'to', 'cc', 'date', 'reply-to', 'subject']  // Lookout
}

let keyHeaderLabelSeqStyle = 'header.label.seq.style';
// let keyHeaderDateFormat = 'header.date.format';
// let keyHeaderTimeFormat = 'header.time.format';
let keyHeaderLocale = 'header.locale';
let keyHeaderPlainPrefixText = 'header.plain.prefix.text';
let keyHeaderHtmlPrefixLine = 'header.html.prefix.line';
let keyHeaderHtmlPrefixLineColor = 'header.html.prefix.line.color';
let keyTransSubjectPrefix = 'trans.subject.prefix';

let rwhDefaultSettings = {
    // Refer above constant headerLabelSeqStyleSettings
    [keyHeaderLabelSeqStyle]: 1,

    [keyHeaderLocale]: "en-US",
    [keyHeaderPlainPrefixText]: true,
    [keyHeaderHtmlPrefixLine]: true,
    [keyHeaderHtmlPrefixLineColor]: "#B5C4DF",
    [keyTransSubjectPrefix]: true,

    // Date & Time
    // 0 - Locale date format
    // 1 - International date format - UTC
    // [keyHeaderDateFormat]: 0,

    // Date style
    // Full - ddd, MMM d, yyyy
    // ISO - yyyy-MM-dd
    //   "header.date.style": 0,

    // Time style
    // 0 - 12 hours AM/PM
    // 1 - 24 hours
    // [keyHeaderTimeFormat]: 0,

    // Date header include timezone info
    // "header.date.timezone": false,

    // Mail message
    //   "clean.blockquote": true,
    //   "clean.new.blockquote": false,
    //   "clean.char.greaterthan": true,
    //   "clean.only.new.quote.char": false,
}

export async function get(key, fallback) {
    let fullKey = optionsPrefix + key;
    let obj = await messenger.storage.local.get(fullKey);
    console.debug(obj);

    if (rwhUtils.isObjectEmpty(obj)) {
        return null;
    }

    let result = obj[fullKey];
    return result !== 'undefined' ? result : fallback;
}

export async function set(key, value) {
    let fullKey = optionsPrefix + key;
    console.debug(fullKey, value);
    messenger.storage.local.set({ [fullKey]: value });
}

export async function getInt(key) {
    let v = await get(key, rwhDefaultSettings[key]);
    return parseInt(v)
}

export async function setDefaults() {
    for (let [name, value] of Object.entries(rwhDefaultSettings)) {
        await setDefault(name, value);
    }
}

export async function getHeaderLabelSeqStyle() {
    return await getInt(keyHeaderLabelSeqStyle);
}

// export async function getHeaderDateFormat() {
//     return await getInt(keyHeaderDateFormat);
// }

// export async function getHeaderTimeFormat() {
//     return await getInt(keyHeaderTimeFormat);
// }

export async function getHeaderLocale() {
    return await get(keyHeaderLocale, rwhDefaultSettings[keyHeaderLocale]);
}

export async function isHeaderPlainPrefixText() {
    return await get(keyHeaderPlainPrefixText, rwhDefaultSettings[keyHeaderPlainPrefixText]);
}

export async function isHeaderHtmlPrefixLine() {
    return await get(keyHeaderHtmlPrefixLine, rwhDefaultSettings[keyHeaderHtmlPrefixLine]);
}

export async function getHeaderHtmlPrefixLineColor() {
    return await get(keyHeaderHtmlPrefixLineColor, rwhDefaultSettings[keyHeaderHtmlPrefixLineColor]);
}

export async function isTransSubjectPrefix() {
    return await get(keyTransSubjectPrefix, rwhDefaultSettings[keyTransSubjectPrefix]);
}


//
// Unexported methods
//

async function setDefault(key, value) {
    let ev = await get(key);
    if (ev == null) {
        set(key, value);
    }
}
