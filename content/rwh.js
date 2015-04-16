'use strict';
const {classes: Cc, interfaces: Ci, utils: Cu} = Components;

var ReplyWithHeader = {
    addonName: 'ReplyWithHeader',
    version: '1.0',
    amoHomepage: '',
    supportPage: 'http://myjeeva.com/replywithheadermozilla',
    issuesPage: 'https://github.com/jeevatkm/ReplyWithHeaderMozilla/issues',

    Log: {
        service: Cc['@mozilla.org/consoleservice;1'].getService(Ci.nsIConsoleService),

        rwhInfo: function() {
            var rInfo = ReplyWithHeader.addonName + ' ' + ReplyWithHeader.version
                + ' Loaded successfully.';
            this.service.logStringMessage(rInfo);
        },

        info: function(msg) {
            this.service.logStringMessage(ReplyWithHeader.timeNow + '\tINFO\tRWH\t' + msg);
        },

        debug: function(msg) {
            if (ReplyWithHeader.Prefs.debugEnabled) {
                this.service.logStringMessage(ReplyWithHeader.timeNow + '\tDEBUG\tRWH\t' + msg);
            }
        },

        error: function(msg, ex) {
            var stack = '';
            var group = 'chrome javascript';

            if (typeof ex.stack != 'undefined') {
                stack = ex.stack.replace('@', '\n  ');
            }

            var srcName = ex.fileName || '';
            var scriptError = Cc['@mozilla.org/scripterror;1'].createInstance(Ci.nsIScriptError);
            scriptError.init(msg + '\n' + ex.message, srcName, stack, ex.lineNumber, 0, 0x0, group);
            this.service.logMessage(scriptError);
        }
    },

    get timeNow() {
        let d = new Date();
        return d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + '.' + d.getMilliseconds();
    },

    isDefined: function(o) {
        return !(typeof o === 'undefined');
    },

    get messageUri() {
        if (ReplyWithHeader.isDefined(gMsgCompose.originalMsgURI)) {
            return gMsgCompose.originalMsgURI;
        } else {
            ReplyWithHeader.Log.debug('gMsgCompose.originalMsgURI is not defined, fallback');
            let selectedURIs = GetSelectedMessages();
            try {
                return selectedURIs[0]; // only first message
            } catch(ex) {
                ReplyWithHeader.Log.error('Error occurred while getting selected message.', ex);
                return false;
            }
        }
    },

    get isHtmlMail() {
        return gMsgCompose.composeHTML;
    },

    initListener: function() {
        ReplyWithHeader.Log.debug('initListener()');
        gMsgCompose.RegisterStateListener(ReplyWithHeader.composeStateListener);
    },

    composeStateListener: {
        NotifyComposeFieldsReady: function() {},
        NotifyComposeBodyReady: function() {
            ReplyWithHeader.handleMailCompose();
        },
        ComposeProcessDone: function(aResult) {},
        SaveInFolderDone: function(folderURI) {}
    },

    handleMailCompose: function() {

    }
};
