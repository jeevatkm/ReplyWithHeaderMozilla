/*
 * Copyright (c) Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at
 * https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE
 */

import * as rwhNotifications from '../modules/notifications.mjs';
import * as rwhSettings from '../modules/settings.mjs';

// const PREF_PREFIX = "extensions.replywithheader.";

const homepageUrl = 'http://myjeeva.com/replywithheader-mozilla';
const reviewsPageUrl = 'https://addons.mozilla.org/en-US/thunderbird/addon/replywithheader/';
const issuesPageUrl = 'https://github.com/jeevatkm/ReplyWithHeaderMozilla/issues';
const paypalDonateUrl = 'https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=QWMZG74FW4QYC&lc=US&item_name=Jeevanandam%20M%2e&item_number=ReplyWithHeaderMozilla&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted';

// UI function to hide/show out option tabs.
function tabListClickHandler(elem) {
    let target = elem.target;

    if (target.parentNode.id != 'tabList') return false;

    let selectedTab = document.querySelector('[aria-selected="true"]');
    selectedTab.setAttribute('aria-selected', false);
    target.setAttribute('aria-selected', true);

    let panels = document.querySelector('[aria-hidden="false"]');
    panels.setAttribute('aria-hidden', true);

    let panelId = target.getAttribute('aria-controls'),
        panel = document.getElementById(panelId);
    panel.setAttribute('aria-hidden', false);
}

function openPaypal() {
    rwhNotifications.show("Opening PayPal Donation Page. Thanks for supporting ReplyWithHeader.");
    messenger.windows.openDefaultBrowser(paypalDonateUrl);
}

function createOptionItem(v, l) {
    return new Option(l,v);
}

async function populateLocale(prefElement) {
    for (var lang in i18n.lang) {
        prefElement.appendChild(createOptionItem(
            lang, i18n.lang[lang] + ' (' + lang + ')'
        ));
    }
}
async function loadPref(prefElement) {
    let type = prefElement.dataset.type || prefElement.getAttribute("type") || prefElement.tagName;
    let name = prefElement.dataset.preference;
    let value = await rwhSettings.get(name, {});
    switch (type) {
        case "checkbox":
            prefElement.checked = value;
            prefElement.addEventListener("change", () => savePref(prefElement));
            break;
        case "radiogroup":
            let selectedElement = prefElement.querySelector(`input[type="radio"][value="${value}"]`)
            if (selectedElement) {
                selectedElement.checked = true;
            }
            for (let radio of prefElement.querySelectorAll(`input[type="radio"]`)) {
                radio.addEventListener("change", () => savePref(prefElement))
            }
            break;
        case "SELECT":
        case "color":
            switch (name) {
                case "header.locale":
                    await populateLocale(prefElement);
                    break;
            }
            prefElement.value = value;
            prefElement.addEventListener("change", () => savePref(prefElement))
            break;
    }
}

async function savePref(prefElement) {
    let type = prefElement.dataset.type || prefElement.getAttribute("type") || prefElement.tagName;
    let name = prefElement.dataset.preference;
    switch (type) {
        case "checkbox":
            rwhSettings.set(name, !!prefElement.checked);
            break;
        case "radiogroup":
            let selectedElement = prefElement.querySelector(`input[type="radio"]:checked`)
            if (selectedElement) {
                rwhSettings.set(name, selectedElement.value);
            }
            break;
        case "SELECT":
        case "color":
            rwhSettings.set(name, prefElement.value);
            break;
    }
}

// function storageChanged(changes, area) {
//     let changedItems = Object.keys(changes);
//     console.info(changedItems);
//     // for (let item of changedItems) {
//     //   if (area == userPrefStorageArea && item == "userPrefs") {
//     //     this._userPrefs = changes.userPrefs.newValue;
//     //   }

//     //   if (area == "local" && item == "defaultPrefs") {
//     //     this._defaultPrefs = changes.defaultPrefs.newValue;
//     //   }
//     // }
// }

async function init() {
    const elementEventMap = {
        tabList: { type: "click", callback: tabListClickHandler },
        buttonWebsite: { type: "click", callback: () => browser.windows.openDefaultBrowser(homepageUrl) },
        buttonReview: { type: "click", callback: () => browser.windows.openDefaultBrowser(reviewsPageUrl) },
        buttonIssues: { type: "click", callback: () => browser.windows.openDefaultBrowser(issuesPageUrl) },
        buttonPaypal: { type: "click", callback: openPaypal },
    }

    for (let [elementId, eventData] of Object.entries(elementEventMap)) {
        document.getElementById(elementId).addEventListener(eventData.type, eventData.callback);
    }

    // Load preferences and attach onchange listeners for auto save.
    let prefElements = document.querySelectorAll("*[data-preference]");
    for (let prefElement of prefElements) {
        await loadPref(prefElement);
    }

    // Add storage change listener.
    // if (!(await messenger.storage.onChanged.hasListener(storageChanged))) {
    //     await messenger.storage.onChanged.addListener(storageChanged);
    // }
}

window.addEventListener("load", init);
