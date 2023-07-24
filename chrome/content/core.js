/*
 * Copyright (c) Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at
 * https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE
 */

'use strict';

var EXPORTED_SYMBOLS = ['ReplyWithHeader'];

var { XPCOMUtils } = ChromeUtils.import('resource://gre/modules/XPCOMUtils.jsm');
var { AddonManager } = ChromeUtils.import('resource://gre/modules/AddonManager.jsm');
var { rwhlog } = ChromeUtils.import('chrome://replywithheader/content/log.jsm');
var { rwhhost } = ChromeUtils.import('chrome://replywithheader/content/host.jsm');
var { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");

// ReplyWithHeader Add-On ID
const ReplyWithHeaderAddOnID = 'replywithheader@myjeeva.com';

var ReplyWithHeader = {
  addOnName: '',
  addOnVersion: '',
  homepageUrl: 'http://myjeeva.com/replywithheader-mozilla',
  reviewsPageUrl: 'https://addons.mozilla.org/en-US/thunderbird/addon/replywithheader/',
  issuesPageUrl: 'https://github.com/jeevatkm/ReplyWithHeaderMozilla/issues',
  btcAddress: '1FG6G5tCmFm7vrc7BzUyRxr3RBrMDJA6zp',
  paypalDonateUrl: 'https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=QWMZG74FW4QYC&lc=US&item_name=Jeevanandam%20M%2e&item_number=ReplyWithHeaderMozilla&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted',
  hdrCnt: 4,
  bqStyleStr: 'border:none !important; margin-left:0px !important; margin-right:0px !important; margin-top:0px !important; padding-left:0px !important; padding-right:0px !important',

  get isReply() {
    let mct = Ci.nsIMsgCompType;
    let ct = this.composeType;

    return (ct == mct.Reply || ct == mct.ReplyAll || ct == mct.ReplyToSender);
  },

  get isForward() {
    return (this.composeType == Ci.nsIMsgCompType.ForwardInline);
  },

  get isOkayToMoveOn() {
    // Compose type have to be 1=Reply, 2=ReplyAll, 4=ForwardInline, 6=ReplyToSender
    // then okay to move on
    return (this.isReply || this.isForward);
  },

  get composeType() {
    // gComposeType can be used, will try later
    return gMsgCompose.type;
  },

  get messageUri() {
    var msgUri = null;

    if (this.isDefined(gMsgCompose.originalMsgURI)) {
      msgUri = gMsgCompose.originalMsgURI;
    } else {
      rwhlog.debug('gMsgCompose.originalMsgURI is not defined, fallback');
      let selectedURIs = GetSelectedMessages();
      try {
        msgUri = selectedURIs[0]; // only first message
      } catch (ex) {
        rwhlog.errorWithException('Error occurred while getting selected message.', ex);
        return false;
      }
    }
    rwhlog.debug('Message URI: ' + msgUri);

    return msgUri;
  },

  get isHtmlMail() {
    return gMsgCompose.composeHTML;
  },

  // This is applicable only to HTML emails
  get isSignaturePresent() {
    let rootElement = gMsgCompose.editor.rootElement;

    let sigOnBtm = gCurrentIdentity.getBoolAttribute('sig_bottom');
    let sigOnFwd = gCurrentIdentity.getBoolAttribute('sig_on_fwd');
    let sigOnReply = gCurrentIdentity.getBoolAttribute('sig_on_reply');
    let found = false;

    if (sigOnBtm) {
      rwhlog.debug('Signature settings: inserts after the quote');
      for (let i = rootElement.childNodes.length - 1; i >= 0; i--) {
        let el = rootElement.childNodes[i];

        rwhlog.debug('Element node type: ' + el.nodeType);
        if (el.nodeType != 1) { // check is it Node.ELEMENT_NODE
          continue;
        }

        if (this.contains(el.getAttribute('class'), 'moz-signature')) {
          found = true;
          break;
        }

        if (el.nodeName.toLowerCase() == 'blockquote') {
          rwhlog.debug('Signature not exists');
          break;
        }
      }
    } else {
      rwhlog.debug('Signature settings: inserts above the quote');
      for (let i = 0; i < rootElement.childNodes.length; i++) {
        let el = rootElement.childNodes[i];

        if (el.nodeType != 1) { // check is it Node.ELEMENT_NODE
          continue;
        }

        if (this.contains(el.getAttribute('class'), 'moz-signature')) {
          found = true;
          break;
        }

        if (el.nodeName.toLowerCase() == 'blockquote') {
          rwhlog.debug('Signature not exists');
          break;
        }
      }
    }

    return ((sigOnFwd || sigOnReply) && found);
  },

  isDefined: function(o) {
    let defined = (typeof o === 'undefined');
    return !defined;
  },

  contains: function(str, srch) {
    if (str && srch && str.toLowerCase().indexOf(srch.toLowerCase()) > -1) {
      return true;
    }
    return false;
  },

  getMsgHeader: function(mUri) {
    try {
      let messengerService = MailServices.messageServiceFromURI(mUri);

      // Ref: https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIMsgDBHdr
      return messengerService.messageURIToMsgHdr(mUri);
    } catch (ex) {
      rwhlog.errorWithException('Unable to get message [' + mUri + ']', ex);
      return null;
    }
  },

  parseDate: function(prTime) {
    let locale = this.Prefs.headerLocale;
    let dateFormat = this.Prefs.headerDateFormat;
    let timeFormat = this.Prefs.headerTimeFormat;
    let includeTimezone = this.Prefs.headerIncludeTimeZone;

    rwhlog.debug('Date format: ' + (dateFormat == 1 ? 'UTC' : 'Locale (' + locale + ')')
                 + ', Time format: ' + (timeFormat == 1 ? '24-hour' : '12-hour')
                 + (includeTimezone ? ', Include short timezone info' : ''))

    // Input is PR time
    let d = new Date(prTime / 1000);
    let options = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'};

    if (dateFormat == 1) { // Locale date format
      options.timeZone = 'UTC';
      options.timeZoneName = 'short';
    }

    if (timeFormat == 1) {
      options.hour12 = false;
    } else {
      options.hour12 = true;
    }

    if (includeTimezone) {
      options.timeZoneName = 'short';
    }

    let ds = new Intl.DateTimeFormat(locale, options).format(d);
    ds = ds.replace(/GMT/, 'UTC');
    return ds;
  },

  escapeHtml: function(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  },

  cleanEmail: function(str) {
    return (str || '').replace(/\\/g, '').replace(/\"/g, '');
  },

  createBrTags: function(cnt) {
    var tags = '';
    for (let i = 0; i < cnt; i++) {
      tags += '<br />';
    }

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
    if (this.parser) {
      return this.parser.parseFragment(html, allowStyle ? this.parser.SanitizerAllowStyle : 0, !!isXML, baseURI, doc.documentElement);
    }

    return this.legacyParser.parseFragment(html, !!isXML, baseURI, doc.documentElement);
  },

  prepareFromHdr: function(author) {
    /*
     * 0 = Default
     * 1 = Outlook Simple (From: Name)
     * 2 = Outlook Extended (From: Name [mailto:email-address])
     */
    let fromLblStyle = this.Prefs.fromLabelStyle;

    author = this.cleanEmail(author);
    if (author && fromLblStyle != 0) { // jshint ignore:line
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
      } else if (fstCharIdx > 0) {
        let emlAdds = recipients.split('>, ');

        let recipientList = [];
        for (let i = 0; i < emlAdds.length; i++) {
          recipientList.push(this.parseToCcEmailAddress(emlAdds[i], toccLblStyle));
        }

        recipients = recipientList.join('; ');
      }
    }

    recipients = this.escapeHtml(recipients);

    return recipients.trim();
  },

  parseMsgHeader: function(hdr) {
    // Decoding values into object
    // Ref: https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIMsgDBHdr
    var header = {
      'from': this.prepareFromHdr(hdr.mime2DecodedAuthor),
      'to': this.prepareToCcHdr(hdr.mime2DecodedRecipients),
      'cc': this.prepareToCcHdr(this.decodeMime(hdr.ccList)),
      'date': this.parseDate(hdr.date),
      'subject': this.escapeHtml(hdr.mime2DecodedSubject)
    };

    // Cleanup numbers
    if (header.cc) {
      this.hdrCnt += 1; // for Cc header
    }

    rwhlog.debug('From: ' + header.from);
    rwhlog.debug('To: ' + header.to);
    rwhlog.debug('Cc: ' + header.cc);
    rwhlog.debug('Subject: ' + header.subject);
    rwhlog.debug('Date: ' + header.date);

    return header;
  },

  get createRwhHeader() {
    let locale = this.Prefs.headerLocale;
    let rawHdr = this.getMsgHeader(this.messageUri);
    let pHeader = this.parseMsgHeader(rawHdr);
    let headerQuotLblSeq = this.Prefs.headerQuotLblSeq;

    var rwhHdr = '<div id="rwhMsgHeader">';

    if (rwhhost.isThunderbird) {
      rwhHdr += this.createBrTags(this.Prefs.beforeSepSpaceCnt);
    }

    // for HTML emails
    if (this.isHtmlMail) {
      let fontFace = this.Prefs.headerFontFace;
      let fontSize = this.Prefs.headerFontSize;
      let fontSizeUnit = this.Prefs.headerFontSizeUnit;
      let fontColor = this.Prefs.headerFontColor;
      rwhlog.debug('Font face: ' + fontFace + '\tFont size: ' + fontSize + fontSizeUnit + '\tColor: ' + fontColor);

      let htmlTagPrefix = '<div style="font-family:' + fontFace + ' !important; color:'
        + fontColor + ' !important; font-size:' + fontSize + fontSizeUnit + ' !important;">';
      let htmlTagSuffix = '</div>';

      let lineColor = this.Prefs.headerSepLineColor;
      let lineSize = this.Prefs.headerSepLineSize;
      rwhHdr += '<hr id="rwhMsgHdrDivider" style="border:0;border-top:' + lineSize + 'px solid ' + lineColor + ';padding:0;margin:10px 0 5px 0;width:100%;">';

      rwhHdr += this.createBrTags(this.Prefs.beforeHdrSpaceCnt);

      rwhHdr += htmlTagPrefix + '<b>' + i18n.from[locale] + '</b> ' + pHeader.from + htmlTagSuffix;

      if (headerQuotLblSeq == 0) { // jshint ignore:line
        rwhHdr += htmlTagPrefix + '<b>' + i18n.subject[locale] + '</b> ' + pHeader.subject + htmlTagSuffix;
        rwhHdr += htmlTagPrefix + '<b>' + i18n.date[locale] + '</b> ' + pHeader.date + htmlTagSuffix;
        rwhHdr += htmlTagPrefix + '<b>' + i18n.to[locale] + '</b> ' + pHeader.to + htmlTagSuffix;

        if (pHeader.cc) {
          rwhHdr += htmlTagPrefix + '<b>' + i18n.cc[locale] + '</b> ' + pHeader.cc + htmlTagSuffix;
        }
      } else if (headerQuotLblSeq == 3) {
        rwhHdr += htmlTagPrefix + '<b>' + i18n.to[locale] + '</b> ' + pHeader.to + htmlTagSuffix;

        if (pHeader.cc) {
          rwhHdr += htmlTagPrefix + '<b>' + i18n.cc[locale] + '</b> ' + pHeader.cc + htmlTagSuffix;
        }
        rwhHdr += htmlTagPrefix + '<b>' + i18n.date[locale] + '</b> ' + pHeader.date + htmlTagSuffix;
        rwhHdr += htmlTagPrefix + '<b>' + i18n.subject[locale] + '</b> ' + pHeader.subject + htmlTagSuffix;
      } else if (headerQuotLblSeq == 1) {
        rwhHdr += htmlTagPrefix + '<b>' + i18n.sent[locale] + '</b> ' + pHeader.date + htmlTagSuffix;
        rwhHdr += htmlTagPrefix + '<b>' + i18n.to[locale] + '</b> ' + pHeader.to + htmlTagSuffix;

        if (pHeader.cc) {
          rwhHdr += htmlTagPrefix + '<b>' + i18n.cc[locale] + '</b> ' + pHeader.cc + htmlTagSuffix;
        }

        rwhHdr += htmlTagPrefix + '<b>' + i18n.subject[locale] + '</b> ' + pHeader.subject + htmlTagSuffix;

      } else if (headerQuotLblSeq == 2) {
        rwhHdr += htmlTagPrefix + '<b>' + i18n.sent[locale] + '</b> ' + pHeader.date + htmlTagSuffix;
        rwhHdr += htmlTagPrefix + '<b>' + i18n.subject[locale] + '</b> ' + pHeader.subject + htmlTagSuffix;
      }

    } else { // for plain/text emails
      if (!this.Prefs.excludePlainTxtHdrPrefix) {
        rwhHdr += (this.isForward
          ? '-------- ' + i18n.forwarded_message[locale] + ' --------<br/>'
          : '-------- ' + i18n.original_message[locale] + ' --------<br/>');
      } else {
        if (this.isForward) {
          rwhHdr += '<br/>';
        }
      }

      rwhHdr += this.createBrTags(this.Prefs.beforeHdrSpaceCnt);

      rwhHdr += i18n.from[locale] + ' ' + pHeader.from + '<br/>';

      if (headerQuotLblSeq == 0) { // jshint ignore:line
        rwhHdr += i18n.subject[locale] + ' ' + pHeader.subject + '<br/>';
        rwhHdr += i18n.date[locale] + ' ' + pHeader.date + '<br/>';
        rwhHdr += i18n.to[locale] + ' ' + pHeader.to + '<br/>';

        if (pHeader.cc) {
          rwhHdr += i18n.cc[locale] + ' ' + pHeader.cc + '<br/>';
        }
      } else if (headerQuotLblSeq == 3) {
        rwhHdr += i18n.to[locale] + ' ' + pHeader.to + '<br/>';

        if (pHeader.cc) {
          rwhHdr += i18n.cc[locale] + ' ' + pHeader.cc + '<br/>';
        }
        rwhHdr += i18n.date[locale] + ' ' + pHeader.date + '<br/>';
        rwhHdr += i18n.subject[locale] + ' ' + pHeader.subject + '<br/>';
      } else if (headerQuotLblSeq == 1) {
        rwhHdr += i18n.sent[locale] + ' ' + pHeader.date + '<br/>';
        rwhHdr += i18n.to[locale] + ' ' + pHeader.to + '<br/>';

        if (pHeader.cc) {
          rwhHdr += i18n.cc[locale] + ' ' + pHeader.cc + '<br/>';
        }

        rwhHdr += i18n.subject[locale] + ' ' + pHeader.subject + '<br/>';

      } else if (headerQuotLblSeq == 2) {
        rwhHdr += i18n.sent[locale] + ' ' + pHeader.date + '<br/>';
        rwhHdr += i18n.subject[locale] + ' ' + pHeader.subject + '<br/>';
      }
    }

    rwhHdr += this.createBrTags(this.Prefs.afterHdrSpaceCnt);

    rwhHdr += '</div>';

    rwhlog.debug('Composed Email Headers: ' + rwhHdr);

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
    let firstNode = gMsgCompose.editor.rootElement.firstChild;
    if (firstNode && firstNode.nodeName &&
      firstNode.nodeName.toLowerCase() == 'p') {
      gMsgCompose.editor.rootElement.removeChild(firstNode);
    }

    let rwhHdr = this.byIdInMail('rwhMsgHeader');
    if (rwhHdr.nextSibling) {
      this.cleanEmptyTags(rwhHdr.nextSibling);
    } else if (rwhHdr.parentNode.nextSibling) {
      this.cleanEmptyTags(rwhHdr.parentNode.nextSibling);
    }
  },

  cleanEmptyTags: function(node) {
    let toDelete = true;
    while (node && toDelete) {
      let nextNode = node.nextSibling;
      toDelete = false;

      // Ref: https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
      switch (node.nodeType) {
        case Node.ELEMENT_NODE:
          if (node.nodeName && node.nodeName.toLowerCase() == 'br') {
            toDelete = true;
          }
          if (node.nodeName && node.nodeName.toLowerCase() == 'span') {
            if (node.textContent.trim() === '') {
              toDelete = true;
            }
          }
          break;
        case Node.TEXT_NODE:
          if (node.nodeValue == '\n' || node.nodeValue == '\r') {
            toDelete = true;
          }
      }

      if (toDelete) {
        // rwhlog.debug('Delete node: \t' + node.nodeName + '	' + node.nodeValue);
        this.deleteNode(node);
        node = nextNode;
      }
    }
  },

  decodeMime: function(str) {
    return this.mimeConverter.decodeMimeHeader(str, null, false, true);
  },

  isReplyToNode: function(node) {
    if (node) {
      return (Node.TEXT_NODE == node.nodeType
        && node.nodeValue.trim().startsWith('Reply-To:'));
    }
    return false;
  },

  handleReplyMessage: function() {
    let hdrNode = this.getElement('moz-cite-prefix');

    if (!hdrNode) {
      rwhlog.error('Due to internal changes in Thunderbird. '
      + 'RWH add-on having difficulties in processing mail headers '
      + ', contact add-on author here - ' + this.issuesPageUrl);
      return;
    }

    let isSignature = this.isSignaturePresent;

    while (hdrNode.firstChild) {
      hdrNode.removeChild(hdrNode.firstChild);
    }

    hdrNode.appendChild(this.parseFragment(gMsgCompose.editor.document, this.createRwhHeader, true));

    let sigOnBtm = gCurrentIdentity.getBoolAttribute('sig_bottom'),
      sigOnFwd = gCurrentIdentity.getBoolAttribute('sig_on_fwd'),
      sigOnReply = gCurrentIdentity.getBoolAttribute('sig_on_reply');
    let rootElement = gMsgCompose.editor.rootElement;

    if ((sigOnReply || sigOnFwd) && !sigOnBtm && isSignature) {
      let firstNode = gMsgCompose.editor.rootElement.firstChild;
      if (firstNode && firstNode.nodeName &&
        firstNode.nodeName.toLowerCase() == 'p') {
        rootElement.removeChild(firstNode);
      }

      //rootElement.insertBefore(gMsgCompose.editor.document.createElement('br'), rootElement.firstChild);
    } else {
      let node = rootElement.firstChild;
      if (node.nodeName && node.nodeName.toLowerCase() == 'br') {
        rootElement.removeChild(node);
      }
    }

    this.cleanBrAfterRwhHeader();
  },

  handleForwardMessage: function() {
    let hdrRwhNode = this.parseFragment(gMsgCompose.editor.document, this.createRwhHeader, true);
    let fwdContainer = this.getElement('moz-forward-container');
    let sigOnBtm = gCurrentIdentity.getBoolAttribute('sig_bottom');
    let isSignature = this.isSignaturePresent;
    let rootElement = gMsgCompose.editor.rootElement;
    let sigNode;

    rwhlog.debug('Is signature present: ' + isSignature);

    // signature present and location above quoted email (top)
    if (!sigOnBtm && isSignature) {
      sigNode = this.getElement('moz-signature').cloneNode(true);
      rootElement.removeChild(this.getElement('moz-signature'));
      rwhlog.debug('Thunderbird signature node: ' + sigNode);
    }

    if (this.isHtmlMail) {
      while (fwdContainer.firstChild) {
        if (this.contains(fwdContainer.firstChild.className, 'moz-email-headers-table')) {
          break;
        }
        fwdContainer.removeChild(fwdContainer.firstChild);
      }

      fwdContainer.replaceChild(hdrRwhNode, this.getElement('moz-email-headers-table'));

      // put signature back to the place
      if (!sigOnBtm && isSignature) {
        rootElement.insertBefore(sigNode, fwdContainer);
        this.cleanEmptyTags(rootElement.firstChild);

        // let rootElement = gMsgCompose.editor.rootElement;
        // rootElement.insertBefore(gMsgCompose.editor.document.createElement('br'), rootElement.firstChild);
      }
    } else {
      rwhlog.debug('Headers count: ' + this.hdrCnt);

      // Logically removing text node header elements
      this.deleteNode(fwdContainer.firstChild);

      // Logically removing forward header elements
      let lc = (this.hdrCnt * 2) + 1; // for br's
      if (isSignature) {
        lc = lc + 1; // for signature div
      }

      for (let i = 0; i <= lc; i++) {
        let fnode = fwdContainer.firstChild;
        if (fnode.nodeValue) {
          rwhlog.debug('Plain Text Hdr ==> ' + fnode.nodeValue);
        }

        if (this.isReplyToNode(fnode)) {
          lc = lc + 2;
          rwhlog.debug('Reply-To header found');
        }

        this.deleteNode(fnode);
      }

      fwdContainer.replaceChild(hdrRwhNode, fwdContainer.firstChild);

      // put signature back to the place
      if (!sigOnBtm && isSignature) {
        rootElement.insertBefore(sigNode, fwdContainer);
        this.cleanEmptyTags(rootElement.firstChild);
      }
    }

    this.cleanBrAfterRwhHeader();
  },

  handleSubjectPrefix: function() {
    let msgSubject = this.byId('msgSubject');

    if (this.isDefined(msgSubject)) {
      if (this.isReply) {
        msgSubject.value = msgSubject.value.replace(/^Re:/, 'RE:');
      } else if (this.isForward) {
        msgSubject.value = msgSubject.value.replace(/^Fwd:/, 'FW:');
      }
    }
  },

  handleBlockQuote: function() {
    let blockquotes = this.byTagName('blockquote');

    if (blockquotes.length > 0) {
      for (let i = 0, len = this.Prefs.cleanNewBlockQuote ? 1 : blockquotes.length; i < len; i++) {
        blockquotes[i].setAttribute('style', this.bqStyleStr);
      }
    }
  },

  handleGreaterThanChar: function() {
    let mailBody = gMsgCompose.editor.rootElement; // alternate is gMsgCompose.editor.document.body

    if (mailBody) {
      // NOTE: Here RWH Add-On does string find and replace. No external creation of HTML string
      if (this.Prefs.cleanOnlyNewQuoteChar) {
        mailBody.innerHTML = mailBody.innerHTML.replace(/>(&gt;) ?/g, '>');
      } else {
        mailBody.innerHTML = mailBody.innerHTML.replace(/<br>(&gt;)+ ?/g, '<br>').replace(/(<\/?span [^>]+>)(&gt;)+ /g, '$1');
      }
    }
  },

  handOverToUser: function() {
    gMsgCompose.editor.resetModificationCount();

    if (this.isReply) {
      if (gCurrentIdentity.replyOnTop == 1) {
        gMsgCompose.editor.beginningOfDocument();
      } else {
        gMsgCompose.editor.endOfDocument();
      }
    }
  },

  init: function() {
    gMsgCompose.RegisterStateListener(ReplyWithHeader.composeStateListener);
  },

  composeStateListener: {
    NotifyComposeFieldsReady: function() {},
    NotifyComposeBodyReady: function() {
      try {
        ReplyWithHeader.handleMailCompose();
      } catch(ex) {
        rwhlog.errorWithException('An error occurred, please report an issue to add-on author here '
          + '- https://github.com/jeevatkm/ReplyWithHeaderMozilla/issues', ex);
      }
    },
    ComposeProcessDone: function(aResult) {},
    SaveInFolderDone: function(folderURI) {}
  },

  handleMailCompose: function() {
    let prefs = this.Prefs;
    rwhlog.enableDebug = prefs.isDebugEnabled;

    rwhlog.debug('Initializing ' + ReplyWithHeader.addOnName + ' v' + ReplyWithHeader.addOnVersion
      + ' (' + rwhhost.app + ' ' + rwhhost.version
      + ', ' + rwhhost.OS + ', ' + rwhhost.buildID + ')');

    /*
     * ReplyWithHeader has to be enabled; extensions.replywithheader.enable=true and
     * ReplyWithHeader.isOkayToMoveOn must return true
     * Add-On comes into play :)
     */

    if (prefs.isEnabled && this.isOkayToMoveOn) {
      this.hdrCnt = 4; // From, To, Subject, Date

      // rwhlog.debug('BEFORE Raw Content:: ' + gMsgCompose.editor.rootElement.innerHTML);
      rwhlog.debug('Email content-type: ' + (this.isHtmlMail ? 'HTML' : 'Plain text'));

      if (this.isReply) {
        rwhlog.debug('Email compose type: Reply/ReplyAll');

        this.handleReplyMessage();
      } else if (this.isForward) {
        rwhlog.debug('Email compose type: Forward');

        this.handleForwardMessage();
      }

      if (prefs.isSubjectPrefixEnabled) {
        this.handleSubjectPrefix();
      }

      if (prefs.cleanBlockQuote) {
        this.handleBlockQuote();
      }

      if (prefs.cleanGreaterThanChar) {
        this.handleGreaterThanChar();
      }

      this.handOverToUser();

      // rwhlog.debug('AFTER Raw Content:: ' + gMsgCompose.editor.rootElement.innerHTML);
    } else {
      if (prefs.isEnabled) {
        // Resend=10, Redirect=15
        if (this.composeType == 10 || this.composeType == 15) {
          rwhlog.info('Email composeType [' + this.composeType + '] is not supported.');
        }
      } else {
        rwhlog.info('ReplyWithHeader add-on is not enabled, you can enable it in the Add-On Preferences.');
      }
    }
  },

  showAlert: function(str) {
    if (str) {
      try {
        this.alerts.showAlertNotification('resource://replywithheader/icon-64.png',
          'ReplyWithHeader', str, false, '', null, '');
      } catch (ex) {
        rwhlog.errorWithException('Unable to show RWH notify alert.', ex);
      }
    }
  },

  openUrl: function(url) {
    try {
      this.messenger.launchExternalURL(url);
    } catch (ex) {
      rwhlog.errorWithException('Unable to open RWH URL.', ex);
    }
  },

};

// Getting Add-On name & version #
AddonManager.getAddonByID(ReplyWithHeaderAddOnID).then(function(addOn) {
  ReplyWithHeader.addOnName = addOn.name;
  ReplyWithHeader.addOnVersion = addOn.version;
});

// Initializing Services
// https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIAlertsService
XPCOMUtils.defineLazyServiceGetter(ReplyWithHeader, 'alerts',
                                   '@mozilla.org/alerts-service;1',
                                   'nsIAlertsService');

// https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIMessenger
XPCOMUtils.defineLazyServiceGetter(ReplyWithHeader, 'messenger',
                                   '@mozilla.org/messenger;1',
                                   'nsIMessenger');

// https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIMimeConverter
XPCOMUtils.defineLazyServiceGetter(ReplyWithHeader, 'mimeConverter',
                                  '@mozilla.org/messenger/mimeconverter;1',
                                  'nsIMimeConverter');

// based on available service, initialize one
(function() {
  if ('@mozilla.org/parserutils;1' in Components.classes) {
    // https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIParserUtils
    XPCOMUtils.defineLazyServiceGetter(ReplyWithHeader, 'parser',
                                       '@mozilla.org/parserutils;1',
                                       'nsIParserUtils');
  } else {
    // https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIScriptableUnescapeHTML
    XPCOMUtils.defineLazyServiceGetter(ReplyWithHeader, 'legacyParser',
                                       '@mozilla.org/feed-unescapehtml;1',
                                       'nsIScriptableUnescapeHTML');
  }

  // String prototype
  if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(search, pos) {
      return this.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
    };
  }

  if (!String.prototype.endsWith) {
    String.prototype.endsWith = function(search, this_len) {
      if (this_len === undefined || this_len > this.length) {
        this_len = this.length;
      }
      return this.substring(this_len - search.length, this_len) === search;
    };
  }
})();
