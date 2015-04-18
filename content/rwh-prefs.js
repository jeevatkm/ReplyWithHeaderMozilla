'use strict';

ReplyWithHeader.Prefs = {
    service: Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefBranch),

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

    openWebsite: function() {
        this.openUrlInDefaultBrowser(ReplyWithHeader.homepageUrl);
    },

    openFeedback: function() {
        this.openUrlInDefaultBrowser(ReplyWithHeader.feedbackPageUrl);
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
            let clipboardHelper = Cc['@mozilla.org/widget/clipboardhelper;1'].getService(Ci.nsIClipboardHelper);
            clipboardHelper.copyString(str);
        }
    },

    showAlert: function(str) {
        if (str) {
            let alertsService = Cc['@mozilla.org/alerts-service;1'].getService(Ci.nsIAlertsService);
            try {
                alertsService.showAlertNotification('chrome://replywithheader/skin/icon-64.png',
                                                    ReplyWithHeader.addonName, str, false, '', null, '');
            } catch(ex) {
                ReplyWithHeader.Log.errorWithException('Unable to show RWH notify alert.', ex);
            }
        }
    },

    openUrlInDefaultBrowser: function(url) {
        let messenger = Cc['@mozilla.org/messenger;1'].createInstance(Ci.nsIMessenger);
        try {
            messenger.launchExternalURL(url);
        } catch(ex) {
            ReplyWithHeader.Log.errorWithException('Unable to open RWH URL.', ex);
        }
    },

    init: function() {
        this.toggleRwh();

        document.getElementById('hdrFontsize').selectedIndex = 3;
    },

    toggleRwh: function() {
        let rwh = document.getElementById('enableRwh');

        if (rwh.checked) {
            this.toggle('lblFromAttribution', false);
            this.toggle('fromAttributionStyle', false);

            this.toggle('lblHeaderlabel', false);
            this.toggle('toccAttributionStyle', false);

            /*this.toggle('lblTypography', false);
            this.toggle('lblFontface', false);
            this.toggle('hdrFontface', false);
            this.toggle('lblFontsize', false);
            this.toggle('hdrFontsize', false); */
        } else {
            this.toggle('lblFromAttribution', true);
            this.toggle('fromAttributionStyle', true);

            this.toggle('lblHeaderlabel', true);
            this.toggle('toccAttributionStyle', true);

            /*this.toggle('lblTypography', true);
            this.toggle('lblFontface', true);
            this.toggle('hdrFontface', true);
            this.toggle('lblFontsize', true);
            this.toggle('hdrFontsize', true);*/
        }
    },

    toggle: function(id, v) {
        document.getElementById(id).disabled = v;
    }
};