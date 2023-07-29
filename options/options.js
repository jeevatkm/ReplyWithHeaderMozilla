/*
 * Copyright (c) Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at
 * https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE
 */
const PREF_PREFIX = "extensions.replywithheader.";

const homepageUrl = 'http://myjeeva.com/replywithheader-mozilla';
const reviewsPageUrl = 'https://addons.mozilla.org/en-US/thunderbird/addon/replywithheader/';
const issuesPageUrl = 'https://github.com/jeevatkm/ReplyWithHeaderMozilla/issues';
const btcAddress = '1FG6G5tCmFm7vrc7BzUyRxr3RBrMDJA6zp';
const paypalDonateUrl = 'https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=QWMZG74FW4QYC&lc=US&item_name=Jeevanandam%20M%2e&item_number=ReplyWithHeaderMozilla&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted';

// UI function to hide/show out option tabs.
function tablistClickHandler(elem) {
    let target = elem.target;

    if (target.parentNode.id != 'tablist') return false;

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
    window.alert("Opening PayPal Service. Thanks for supporting ReplyWithHeader.");
    browser.windows.openDefaultBrowser(paypalDonateUrl);
}

function copyBtcAddress() {
    navigator.clipboard.writeText(btcAddress);
    window.alert('BTC address is copied. Thanks for supporting ReplyWithHeader.');
}

function createOptionItem(v, l) {
    return new Option(l,v);
}

// https://stackoverflow.com/questions/3368837/list-every-font-a-users-browser-can-display
function listFonts() {
    let { fonts } = document;
    const it = fonts.entries();
  
    let arr = [];
    let done = false;
  
    while (!done) {
      const font = it.next();
      if (!font.done) {
        arr.push(font.value[0]);
      } else {
        done = font.done;
      }
    }
  
    return arr;
  }


async function loadFontFaces(prefElement) {
    let fonts = await browser.ReplyWithHeader.getInstalledFonts();

    for (let font of fonts) {
        prefElement.appendChild(createOptionItem(font,font));
    }
}

function loadFontSizes(prefElement) {
    for (let i = 7, j = 0; i < 35; i++, j++) {
        prefElement.appendChild(createOptionItem(i, i));
    }
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
    let value = await browser.LegacyPrefs.getPref(`${PREF_PREFIX}${name}`);
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
                case "header.font.size":
                    await loadFontSizes(prefElement);
                    break;
                case "header.font.face":
                    await loadFontFaces(prefElement);
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
            browser.LegacyPrefs.setPref(`${PREF_PREFIX}${name}`, !!prefElement.checked);
            break;
        case "radiogroup":
            let selectedElement = prefElement.querySelector(`input[type="radio"]:checked`)
            if (selectedElement) {
                browser.LegacyPrefs.setPref(`${PREF_PREFIX}${name}`, selectedElement.value);
            }
            break;
        case "SELECT":
        case "color":
            browser.LegacyPrefs.setPref(`${PREF_PREFIX}${name}`, prefElement.value);
            break;
    }
}

async function init() {
    const elementEventMap = {
        tablist: { type: "click", callback: tablistClickHandler },
        button_website: { type: "click", callback: () => browser.windows.openDefaultBrowser(homepageUrl) },
        button_review: { type: "click", callback: () => browser.windows.openDefaultBrowser(reviewsPageUrl) },
        button_issues: { type: "click", callback: () => browser.windows.openDefaultBrowser(issuesPageUrl) },
        button_paypal: { type: "click", callback: openPaypal },
        bitcoin_img: { type: "click", callback: copyBtcAddress },
        bitcoin_div: { type: "click", callback: copyBtcAddress }
    }

    for (let [elementId, eventData] of Object.entries(elementEventMap)) {
        document.getElementById(elementId).addEventListener(eventData.type, eventData.callback);
    }

    // Load preferences and attach onchange listeners for auto save.
    let prefElements = document.querySelectorAll("*[data-preference]");
    for (let prefElement of prefElements) {
        await loadPref(prefElement);
    }
}

window.addEventListener("load", init);
