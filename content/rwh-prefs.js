'use strict';

/*
 * Copyright (c) 2015 Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code is subject to terms of MIT License.
 * Please refer to LICENSE.txt in the root folder of RWH extension.
 * You can download a copy of license at https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE.txt
 */

ReplyWithHeader.Prefs = {
    service: RCc['@mozilla.org/preferences-service;1'].getService(RCi.nsIPrefBranch),

    getInt: function(p) {
        return this.service.getIntPref(p);
    },

    setInt: function(p, v) {
        return this.service.setIntPref(p, v);
    },

    getBool: function(p) {
        return this.service.getBoolPref(p);
    },

    setBool: function(p, v) {
        return this.service.setBoolPref(p, v);
    },

    setString: function(p, v) {
        return this.service.setCharPref(p, v);
    },

    getString: function(p) {
        return this.service.getCharPref(p);
    },

    get debugEnabled() {
        return this.getBool('extensions.replywithheader.debug');
    },

    get beforeSepSpaceCnt() {
        return (this.getInt('extensions.replywithheader.header.separator.space.before') || 1);
    },

    get beforeHdrSpaceCnt() {
        return (this.getInt('extensions.replywithheader.header.space.before') || 0);
    },

    get afterHdrSpaceCnt() {
        return (this.getInt('extensions.replywithheader.header.space.after') || 1);
    },

    get dateFormat() {
        return this.getString('extensions.replywithheader.header.date.format');
    },

    get headerFontFace() {
        return this.getString('extensions.replywithheader.header.font.face');
    },

    get headerFontSize() {
        return this.getInt('extensions.replywithheader.header.font.size');
    },

    openWebsite: function() {
        this.openUrlInDefaultBrowser(ReplyWithHeader.homepageUrl);
    },

    openReviews: function() {
        this.openUrlInDefaultBrowser(ReplyWithHeader.reviewsPageUrl);
    },

    reportIssues: function() {
        this.openUrlInDefaultBrowser(ReplyWithHeader.issuesPageUrl);
    },

    openPaypal: function() {
        this.showAlert('Opening PayPal Service. Thanks for supporting ReplyWithHeader.');
        this.openUrlInDefaultBrowser(ReplyWithHeader.paypalDonateUrl);
    },

    copyBtcAddress: function() {
        this.copyToClipboard(ReplyWithHeader.btcAddress);
        this.showAlert('BTC address is copied. Thanks for supporting ReplyWithHeader.');
    },

    copyToClipboard: function(str) {
        if (str) {
            let clipboardHelper = RCc['@mozilla.org/widget/clipboardhelper;1'].getService(RCi.nsIClipboardHelper);
            clipboardHelper.copyString(str);
        }
    },

    showAlert: function(str) {
        if (str) {
            let alertsService = RCc['@mozilla.org/alerts-service;1'].getService(RCi.nsIAlertsService);
            try {
                alertsService.showAlertNotification('chrome://replywithheader/skin/icon-64.png',
                                                    ReplyWithHeader.addonName, str, false, '', null, '');
            } catch(ex) {
                ReplyWithHeader.Log.errorWithException('Unable to show RWH notify alert.', ex);
            }
        }
    },

    openUrlInDefaultBrowser: function(url) {
        let messenger = RCc['@mozilla.org/messenger;1'].createInstance(RCi.nsIMessenger);
        try {
            messenger.launchExternalURL(url);
        } catch(ex) {
            ReplyWithHeader.Log.errorWithException('Unable to open RWH URL.', ex);
        }
    },

    fixCursorBlink: function() {
        // Ref: Due this Bug 567240 - Cursor does not blink when replying (https://bugzilla.mozilla.org/show_bug.cgi?id=567240)
        // RWH is setting this 'mail.compose.max_recycled_windows' value to 0
        let maxRecycledWindows = this.getInt('mail.compose.max_recycled_windows');
        if (maxRecycledWindows == 1) {
            ReplyWithHeader.Log.info('Setting "mail.compose.max_recycled_windows" value to 0');
            this.setInt('mail.compose.max_recycled_windows', 0);
        }
    },

    createMenuItem: function(v, l) {
        var menuItem = document.createElement('menuitem');
        menuItem.setAttribute('value', v);
        menuItem.setAttribute('label', l);
        return menuItem;
    },

    loadFontfaces: function() {
        let allFonts = RCc['@mozilla.org/gfx/fontenumerator;1']
                            .createInstance(RCi.nsIFontEnumerator).EnumerateAllFonts({});

        let hdrFontface = this.headerFontFace;
        ReplyWithHeader.Log.debug('Header Font Face: ' + hdrFontface);

        let menuPopup = document.createElement('menupopup');
        let selectedIdx = 0;

        for (var i=0; i<allFonts.length; i++) {
            if (allFonts[i] == hdrFontface) {
                selectedIdx = i;
            }
            menuPopup.appendChild(this.createMenuItem(allFonts[i], allFonts[i]));
        }

        let hdrFontfaceObj = ReplyWithHeader.byId('hdrFontface');
        hdrFontfaceObj.appendChild(menuPopup);
        hdrFontfaceObj.selectedIndex = selectedIdx;
    },

    loadFontSizes: function() {
        let hdrFontsize = this.headerFontSize;
        ReplyWithHeader.Log.debug('Header Font Size: ' + hdrFontsize);

        let menuPopup = document.createElement('menupopup');
        let selectedIdx = 0;

        for (var i=10, j=0; i<25; i++, j++) {
            if (i == hdrFontsize) {
                selectedIdx = j;
            }
            menuPopup.appendChild(this.createMenuItem(i, i + 'px'));
        }

        let hdrFontsizeObj = ReplyWithHeader.byId('hdrFontsize');
        hdrFontsizeObj.appendChild(menuPopup);
        hdrFontsizeObj.selectedIndex = selectedIdx;
    },

    init: function() {
        this.toggleRwh();

        // Assigning values
        ReplyWithHeader.byId('abtRwhCaption').value = ReplyWithHeader.addonName + ' ' + ReplyWithHeader.version;

        this.loadFontfaces();

        this.loadFontSizes();
    },

    toggleRwh: function() {
        let rwh = document.getElementById('enableRwh');

        if (rwh.checked) {
            this.toggle('lblFromAttribution', false);
            this.toggle('fromAttributionStyle', false);

            this.toggle('lblHeaderlabel', false);
            this.toggle('toccAttributionStyle', false);

            this.toggle('lblTypography', false);
            this.toggle('lblFontface', false);
            this.toggle('hdrFontface', false);
            this.toggle('lblFontsize', false);
            this.toggle('hdrFontsize', false);
        } else {
            this.toggle('lblFromAttribution', true);
            this.toggle('fromAttributionStyle', true);

            this.toggle('lblHeaderlabel', true);
            this.toggle('toccAttributionStyle', true);

            this.toggle('lblTypography', true);
            this.toggle('lblFontface', true);
            this.toggle('hdrFontface', true);
            this.toggle('lblFontsize', true);
            this.toggle('hdrFontsize', true);
        }
    },

    toggle: function(id, v) {
        ReplyWithHeader.byId(id).disabled = v;
    }
};