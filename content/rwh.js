'use strict';

/*
 * Copyright (c) 2015 Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code is subject to terms of MIT License.
 * Please refer to LICENSE.txt in the root folder of RWH extension.
 * You download a copy of license at https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE.txt
 */

const { classes: RCc, interfaces: RCi, utils: RCu } = Components;

var ReplyWithHeader = {
    addonName: 'ReplyWithHeader',
    version: '1.0-beta',
    homepageUrl: '',
    feedbackPageUrl: '',
    issuesPageUrl: 'https://github.com/jeevatkm/ReplyWithHeaderMozilla/issues',
    btcAddress: '1FG6G5tCmFm7vrc7BzUyRxr3RBrMDJA6zp',
    paypalDonateUrl: 'https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=QWMZG74FW4QYC&lc=US&item_name=Jeevanandam%20M%2e&item_number=ReplyWithHeaderMozilla&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted',
    hdrCnt: 4,

    Log: {
        service: RCc['@mozilla.org/consoleservice;1'].getService(RCi.nsIConsoleService),

        rwhInfo: function() {
            var rInfo = ReplyWithHeader.addonName + ' ' + ReplyWithHeader.version
                + ' Loaded successfully.';
            this.service.logStringMessage(rInfo);
        },

        toConsole: function(l, m) {
            this.service.logStringMessage(ReplyWithHeader.timeNow + '\t' + l + '\tRWH\t' + m);
        },

        info: function(msg) {
            this.toConsole('INFO', msg);
        },

        debug: function(msg) {
            if (ReplyWithHeader.Prefs.debugEnabled) {
                this.toConsole('DEBUG', msg);
            }
        },

        error: function(msg) {
            this.toConsole('ERROR', msg);
        },

        warn: function(msg) {
            this.toConsole('WARN', msg);
        },

        errorWithException: function(msg, ex) {
            var stack = '';
            var group = 'chrome javascript';

            if (typeof ex.stack != 'undefined') {
                stack = ex.stack.replace('@', '\n  ');
            }

            var srcName = ex.fileName || '';
            var scriptError = RCc['@mozilla.org/scripterror;1'].createInstance(RCi.nsIScriptError);

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

    get isReply() {
        let mct = RCi.nsIMsgCompType;
        let ct = this.composeType;

        var reply = (ct == mct.Reply || ct == mct.ReplyAll || mct.ReplyToSender);
        ReplyWithHeader.Log.debug('isReply: ' + reply);

        return reply;
    },

    get isForward() {
        var forward = (ReplyWithHeader.composeType == RCi.nsIMsgCompType.ForwardInline);
        ReplyWithHeader.Log.debug('isForward: ' + forward);

        return forward;
    },

    get isOkayToMoveOn() {
        // Compose type have to be 1=Reply, 2=ReplyAll, 4=ForwardInline, 6=ReplyToSender then
        var isOkay = (this.isReply || this.isForward);
        ReplyWithHeader.Log.debug('isOkayToMoveOn: ' + isOkay);

        return isOkay;
    },

    get composeType() {
        // gComposeType can be used, will try later
        var ct = gMsgCompose.type;
        ReplyWithHeader.Log.debug('Message composeType: ' + ct);

        return ct;
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
                ReplyWithHeader.Log.errorWithException('Error occurred while getting selected message.', ex);
                return false;
            }
        }
        ReplyWithHeader.Log.debug('Message URI: ' + msgUri);

        return msgUri;
    },

    get isHtmlMail() {
        var isHtml = gMsgCompose.composeHTML;
        ReplyWithHeader.Log.debug('is HTML email ==> ' + isHtml);

        return gMsgCompose.composeHTML;
    },

    getMsgHeader: function(mUri) {
        try {
            let messengerService = gMessenger.messageServiceFromURI(mUri);
            return messengerService.messageURIToMsgHdr(mUri);
        } catch(ex) {
            ReplyWithHeader.Log.errorWithException('Unable to get message [' + mUri + ']', ex);
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

    escapeHtml: function(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },

    cleanEmail: function(str) {
        return (str || '').replace(/\\/g, '').replace(/\"/g, '');
    },

    parseHtml: function(hs) {
        var d = gMsgCompose.editor.document.createElement('div');
        d.innerHTML = hs;

        return d.firstChild;
    },

    prepareFromHdr: function(author) {
        ReplyWithHeader.Log.debug('prepareFromHdr()');
        ReplyWithHeader.Log.debug('Input: ' + author);

        /*
         * 0 = Default
         * 1 = Outlook Simple (From: Name)
         * 2 = Outlook Extended (From: Name [mailto:email-address])
         */
        let fromLblStyle = this.Prefs.getInt('extensions.replywithheader.header.from.style');

        author = this.cleanEmail(author);
        if (author && fromLblStyle != 0) {
            let ltCharIdx = author.indexOf('<');

            if (ltCharIdx != -1) {
                if (fromLblStyle == 1) {
                    author = author.substring(0, ltCharIdx);
                } else if (fromLblStyle == 2) {
                    author = author.replace('<', '[mailto:').replace('>', ']');
                }
            }
        }
        author = this.escapeHtml(author);
        ReplyWithHeader.Log.debug('Prepared From Header value: ' + author);

        return author.trim();
    },

    parseToCcEmailAddress: function(eid, st) {
        // handling only outlook
        if (st == 1) {
            let ltCharIdx = eid.indexOf('<');

            if (ltCharIdx != -1) {
                let teid = (eid.substring(0, ltCharIdx) || '').trim();

                if (teid) {
                    eid = teid;
                } else {
                    eid = eid.replace('<', '').replace('>', '');
                }
            }
        }

        return eid.trim();
    },

    prepareToCcHdr: function(recipients) {
        ReplyWithHeader.Log.debug('prepareToCcHdr()');
        ReplyWithHeader.Log.debug('Input: ' + recipients);

        /*
         * 0 = Default (To: Name1 <email-address1>, ...)
         * 1 = Outlook (To: Name1; Name2; ...)
         */
        let toccLblStyle = this.Prefs.getInt('extensions.replywithheader.header.tocc.style');
        recipients = this.cleanEmail(recipients);

        if (recipients && toccLblStyle == 1) {
            let fstCharIdx = recipients.indexOf('>, ');

            if (fstCharIdx == -1) {
                recipients = this.parseToCcEmailAddress(recipients, toccLblStyle);
            } else {
                let emlAdds = recipients.split('>, ');
                recipients = '';
                for (eml in emlAdds) {
                    recipients += '; ' + this.parseToCcEmailAddress(eml, toccLblStyle);
                }
            }
        }
        recipients = this.escapeHtml(recipients);
        ReplyWithHeader.Log.debug('Prepared To/Cc Header value: ' + recipients);

        return recipients.trim();
    },

    parseMsgHeader: function(hdr) {
        // Decoding values into object
        var header = { 'from': this.prepareFromHdr(hdr.mime2DecodedAuthor),
                     'to': this.prepareToCcHdr(hdr.mime2DecodedRecipients),
                     'cc': this.prepareToCcHdr(hdr.ccList),
                     'date': this.parseDate(hdr.date),
                     'subject': this.escapeHtml(hdr.mime2DecodedSubject) };

        ReplyWithHeader.Log.debug('\nFrom: ' + header.from
                                + '\nTo: ' + header.to
                                + '\nCC: '+ header.cc
                                + '\nSubject: ' + header.subject
                                + '\nDate: ' + header.date);

        return header;
    },

    get createRwhHeader() {
        let rawhdr = this.getMsgHeader(this.messageUri);
        let pheader = this.parseMsgHeader(rawhdr);

        var rwhHdr = '<div id="rwhMsgHeader">';

        // for HTML emails
        if (this.isHtmlMail) {
            let fontface = this.Prefs.getString('extensions.replywithheader.header.font.face');
            let fontsize = this.Prefs.getInt('extensions.replywithheader.header.font.size');
            ReplyWithHeader.Log.debug('Fontface: ' + fontface + '\tFontsize: ' + fontsize);

            let htmlTagPrefix = '<span style="margin: -1.3px 0 0 0 !important;"><font face="' + fontface + '" color="#000000" style="font: ' + fontsize + '.0px ' + fontface + '; color: #000000;">';
            rwhHdr += '<hr style="border:none;border-top:solid #B5C4DF 1.0pt;padding:0;margin:10px 0 5px 0;width:100%;">';
            rwhHdr += htmlTagPrefix + '<b>From:</b> ' + pheader.from + '</font></span><br/>';
            rwhHdr += htmlTagPrefix + '<b>Sent:</b> ' + pheader.date + '</font></span><br/>';
            rwhHdr += htmlTagPrefix + '<b>To:</b> '+ pheader.to + '</font></span><br/>';

            if (pheader.cc) {
                rwhHdr += htmlTagPrefix + '<b>Cc:</b> '+ pheader.cc + '</font></span><br/>';
                this.hdrCnt += 1;
            }

            rwhHdr += htmlTagPrefix + '<b>Subject:</b> '+ pheader.subject + '</font></span><br/>';
        } else { // for plain/text emails
            rwhHdr += this.isForward ? '<br>-------- Forwarded Message --------<br>' : '<br>-------- Original Message --------<br>';
            rwhHdr += 'From: ' + pheader.from + '<br/>';
            rwhHdr += 'Sent: ' + pheader.date + '<br/>';
            rwhHdr += 'To: '+ pheader.to + '<br/>';

            if (pheader.cc) {
                rwhHdr += 'Cc: '+ pheader.cc + '<br/>';
                this.hdrCnt += 1;
            }

            rwhHdr += 'Subject: '+ pheader.subject + '<br/><br/>';
        }

        rwhHdr += '</div>';

        return rwhHdr;
    },

    getByClassName: function(name) {
        return gMsgCompose.editor.rootElement.getElementsByClassName(name);
    },

    cleanBrTags: function(node) {
        ReplyWithHeader.Log.debug('Cleaning BR tag')

        var found = true;
        while(node && found) {
            let nextNode = node.nextSibling;
            if (node.nodeName && node.nodeName.toLowerCase() == 'br') {
                gMsgCompose.editor.deleteNode(node);
                node = nextNode;
                found = true;
            } else {
                found = false;
            }
        }
    },

    handleReplyMessage: function() {
        ReplyWithHeader.Log.debug('handleReplyMessage()');

        this.getByClassName('moz-cite-prefix')[0].innerHTML = this.createRwhHeader;
    },

    handleForwardMessage: function() {
        ReplyWithHeader.Log.warn('handleForwardMessage()');

        this.cleanBrTags(this.getByClassName('moz-forward-container')[0].firstChild);

        // Logically removing text node header elements
        ReplyWithHeader.Log.debug('Cleaning text node')
        gMsgCompose.editor.deleteNode(this.getByClassName('moz-forward-container')[0].firstChild);

        let hdrNode = this.parseHtml(this.createRwhHeader);

        if (this.isHtmlMail) {
            this.getByClassName('moz-forward-container')[0].replaceChild(hdrNode, this.getByClassName('moz-email-headers-table')[0]);
        } else {
            ReplyWithHeader.Log.debug('this.hdrCnt: ' + this.hdrCnt);

            // Logically removing forward header elements
            let lc = this.hdrCnt + 5;
            var i = 0;
            while(i < lc) {
                gMsgCompose.editor.deleteNode(this.getByClassName('moz-forward-container')[0].firstChild);
                i++;
            }

            this.getByClassName('moz-forward-container')[0].replaceChild(hdrNode, this.getByClassName('moz-forward-container')[0].firstChild);
        }
    },

    handOverToUser: function() {
        ReplyWithHeader.Log.debug('handOverToUser()');
        gMsgCompose.editor.resetModificationCount();

        if (!this.isForward) {
            ReplyWithHeader.Log.debug('gCurrentIdentity.replyOnTop: ' + gCurrentIdentity.replyOnTop);
            if (gCurrentIdentity.replyOnTop == 1) {
                gMsgCompose.editor.beginningOfDocument();
            } else {
                gMsgCompose.editor.endOfDocument();
            }
        }
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
        ReplyWithHeader.Log.debug('handleMailCompose()');
        /*
         * ReplyWithHeader has to be enabled; extensions.replywithheader.enable=true and
         * ReplyWithHeader.isOkayToMoveOn must return true
         * Addon comes into play :)
         */
        if (ReplyWithHeader.isEnabled && ReplyWithHeader.isOkayToMoveOn) {
            this.hdrCnt = 4;

            ReplyWithHeader.Log.debug('BEFORE:: ' + gMsgCompose.editor.rootElement.innerHTML);

            if (this.isForward) {
                this.handleForwardMessage();
            } else {
                this.handleReplyMessage();
            }

            this.handOverToUser();

            //log.debug('gCurrentIdentity.identityName==>' + gCurrentIdentity.identityName);

            ReplyWithHeader.Log.debug('BEFORE:: ' + gMsgCompose.editor.rootElement.innerHTML);
        } else {
            ReplyWithHeader.Log.info('ReplyWithHeader is not enabled, also message composeType is not supported.'
                     + '\n kindly enable it from Add-on Preferences.');
        }
    }
};
