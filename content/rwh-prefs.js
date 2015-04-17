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
        alert('Website');
    },

    openFeedback: function() {
        alert('Feedback');
    },

    openSupport: function() {
        alert('Support');
    }
};