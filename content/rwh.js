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

            // Addon generates this error, it is better to use warningFlag = 0x1
            scriptError.init(msg + '\n' + ex.message, srcName, stack, ex.lineNumber, 0, 0x1, group);
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

    get isEnabled() {
        var enabled = ReplyWithHeader.Prefs.getBool('extensions.replywithheader.enable');
        ReplyWithHeader.Log.debug('RWH isEnabled: ' + enabled);

        return enabled;
    },

    get isOkayToMoveOn() {
        // gComposeType can be used, will try later
        // Compose type have to be 1=Reply, 2=ReplyAll, 4=ForwardInline, 6=ReplyToSender then
        let mct = Ci.nsIMsgCompType;
        let ct = gMsgCompose.type;

        var isOkay = (ct == mct.Reply || ct == mct.ReplyAll || mct.ReplyToSender || mct.ForwardInline);
        ReplyWithHeader.Log.debug('isOkayToMoveOn: ' + isOkay);

        return isOkay;
    },

    get messageUri() {
        var msgUri = null;

        if (this.isDefined(gMsgCompose.originalMsgURI)) {
            msgUri = gMsgCompose.originalMsgURI;
        } else {
            ReplyWithHeader.Log.debug('gMsgCompose.originalMsgURI is not defined, fallback');
            let selectedURIs = GetSelectedMessages();
            try {
                msgUri = selectedURIs[0]; // only first message
            } catch(ex) {
                ReplyWithHeader.Log.error('Error occurred while getting selected message.', ex);
                return false;
            }
        }
        ReplyWithHeader.Log.debug('Original Message URI: ' + msgUri);

        return msgUri;
    },

    get isHtmlMail() {
        return gMsgCompose.composeHTML;
    },

    getMsgHeader: function(mUri) {
        try {
            // let messenger = Cc['@mozilla.org/messenger;1'].createInstance(Ci.nsIMessenger);
            let messengerService = gMessenger.messageServiceFromURI(mUri);
            return messengerService.messageURIToMsgHdr(mUri);
        } catch(ex) {
            ReplyWithHeader.Log.error('Unable to get message [' + mUri + ']', ex);
            return null;
        }
    },

    parseDate: function(prtime) {
        // Input is epoch time
        let d = new Date(prtime / 1000);

        var nd = d.toString();
        ReplyWithHeader.Log.debug('Parsed date: ' + nd);

        return nd;
    },

    parseMsgHeader: function(hdr) {
        // Decoding values into object
        var header = { 'from': hdr.mime2DecodedAuthor,
                     'to': hdr.mime2DecodedRecipients,
                     'cc': hdr.ccList,
                     'date': this.parseDate(hdr.date),
                     'subject': hdr.mime2DecodedSubject };

        ReplyWithHeader.Log.debug('\nFrom: ' + header.from
                                + '\nTo: ' + header.to
                                + '\nCC: '+ header.cc
                                + '\nSubject: ' + header.subject
                                + '\nDate: ' + header.date);

        return header;
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
        let log = ReplyWithHeader.Log;

        /*
         * ReplyWithHeader has to be enabled; extensions.replywithheader.enable=true and
         * Compose type have to be 1=Reply, 2=ReplyAll, 4=ForwardInline, 6=ReplyToSender then
         * Addon comes into play :)
         */
        if (ReplyWithHeader.isEnabled && ReplyWithHeader.isOkayToMoveOn) {
            log.debug('handleMailCompose()');

            log.debug(' gComposeType==> ' +  gComposeType + '\t gMsgCompose.type==> ' + gMsgCompose.type);

            //ReplyWithHeader.Log.debug(gMsgCompose.editor.rootElement.innerHTML);

            log.debug('is HTML email ==> ' + this.isHtmlMail);
            //log.debug('gCurrentIdentity.identityName==>' + gCurrentIdentity.identityName);

            var rawhdr = this.getMsgHeader(this.messageUri);
            var header = this.parseMsgHeader(rawhdr);

        } else {
            log.info('ReplyWithHeader is not enabled, also \n kindly enable it from Add-on Preferences.');
        }
    }
};
