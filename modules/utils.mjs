/*
 * Copyright (c) Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at
 * https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE
 */

// RWH Utilities Module

export function isObjectEmpty(objectName) {
    for (let prop in objectName) {
        if (objectName.hasOwnProperty(prop)) {
            return false;
        }
    }
    return true;
}

export function createDocumentFromString(htmlString) {
    return new DOMParser().parseFromString(htmlString, 'text/html')
}

export function createElementFromString(htmlString) {
    return createDocumentFromString(htmlString)?.body.firstElementChild;
}
