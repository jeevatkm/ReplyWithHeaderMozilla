'use strict';

/*
 * Copyright (c) 2015 Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code is subject to terms of MIT License.
 * Please refer to LICENSE.txt in the root folder of RWH extension.
 * You can download a copy of license at https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE.txt
 */

var EXPORTED_SYMBOLS = ['ReplyWithHeader'];

const RCc = Components.classes;
const RCi = Components.interfaces;
const RCu = Components.utils;

var ReplyWithHeader = {
    addonName: 'ReplyWithHeader',
    version: '1.3',
    homepageUrl: 'http://myjeeva.com/replywithheader-mozilla',
    reviewsPageUrl: 'https://addons.mozilla.org/en-US/thunderbird/addon/replywithheader/',
    issuesPageUrl: 'https://github.com/jeevatkm/ReplyWithHeaderMozilla/issues',
    btcAddress: '1FG6G5tCmFm7vrc7BzUyRxr3RBrMDJA6zp',
    paypalDonateUrl: 'https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=QWMZG74FW4QYC&lc=US&item_name=Jeevanandam%20M%2e&item_number=ReplyWithHeaderMozilla&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted',
    hdrCnt: 4,
    bqStyleStr: 'border:none !important; margin-left:0px !important; margin-right:0px !important; margin-top:0px !important; padding-left:0px !important; padding-right:0px !important',
    dateFormatString: 'ddd, MMM d, yyyy h:mm:ss a',
    Log: {
        conService: RCc['@mozilla.org/consoleservice;1'].getService(RCi.nsIConsoleService),

        rwhInfo: function() {
            var rInfo = ReplyWithHeader.addonName + ' ' + ReplyWithHeader.version
                + ' Loaded successfully.';
            this.conService.logStringMessage(rInfo);
        },

        toConsole: function(l, m) {
            this.conService.logStringMessage(ReplyWithHeader.timeNow + '\t' + l + '\tRWH\t' + m);
        },

        info: function(msg) {
            this.toConsole('INFO', msg);
        },

        debug: function(msg) {
            if (ReplyWithHeader.Prefs.isDebugEnabled) {
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
            this.conService.logMessage(scriptError);
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

        var reply = (ct == mct.Reply || ct == mct.ReplyAll || ct == mct.ReplyToSender) ? true : false;
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
        var isOkay = (this.isReply || this.isForward) ? true : false;
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

    get hostApp() {
        let appInfo = RCc['@mozilla.org/xre/app-info;1'].getService(RCi.nsIXULAppInfo);

        var app = '';
        if(appInfo.ID == '{3550f703-e582-4d05-9a08-453d09bdfdc6}') {
            app = 'Thunderbird';
        } else if(appInfo.ID == 'postbox@postbox-inc.com') {
            app = 'Postbox';
        }
        ReplyWithHeader.Log.debug('Host Application: ' + app);

        return app;
    },

    getMsgHeader: function(mUri) {
        try {
            // Ref: https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIMessenger
            let messengerService = gMessenger.messageServiceFromURI(mUri);

            // Ref: https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIMsgDBHdr
            return messengerService.messageURIToMsgHdr(mUri);
        } catch(ex) {
            ReplyWithHeader.Log.errorWithException('Unable to get message [' + mUri + ']', ex);
            return null;
        }
    },

    // Reference: https://gist.github.com/redoPop/3915761
    tzAbbr: function (dateInput) {
        var dateObject = dateInput || new Date(),
            dateString = dateObject + "",
            tzAbbr = (
                      // Works for the majority of modern browsers
                      dateString.match(/\(([^\)]+)\)$/) ||
                      // IE outputs date strings in a different format:
                      dateString.match(/([A-Z]+) [\d]{4}$/)
                     );
        if (tzAbbr) {
            // Old Firefox uses the long timezone name (e.g., "Central
            // Daylight Time" instead of "CDT")
            tzAbbr = tzAbbr[1].match(/[A-Z]/g).join("");
        }
        // Uncomment these lines to return a GMT offset for browsers
        // that don't include the user's zone abbreviation (e.g.,
        // "GMT-0500".) I prefer to have `null` in this case, but
        // you may not!
        // First seen on: http://stackoverflow.com/a/12496442
         if (!tzAbbr && /(GMT\W*\d{4}|GMT)/.test(dateString)) {
            return RegExp.$1;
         }
        return tzAbbr;
    },

    parseDate: function(prTime) {
        // Input is PR time
        let d = new Date(prTime / 1000);
        var nd = '';
        if (this.Prefs.dateFormat == 0) {
            ReplyWithHeader.Log.debug('Locale format');
            nd = DateFormat.format.date(d, this.dateFormatString) + ' ' + this.tzAbbr(d);
        } else {
            ReplyWithHeader.Log.debug('GMT format');
            var utc = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
            nd = DateFormat.format.date(utc, this.dateFormatString) + ' ' + this.tzAbbr(d.toUTCString());
        }

        return nd;
    },

    escapeHtml: function(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },

    cleanEmail: function(str) {
        return (str || '').replace(/\\/g, '').replace(/\"/g, '');
    },

    createBrTags: function(cnt) {
        var tags = '';
        for (let i=0; i<cnt; i++) {
            tags += '<br/>'
        }

        ReplyWithHeader.Log.debug('Created BRs:: ' + tags);
        return tags;
    },

    /**
     * Source: https://developer.mozilla.org/en-US/Add-ons/Overlay_Extensions/XUL_School/DOM_Building_and_HTML_Insertion#Safely_Using_Remote_HTML
     *
     * Safely parse an HTML fragment, removing any executable
     * JavaScript, and return a document fragment.
     *
     * @param {Document} doc The document in which to create the returned DOM tree.
     * @param {string} html The HTML fragment to parse.
     * @param {boolean} allowStyle If true, allow <style> nodes and
     *     style attributes in the parsed fragment. Gecko 14+ only.
     * @param {nsIURI} baseURI The base URI relative to which resource
     *     URLs should be processed. Note that this will not work for XML fragments.
     * @param {boolean} isXML If true, parse the fragment as XML.
     */
     parseFragment: function(doc, html, allowStyle, baseURI, isXML) {
        const PARSER_UTILS = '@mozilla.org/parserutils;1';

        // User the newer nsIParserUtils on versions that support it.
        if (PARSER_UTILS in Components.classes) {
            let parser = RCc[PARSER_UTILS].getService(RCi.nsIParserUtils);
            if ('parseFragment' in parser)
                return parser.parseFragment(html, allowStyle ? parser.SanitizerAllowStyle : 0,
                                            !!isXML, baseURI, doc.documentElement);
        }

        return RCc['@mozilla.org/feed-unescapehtml;1']
                         .getService(RCi.nsIScriptableUnescapeHTML)
                         .parseFragment(html, !!isXML, baseURI, doc.documentElement);
    },

    prepareFromHdr: function(author) {
        ReplyWithHeader.Log.debug('prepareFromHdr()');
        ReplyWithHeader.Log.debug('Input: ' + author);

        /*
         * 0 = Default
         * 1 = Outlook Simple (From: Name)
         * 2 = Outlook Extended (From: Name [mailto:email-address])
         */
        let fromLblStyle = this.Prefs.fromLabelStyle;

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
        let toccLblStyle = this.Prefs.toccLabelStyle;
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
        // Ref: https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIMsgDBHdr
        var header = { 'from': this.prepareFromHdr(hdr.mime2DecodedAuthor),
                     'to': this.prepareToCcHdr(hdr.mime2DecodedRecipients),
                     'cc': this.prepareToCcHdr(hdr.ccList),
                     'date': this.parseDate(hdr.date),
                     'subject': this.escapeHtml(hdr.mime2DecodedSubject) };

        // Cleanup numbers
        if (header.cc) {
            this.hdrCnt += 1;  // for Cc header
        }

        let replyTo = hdr.getStringProperty('replyTo').trim();
        ReplyWithHeader.Log.debug('ReplyTo:: ' + replyTo);
        if (replyTo) {
            this.hdrCnt += 1; // for reply-to header
        }

        ReplyWithHeader.Log.debug('\nFrom: ' + header.from
                                + '\nTo: ' + header.to
                                + '\nCC: '+ header.cc
                                + '\nSubject: ' + header.subject
                                + '\nDate: ' + header.date);

        return header;
    },

    get createRwhHeader() {
        let rawHdr = this.getMsgHeader(this.messageUri);
        let pHeader = this.parseMsgHeader(rawHdr);
        let headerQuotLblSeq = this.Prefs.headerQuotLblSeq;

        var rwhHdr = '<div id="rwhMsgHeader">';

        if (this.hostApp == 'Thunderbird') {
            let beforeSep = this.Prefs.beforeSepSpaceCnt;
            ReplyWithHeader.Log.debug('Before Separator Space: ' + beforeSep);
            rwhHdr += this.createBrTags(beforeSep);
        }

        // for HTML emails
        if (this.isHtmlMail) {
            let fontFace = this.Prefs.headerFontFace;
            let fontSize = this.Prefs.headerFontSize;
            let fontColor = this.Prefs.headerFontColor;
            ReplyWithHeader.Log.debug('Font face: ' + fontFace + '\tFont size: ' + fontSize + '\tColor: ' + fontColor);

            let htmlTagPrefix = '<span style="margin: -1.3px 0 0 0 !important;"><font face="' + fontFace + '" color="' + fontColor + '" style="font: ' + fontSize + 'px ' + fontFace + ' !important; color: ' + fontColor + ' !important;">';
            let htmlTagSuffix = '</font></span><br/>';

            rwhHdr += '<hr style="border:0;border-top:solid #B5C4DF 1.0pt;padding:0;margin:10px 0 5px 0;width:100%;">';

            let beforeHdr = this.Prefs.beforeHdrSpaceCnt;
            ReplyWithHeader.Log.debug('Before Header Space: ' + beforeHdr);
            rwhHdr += this.createBrTags(beforeHdr);

            rwhHdr += htmlTagPrefix + '<b>From:</b> ' + pHeader.from + htmlTagSuffix;

            if (headerQuotLblSeq == 0) {
                rwhHdr += htmlTagPrefix + '<b>Subject:</b> '+ pHeader.subject + htmlTagSuffix;
                rwhHdr += htmlTagPrefix + '<b>Date:</b> ' + pHeader.date + htmlTagSuffix;
                rwhHdr += htmlTagPrefix + '<b>To:</b> '+ pHeader.to + htmlTagSuffix;

                if (pHeader.cc) {
                    rwhHdr += htmlTagPrefix + '<b>Cc:</b> '+ pHeader.cc + htmlTagSuffix;
                }
            } else if (headerQuotLblSeq == 1) {
                rwhHdr += htmlTagPrefix + '<b>Sent:</b> ' + pHeader.date + htmlTagSuffix;
                rwhHdr += htmlTagPrefix + '<b>To:</b> '+ pHeader.to + htmlTagSuffix;

                if (pHeader.cc) {
                    rwhHdr += htmlTagPrefix + '<b>Cc:</b> '+ pHeader.cc + htmlTagSuffix;
                }

                rwhHdr += htmlTagPrefix + '<b>Subject:</b> '+ pHeader.subject + htmlTagSuffix;
            }

        } else { // for plain/text emails
            rwhHdr += this.isForward ? '<br/>-------- Forwarded Message --------<br/>' : '<br/>-------- Original Message --------<br/>';

            let beforeHdr = this.Prefs.beforeHdrSpaceCnt;
            ReplyWithHeader.Log.debug('Before Header Space: ' + beforeHdr);
            rwhHdr += this.createBrTags(beforeHdr);

            rwhHdr += 'From: ' + pHeader.from + '<br/>';

            if (headerQuotLblSeq == 0) {
                rwhHdr += 'Subject: '+ pHeader.subject + '<br/>';
                rwhHdr += 'Date: ' + pHeader.date + '<br/>';
                rwhHdr += 'To: '+ pHeader.to + '<br/>';

                if (pHeader.cc) {
                    rwhHdr += 'Cc: '+ pHeader.cc + '<br/>';
                }
            } else if (headerQuotLblSeq == 1) {
                rwhHdr += 'Sent: ' + pHeader.date + '<br/>';
                rwhHdr += 'To: '+ pHeader.to + '<br/>';

                if (pHeader.cc) {
                    rwhHdr += 'Cc: '+ pHeader.cc + '<br/>';
                }

                rwhHdr += 'Subject: '+ pHeader.subject + '<br/>';
            }

        }
        let afterHdr = this.Prefs.afterHdrSpaceCnt;
        ReplyWithHeader.Log.debug('After Header Space: ' + afterHdr);
        rwhHdr += this.createBrTags(afterHdr);

        rwhHdr += '</div>';

        ReplyWithHeader.Log.debug('RWH header html: ' + rwhHdr);

        return rwhHdr;
    },

    byId: function(id) {
        return document.getElementById(id);
    },

    byIdInMail: function(id) {
        return gMsgCompose.editor.document.getElementById(id);
    },

    byClassName: function(name) {
        return gMsgCompose.editor.rootElement.getElementsByClassName(name);
    },

    byTagName: function(name) {
        return gMsgCompose.editor.rootElement.getElementsByTagName(name);
    },

    getElement: function(name) {
        return this.byClassName(name)[0];
    },

    deleteNode: function(node) {
        gMsgCompose.editor.deleteNode(node);
    },

    cleanBrAfterRwhHeader: function() {
        ReplyWithHeader.Log.debug('cleanBrAfterRwhHeader()');

        let rwhHdr = this.byIdInMail('rwhMsgHeader');
        if (rwhHdr.nextSibling) {
            this.cleanEmptyTags(rwhHdr.nextSibling);
        } else if (rwhHdr.parentNode.nextSibling) {
            this.cleanEmptyTags(rwhHdr.parentNode.nextSibling);
        }

        let pbhr = this.getElement('__pbConvHr');
        if (pbhr) {
            pbhr.setAttribute('style', 'margin-top:0px !important;');
        }
    },

    cleanEmptyTags: function(node) {
        ReplyWithHeader.Log.debug('Cleaning consecutive Empty Tags');

        let toDelete = true;
        while (node && toDelete) {
            let nextNode = node.nextSibling;
            toDelete = false;
            switch (node.nodeType) { // Ref: https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
                case Node.ELEMENT_NODE:
                    if (node.nodeName && node.nodeName.toLowerCase() == 'br') {
                        toDelete = true;
                    }
                break;
                case Node.TEXT_NODE:
                    if (node.nodeValue == '\n' || node.nodeValue == '\r') {
                        toDelete = true;
                    }
            }

            if (toDelete) {
                ReplyWithHeader.Log.debug('Delete node: \t' + node.nodeName + '	' + node.nodeValue);
                this.deleteNode(node);
                node = nextNode;
            }
        }
    },

    handleReplyMessage: function() {
        ReplyWithHeader.Log.debug('handleReplyMessage()');

        let hdrNode;
        if (this.hostApp == 'Postbox') {
            hdrNode = this.getElement('__pbConvHr');
            if (!hdrNode) {
                let tags = this.byTagName('span');
                if (tags.length > 0) {
                    hdrNode = tags[0];
                }
            }
        } else {
            hdrNode = this.getElement('moz-cite-prefix');
        }

        if (!hdrNode) {
            ReplyWithHeader.Log.error('RWH is unable to insert headers, contact add-on author here - ' + this.issuesPageUrl);
            return;
        }

        while (hdrNode.firstChild) {
            hdrNode.removeChild(hdrNode.firstChild);
        }

        hdrNode.appendChild(this.parseFragment(gMsgCompose.editor.document, this.createRwhHeader, true));

        this.cleanBrAfterRwhHeader();
    },

    handleForwardMessage: function() {
        ReplyWithHeader.Log.debug('handleForwardMessage()');

        let hdrRwhNode = this.parseFragment(gMsgCompose.editor.document, this.createRwhHeader, true);
        if (this.hostApp == 'Postbox') {
            let hdrNode = this.getElement('__pbConvHr');
            if (!hdrNode) {
                hdrNode = this.getElement('moz-email-headers-table');
            }

            while (hdrNode.firstChild) {
                hdrNode.removeChild(hdrNode.firstChild);
            }

            let mBody = gMsgCompose.editor.rootElement;
            this.cleanEmptyTags(mBody.firstChild);

            // Logically removing text node header elements
            ReplyWithHeader.Log.debug('Cleaning text node')
            this.deleteNode(mBody.firstChild);

            if (hdrNode && this.isHtmlMail) {
                hdrNode.appendChild(hdrRwhNode);

                if (this.Prefs.beforeSepSpaceCnt == 0) {
                    for (let i=0; i<2; i++)
                        mBody.insertBefore(gMsgCompose.editor.document.createElement('br'), mBody.firstChild);
                }
            } else {
                ReplyWithHeader.Log.debug('hdrCnt: ' + this.hdrCnt);

                // Logically removing forward header elements
                let lc = (this.hdrCnt * 2) + 1; // for br's
                ReplyWithHeader.Log.debug('No of headers to cleanup (including BRs):: ' + lc);

                for(let i=0; i < lc; i++) {
                    this.deleteNode(mBody.firstChild);
                }

                mBody.replaceChild(hdrRwhNode, mBody.firstChild);

                if (this.Prefs.beforeSepSpaceCnt == 0) {
                    mBody.insertBefore(gMsgCompose.editor.document.createElement('br'), mBody.firstChild);
                }
            }
        } else { // For Thunderbird
            this.cleanEmptyTags(this.getElement('moz-forward-container').firstChild);

            // Logically removing text node header elements
            ReplyWithHeader.Log.debug('Cleaning text node')
            this.deleteNode(this.getElement('moz-forward-container').firstChild);

            if (this.isHtmlMail) {
                this.getElement('moz-forward-container').replaceChild(hdrRwhNode, this.getElement('moz-email-headers-table'));
            } else {
                ReplyWithHeader.Log.debug('hdrCnt: ' + this.hdrCnt);

                // Logically removing forward header elements
                let lc = (this.hdrCnt * 2) + 1; // for br's
                ReplyWithHeader.Log.debug('No of headers to cleanup (including BRs):: ' + lc);

                for(let i=0; i < lc; i++) {
                    this.deleteNode(this.getElement('moz-forward-container').firstChild);
                }

                this.getElement('moz-forward-container').replaceChild(hdrRwhNode, this.getElement('moz-forward-container').firstChild);
            }
        }

        this.cleanBrAfterRwhHeader();
    },

    handleSubjectPrefix: function() {
        let msgSubject = document.getElementById('msgSubject');

        if (this.isDefined(msgSubject)) {
            if (this.isReply){
                msgSubject.value = msgSubject.value.replace(/^Re:/, 'RE:');
            } else if (this.isForward) {
                msgSubject.value = msgSubject.value.replace(/^Fwd:/,'FW:');
            }
        }
    },

    handleBlockQuote: function() {
        ReplyWithHeader.Log.debug('handleBlockQuote()');
        let blockquotes = this.byTagName('blockquote');

        for (let i=0, len=blockquotes.length; i<len; i++) {
            blockquotes[i].setAttribute('style', this.bqStyleStr);
        }
    },

    handleGreaterThanChar: function() {
        ReplyWithHeader.Log.debug('handleGreaterThanChar()');
        let mailBody = gMsgCompose.editor.rootElement;  // alternate is gMsgCompose.editor.document.body

        if (mailBody) {
            // Here RWH does string find and replace.
            // No external creation of HTML string
            mailBody.innerHTML = mailBody.innerHTML.replace(/<br>(&gt;)+ ?/g, '<br />')
                                                   .replace(/(<\/?span [^>]+>)(&gt;)+ /g, '$1');
        }
    },

    handOverToUser: function() {
        ReplyWithHeader.Log.debug('handOverToUser()');
        gMsgCompose.editor.resetModificationCount();

        if (this.isReply) {
            let rot = gCurrentIdentity.replyOnTop;
            ReplyWithHeader.Log.debug('gCurrentIdentity.replyOnTop: ' + rot);

            if (rot == 1) {
                gMsgCompose.editor.beginningOfDocument();
            } else {
                gMsgCompose.editor.endOfDocument();
            }
        }
    },

    init: function() {
        ReplyWithHeader.Log.debug('init()');
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
         * Add-on comes into play :)
         */
        if (ReplyWithHeader.isEnabled && ReplyWithHeader.isOkayToMoveOn) {
            this.hdrCnt = 4; // From, To, Subject, Date

            //ReplyWithHeader.Log.debug('BEFORE Raw Source:: ' + gMsgCompose.editor.rootElement.innerHTML);

            if (this.isReply){
                this.handleReplyMessage();
            } else if (this.isForward) {
                this.handleForwardMessage();
            }

            if (this.Prefs.isSubjectPrefixEnabled) {
                this.handleSubjectPrefix();
            }

            if (this.Prefs.cleanBlockQuote) {
                this.handleBlockQuote()
            }

            if (this.Prefs.cleanGreaterThanChar) {
                this.handleGreaterThanChar();
            }

            this.handOverToUser();

            //ReplyWithHeader.Log.debug('AFTER Raw Source:: ' + gMsgCompose.editor.rootElement.innerHTML);
        } else {
            if (ReplyWithHeader.isEnabled) {
                if (this.composeType == 10 || this.composeType == 15) { // Resend=10, Redirect=15
                    ReplyWithHeader.Log.debug('Email composeType [' + this.composeType + '] is not supported.');
                }
            } else {
                ReplyWithHeader.Log.info('ReplyWithHeader is not enabled, you can enable it in the Add-On Preferences.');
            }
        }
    }
};
