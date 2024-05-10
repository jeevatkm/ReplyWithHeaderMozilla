/*
 * Copyright (c) Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at
 * https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE
 */

// RWH Settings Module

import { rwhLogger} from './logger.mjs';
import * as rwhUtils from './utils.mjs';

export const optionsPrefix = 'extensions.replywithheader.';
export const replySubjectPrefix = 'Re:';
export const forwardSubjectPrefix = 'Fwd:';
export const headerLabelSeqStyleSettings = {
    0: ['subject', 'date', 'from', 'to', 'cc', 'reply-to'], // Thunderbird
    1: ['from', 'date', 'to', 'cc', 'reply-to', 'subject'], // Outlook
    2: ['from', 'date', 'subject'],             // Simple
    3: ['from', 'to', 'cc', 'date', 'reply-to', 'subject']  // Lookout
}
export const homepageUrl = 'http://myjeeva.com/replywithheader-mozilla';
export const reviewsPageUrl = 'https://addons.mozilla.org/en-US/thunderbird/addon/replywithheader/';
export const issuesPageUrl = 'https://github.com/jeevatkm/ReplyWithHeaderMozilla/issues';
export const paypalDonateUrl = 'https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=QWMZG74FW4QYC&lc=US&item_name=Jeevanandam%20M%2e&item_number=ReplyWithHeaderMozilla&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted';
export const gitHubSponsorUrl = 'https://github.com/sponsors/jeevatkm?o=esb';

let keyHeaderLabelSeqStyle = 'header.label.seq.style';
let keyHeaderDateFormat = 'header.date.format';
let keyHeaderTimeFormat = 'header.time.format';
let keyHeaderTimeZone = 'header.date.timezone';
let keyHeaderLocale = 'header.locale';
let keyHeaderPlainPrefixText = 'header.plain.prefix.text';
let keyHeaderHtmlPrefixLine = 'header.html.prefix.line';
let keyHeaderHtmlPrefixLineColor = 'header.html.prefix.line.color';
let keyTransSubjectPrefix = 'trans.subject.prefix';
let keyCleanBlockQuoteColor = 'clean.blockquote.color';
let keyCleanQuoteCharGreaterThan = 'clean.quote.char.greaterthan';

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
    [keyHeaderDateFormat]: 0,

    // Time style
    // 0 - 12 hours AM/PM
    // 1 - 24 hours
    [keyHeaderTimeFormat]: 0,

    // Date header include timezone info
    [keyHeaderTimeZone]: true,

    [keyCleanBlockQuoteColor]: true,
    [keyCleanQuoteCharGreaterThan]: true,
}

export async function get(key, fallback) {
    let fullKey = optionsPrefix + key;
    let obj = await messenger.storage.local.get(fullKey);
    rwhLogger.debug(obj);

    if (rwhUtils.isObjectEmpty(obj)) {
        return null;
    }

    let result = obj[fullKey];
    return result !== 'undefined' ? result : fallback;
}

export async function set(key, value) {
    let fullKey = optionsPrefix + key;
    rwhLogger.debug(fullKey, value);
    messenger.storage.local.set({ [fullKey]: value });
}

export async function remove(key) {
    await messenger.storage.local.remove(optionsPrefix + key);
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

export async function getHeaderDateFormat() {
    return await getInt(keyHeaderDateFormat);
}

export async function getHeaderTimeFormat() {
    return await getInt(keyHeaderTimeFormat);
}

export async function isHeaderTimeZone() {
    return await get(keyHeaderTimeZone, rwhDefaultSettings[keyHeaderTimeZone]);
}

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

export async function isCleanBlockQuoteColor() {
    return await get(keyCleanBlockQuoteColor, rwhDefaultSettings[keyCleanBlockQuoteColor]);
}

export async function isCleanQuoteCharGreaterThan() {
    return await get(keyCleanQuoteCharGreaterThan, rwhDefaultSettings[keyCleanQuoteCharGreaterThan]);
}


//
// Unexported methods
//

async function setDefault(key, value) {
    let ev = await get(key);
    if (ev === null) {
        set(key, value);
    }
}
