'use strict';

/*
 * Copyright (c) 2015-2016 Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code is subject to terms of MIT License.
 * Please refer to LICENSE.txt in the root folder of RWH extension.
 * You can download a copy of license at https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE.txt
 */

var EXPORTED_SYMBOLS = ['ReplyWithHeader'];

Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');
Components.utils.import('resource://gre/modules/AddonManager.jsm');

// ReplyWithHeader Add-On ID
const ReplyWithHeaderAddonID = 'replywithheader@myjeeva.com';

var ReplyWithHeader = {
  addonVersion: '',
  homepageUrl: 'http://myjeeva.com/replywithheader-mozilla',
  reviewsPageUrl: 'https://addons.mozilla.org/en-US/thunderbird/addon/replywithheader/',
  issuesPageUrl: 'https://github.com/jeevatkm/ReplyWithHeaderMozilla/issues',
  btcAddress: '1FG6G5tCmFm7vrc7BzUyRxr3RBrMDJA6zp',
  paypalDonateUrl: 'https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=QWMZG74FW4QYC&lc=US&item_name=Jeevanandam%20M%2e&item_number=ReplyWithHeaderMozilla&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted',
  hdrCnt: 4,
  bqStyleStr: 'border:none !important; margin-left:0px !important; margin-right:0px !important; margin-top:0px !important; padding-left:0px !important; padding-right:0px !important',
  dateFormatString: 'ddd, MMM d, yyyy h:mm:ss a',

  isDefined: function(o) {
    let defined = (typeof o === 'undefined');
    return !defined;
  },

  get isReply() {
    let mct = Components.interfaces.nsIMsgCompType;
    let ct = this.composeType;

    return (ct == mct.Reply || ct == mct.ReplyAll || ct == mct.ReplyToSender);
  },

  get isForward() {
    return (this.composeType == Components.interfaces.nsIMsgCompType.ForwardInline);
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
      this.Log.debug('gMsgCompose.originalMsgURI is not defined, fallback');
      let selectedURIs = GetSelectedMessages();
      try {
        msgUri = selectedURIs[0]; // only first message
      } catch (ex) {
        this.Log.errorWithException('Error occurred while getting selected message.', ex);
        return false;
      }
    }
    this.Log.debug('Message URI: ' + msgUri);

    return msgUri;
  },

  get isHtmlMail() {
    return gMsgCompose.composeHTML;
  },

  // This is applicable only to HTML emails
  get isSignaturePresent() {
    if (!this.isHtmlMail) {
      return false;
    }

    let sigOnBtm = gCurrentIdentity.getBoolAttribute('sig_bottom'),
      sigOnFwd = gCurrentIdentity.getBoolAttribute('sig_on_fwd'),
      sigOnReply = gCurrentIdentity.getBoolAttribute('sig_on_reply');

    let mBody = gMsgCompose.editor.rootElement;
    let found = false;
    if (sigOnBtm) {
      this.Log.debug('signatue in the bottom');

      for (let i = mBody.childNodes.length - 1; i >= 0; i--) {
        let node = mBody.childNodes[i];
        this.Log.debug(node.nodeName);

        if (node.hasAttribute('class') &&
          (node.getAttribute('class') == 'moz-signature')) {
          found = true;
          break;
        }

        if (node.nodeName.toLowerCase() == 'blockquote') {
          this.Log.debug('reached blockquote, so no signature');
          break;
        }
      }
    } else {
      this.Log.debug('signatue is at top');
      let fc = mBody.firstChild;
      while (fc) {
        if (fc.hasAttribute('class') &&
          (fc.getAttribute('class') == 'moz-signature')) {
          found = true;
          break;
        }

        if (fc.nodeName.toLowerCase() == 'blockquote') {
          this.Log.debug('reached blockquote, so no signature');
          break;
        }

        fc = fc.nextSibling;
      }
    }

    return ((sigOnFwd || sigOnReply) && found);
  },

  get isPostbox() {
    return (this.hostApp == 'Postbox');
  },

  get isThunderbird() {
    return (this.hostApp == 'Thunderbird');
  },

  get hostApp() {
    var app = 'Unknown';
    if (this.appInfo.ID == '{3550f703-e582-4d05-9a08-453d09bdfdc6}') {
      app = 'Thunderbird';  // this.appInfo.name
    } else if (this.appInfo.ID == 'postbox@postbox-inc.com') {
      app = 'Postbox';
    }

    return app;
  },

  getMsgHeader: function(mUri) {
    try {
      // Ref: https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIMessenger
      let messengerService = gMessenger.messageServiceFromURI(mUri);

      // Ref: https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIMsgDBHdr
      return messengerService.messageURIToMsgHdr(mUri);
    } catch (ex) {
      this.Log.errorWithException('Unable to get message [' + mUri + ']', ex);
      return null;
    }
  },

  // Reference: https://gist.github.com/redoPop/3915761
  tzAbbr: function(dateInput) {
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
    if (this.Prefs.dateFormat == 0) { // jshint ignore:line
      this.Log.debug('Locale date format');
      nd = DateFormat.format.date(d, this.dateFormatString) + ' ' + this.tzAbbr(d);
    } else {
      this.Log.debug('GMT date format');
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
      'cc': this.prepareToCcHdr(hdr.ccList), // this.prepareToCcHdr(hdr.getStringProperty('cc')),
      'date': this.parseDate(hdr.date),
      'subject': this.escapeHtml(hdr.mime2DecodedSubject)
    };

    // Cleanup numbers
    if (header.cc) {
      this.hdrCnt += 1; // for Cc header
    }

    let replyTo = hdr.getStringProperty('replyTo').trim();
    if (replyTo) {
      this.Log.debug('ReplyTo is present:: ' + replyTo);
      this.hdrCnt += 1; // for reply-to header
    }

    this.Log.debug('\nFrom: ' + header.from +
      '\nTo: ' + header.to +
      '\nCC: ' + header.cc +
      '\nSubject: ' + header.subject +
      '\nDate: ' + header.date);

    return header;
  },

  get createRwhHeader() {
    let rawHdr = this.getMsgHeader(this.messageUri);
    let pHeader = this.parseMsgHeader(rawHdr);
    let headerQuotLblSeq = this.Prefs.headerQuotLblSeq;

    var rwhHdr = '<div id="rwhMsgHeader">';

    if (this.isThunderbird) {
      rwhHdr += this.createBrTags(this.Prefs.beforeSepSpaceCnt);
    }

    // for HTML emails
    if (this.isHtmlMail) {
      let fontFace = this.Prefs.headerFontFace;
      let fontSize = this.Prefs.headerFontSize;
      let fontColor = this.Prefs.headerFontColor;
      this.Log.debug('Font face: ' + fontFace + '\tFont size: ' + fontSize + '\tColor: ' + fontColor);

      let htmlTagPrefix = '<span style="margin: -1.3px 0 0 0 !important;"><font face="' + fontFace + '" color="' + fontColor + '" style="font: ' + fontSize + 'px ' + fontFace + ' !important; color: ' + fontColor + ' !important;">';
      let htmlTagSuffix = '</font></span><br/>';

      if (this.isSignaturePresent) {
        let sigOnBtm = gCurrentIdentity.getBoolAttribute('sig_bottom'),
          sigOnFwd = gCurrentIdentity.getBoolAttribute('sig_on_fwd'),
          sigOnReply = gCurrentIdentity.getBoolAttribute('sig_on_reply');

        this.Log.debug('sigOnBtm: ' + sigOnBtm + '\tsigOnReply: ' + sigOnReply + '\tsigOnFwd: ' + sigOnFwd);

        if ((sigOnReply || sigOnFwd) && !sigOnBtm) {
          rwhHdr += this.createBrTags(1);
        }
      }

      rwhHdr += '<hr style="border:0;border-top:1px solid #B5C4DF;padding:0;margin:10px 0 5px 0;width:100%;">';

      rwhHdr += this.createBrTags(this.Prefs.beforeHdrSpaceCnt);

      rwhHdr += htmlTagPrefix + '<b>From:</b> ' + pHeader.from + htmlTagSuffix;

      if (headerQuotLblSeq == 0) { // jshint ignore:line
        rwhHdr += htmlTagPrefix + '<b>Subject:</b> ' + pHeader.subject + htmlTagSuffix;
        rwhHdr += htmlTagPrefix + '<b>Date:</b> ' + pHeader.date + htmlTagSuffix;
        rwhHdr += htmlTagPrefix + '<b>To:</b> ' + pHeader.to + htmlTagSuffix;

        if (pHeader.cc) {
          rwhHdr += htmlTagPrefix + '<b>Cc:</b> ' + pHeader.cc + htmlTagSuffix;
        }
      } else if (headerQuotLblSeq == 1) {
        rwhHdr += htmlTagPrefix + '<b>Sent:</b> ' + pHeader.date + htmlTagSuffix;
        rwhHdr += htmlTagPrefix + '<b>To:</b> ' + pHeader.to + htmlTagSuffix;

        if (pHeader.cc) {
          rwhHdr += htmlTagPrefix + '<b>Cc:</b> ' + pHeader.cc + htmlTagSuffix;
        }

        rwhHdr += htmlTagPrefix + '<b>Subject:</b> ' + pHeader.subject + htmlTagSuffix;
      }

    } else { // for plain/text emails
      if (!this.Prefs.excludePlainTxtHdrPrefix) {
        rwhHdr += this.isForward ? '<br/>-------- Forwarded Message --------<br/>' : '<br/>-------- Original Message --------<br/>';
      } else {
        if (this.isForward) {
          rwhHdr += '<br/>';
        }
      }

      rwhHdr += this.createBrTags(this.Prefs.beforeHdrSpaceCnt);

      rwhHdr += 'From: ' + pHeader.from + '<br/>';

      if (headerQuotLblSeq == 0) { // jshint ignore:line
        rwhHdr += 'Subject: ' + pHeader.subject + '<br/>';
        rwhHdr += 'Date: ' + pHeader.date + '<br/>';
        rwhHdr += 'To: ' + pHeader.to + '<br/>';

        if (pHeader.cc) {
          rwhHdr += 'Cc: ' + pHeader.cc + '<br/>';
        }
      } else if (headerQuotLblSeq == 1) {
        rwhHdr += 'Sent: ' + pHeader.date + '<br/>';
        rwhHdr += 'To: ' + pHeader.to + '<br/>';

        if (pHeader.cc) {
          rwhHdr += 'Cc: ' + pHeader.cc + '<br/>';
        }

        rwhHdr += 'Subject: ' + pHeader.subject + '<br/>';
      }

    }

    rwhHdr += this.createBrTags(this.Prefs.afterHdrSpaceCnt);

    rwhHdr += '</div>';

    this.Log.debug('Header HTML: ' + rwhHdr);

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

  createElement: function(tagName) {
    return gMsgCompose.editor.document.createElement(tagName);
  },

  cleanBrAfterRwhHeader: function() {
    let rwhHdr = this.byIdInMail('rwhMsgHeader');

    if (rwhHdr.nextSibling) {
      this.cleanEmptyTags(rwhHdr.nextSibling);
    } else if (rwhHdr.parentNode.nextSibling) {
      this.cleanEmptyTags(rwhHdr.parentNode.nextSibling);
    }

    if (this.isPostbox) {
      let pbhr = this.getElement('__pbConvHr');
      if (pbhr) {
        pbhr.setAttribute('style', 'margin:0 !important;');
      }

      // Signature
      if (this.isSignaturePresent) {
        this.cleanEmptyTags(this.getElement('moz-signature').nextSibling);
      }
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
        // this.Log.debug('Delete node: \t' + node.nodeName + '	' + node.nodeValue);
        this.deleteNode(node);
        node = nextNode;
      }
    }
  },

  handleReplyMessage: function() {
    let hdrNode;
    if (this.isPostbox) {
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
      this.Log.error('RWH is unable to insert headers, contact add-on author here - ' + this.issuesPageUrl);
      return;
    }

    while (hdrNode.firstChild) {
      hdrNode.removeChild(hdrNode.firstChild);
    }

    hdrNode.appendChild(this.parseFragment(gMsgCompose.editor.document, this.createRwhHeader, true));

    this.cleanBrAfterRwhHeader();
  },

  handleForwardMessage: function() {
    let hdrRwhNode = this.parseFragment(gMsgCompose.editor.document, this.createRwhHeader, true);

    //
    // Postbox
    //
    if (this.isPostbox) {
      let hdrNode = this.getElement('__pbConvHr');
      if (!hdrNode) {
        hdrNode = this.getElement('moz-email-headers-table');
      }

      let mBody = gMsgCompose.editor.rootElement;

      if (hdrNode && this.isHtmlMail) {
        let sigOnBtm = gCurrentIdentity.getBoolAttribute('sig_bottom');
        let isSignature = this.isSignaturePresent;
        this.Log.debug('isSignature: ' + isSignature);

        let sigNode;

        // signature present and location above quoted email (top)
        if (!sigOnBtm && isSignature) {
          sigNode = this.getElement('moz-signature').cloneNode(true);
          gMsgCompose.editor.rootElement.removeChild(this.getElement('moz-signature'));
        }
        this.Log.debug('sigNode: ' + sigNode);

        while (hdrNode.firstChild) {
          hdrNode.removeChild(hdrNode.firstChild);
        }

        this.cleanEmptyTags(mBody.firstChild);
        hdrNode.appendChild(hdrRwhNode);

        if (!sigOnBtm && isSignature) {
          mBody.insertBefore(sigNode, mBody.firstChild);
        }

        if (this.Prefs.beforeSepSpaceCnt == 0) { // jshint ignore:line
          for (let i = 0; i < 2; i++)
            mBody.insertBefore(this.createElement('br'), mBody.firstChild);
        }
      } else {
        this.Log.debug('hdrCnt: ' + this.hdrCnt);

        let pos = 0;
        for (let i = 0; i < mBody.childNodes.length; i++) {
          let node = mBody.childNodes[i];
          if (Node.TEXT_NODE == node.nodeType &&
            node.nodeValue == '-------- Original Message --------') {
            pos = i;
            break;
          }
        }

        for (let i = pos; i <= (pos + this.hdrCnt); i++) {
          mBody.removeChild(mBody.childNodes[i]);
        }

        mBody.insertBefore(hdrRwhNode, mBody.childNodes[pos - 1]);

        if (this.Prefs.beforeSepSpaceCnt == 0) { // jshint ignore:line
          mBody.insertBefore(this.createElement('br'), mBody.firstChild);
        }
      }
    } else {
      //
      // For Thunderbird
      //
      this.cleanEmptyTags(this.getElement('moz-forward-container').firstChild);

      let isSignature = this.isSignaturePresent;
      let sigNode;
      if (isSignature) {
        sigNode = this.getElement('moz-signature').cloneNode(true);
      }

      let fwdContainer = this.getElement('moz-forward-container');

      if (this.isHtmlMail) {
        // let fwdContainer = this.getElement('moz-forward-container');
        while (fwdContainer.firstChild) {
          if (fwdContainer.firstChild.className == 'moz-email-headers-table') {
            break;
          }

          fwdContainer.removeChild(fwdContainer.firstChild);
        }

        fwdContainer.replaceChild(hdrRwhNode, this.getElement('moz-email-headers-table'));

        //this.getElement('moz-forward-container').replaceChild(hdrRwhNode, this.getElement('moz-email-headers-table'));
      } else {
        this.Log.debug('hdrCnt: ' + this.hdrCnt);

        // Logically removing text node header elements
        this.deleteNode(fwdContainer.firstChild);

        // Logically removing forward header elements
        let lc = (this.hdrCnt * 2) + 1; // for br's
        if (isSignature) {
          lc = lc + 1; // for signature div
        }

        for (let i = 0; i < lc; i++) {
          this.deleteNode(fwdContainer.firstChild);
        }

        fwdContainer.replaceChild(hdrRwhNode, fwdContainer.firstChild);

        // TODO clean up before release
        // // Logically removing text node header elements
        // ReplyWithHeader.Log.debug('Cleaning text node');
        // this.deleteNode(this.getElement('moz-forward-container').firstChild);
        //
        // // Logically removing forward header elements
        // let lc = (this.hdrCnt * 2) + 1; // for br's
        // ReplyWithHeader.Log.debug('No of headers to cleanup (including BRs):: ' + lc);
        //
        // for (let i = 0; i < lc; i++) {
        //   this.deleteNode(this.getElement('moz-forward-container').firstChild);
        // }
        //
        // this.getElement('moz-forward-container').replaceChild(hdrRwhNode, this.getElement('moz-forward-container').firstChild);
      }

      // put signature back to the place
      if (sigNode) {
        // TODO clean up before release
        //        let fwdContainer = this.getElement('moz-forward-container');
        //fwdContainer.insertBefore(this.createElement('br'), fwdContainer.firstChild);
        fwdContainer.insertBefore(sigNode, fwdContainer.firstChild);
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

    if (this.isPostbox) {
      let pbBody = this.getElement('__pbConvBody');
      if (pbBody) {
        pbBody.style.color = '#000000';
        pbBody.style.marginLeft = '0px';
        pbBody.style.marginRight = '0px';
      }
    }
  },

  handleGreaterThanChar: function() {
    let mailBody = gMsgCompose.editor.rootElement; // alternate is gMsgCompose.editor.document.body

    if (mailBody) {
      // Here RWH Add-On does string find and replace.
      // No external creation of HTML string
      mailBody.innerHTML = mailBody.innerHTML.replace(/<br>(&gt;)+ ?/g, '<br />')
        .replace(/(<\/?span [^>]+>)(&gt;)+ /g, '$1');
    }
  },

  handOverToUser: function() {
    gMsgCompose.editor.resetModificationCount();

    if (this.isReply) {
      let rot = gCurrentIdentity.replyOnTop;
      this.Log.debug('ReplyOnTop: ' + rot);
      this.Log.debug('ReplyOnTop try 1: ' + !rot);
      this.Log.debug('ReplyOnTop try 2: ' + !!rot);

      if (rot == 1) {
        gMsgCompose.editor.beginningOfDocument();
      } else {
        gMsgCompose.editor.endOfDocument();
      }
    }
  },

  init: function() {
    ReplyWithHeader.Log.debug('Initializing');
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
    /*
     * ReplyWithHeader has to be enabled; extensions.replywithheader.enable=true and
     * ReplyWithHeader.isOkayToMoveOn must return true
     * Add-On comes into play :)
     */
    let prefs = this.Prefs;
    if (prefs.isEnabled && this.isOkayToMoveOn) {
      this.hdrCnt = 4; // From, To, Subject, Date

      this.Log.debug('BEFORE Raw Source:: ' + gMsgCompose.editor.rootElement.innerHTML);
      this.Log.debug('Is HTML compose: ' + this.isHtmlMail);

      if (this.isReply) {
        this.Log.debug('Reply/ReplyAll mode');

        this.handleReplyMessage();
      } else if (this.isForward) {
        this.Log.debug('Forward mode');

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

      this.Log.debug('AFTER Raw Source:: ' + gMsgCompose.editor.rootElement.innerHTML);
    } else {
      if (prefs.isEnabled) {
        if (this.composeType == 10 || this.composeType == 15) { // Resend=10, Redirect=15
          this.Log.info('Email composeType [' + this.composeType + '] is not supported.');
        }
      } else {
        this.Log.info('ReplyWithHeader add-on is not enabled, you can enable it in the Add-On Preferences.');
      }
    }
  },

  showAlert: function(str) {
    if (str) {
      try {
        this.alerts.showAlertNotification('chrome://replywithheader/skin/icon-64.png',
          'ReplyWithHeader', str, false, '', null, '');
      } catch (ex) {
        this.Log.errorWithException('Unable to show RWH notify alert.', ex);
      }
    }
  },

  openUrl: function(url) {
    try {
      this.messenger.launchExternalURL(url);
    } catch (ex) {
      this.Log.errorWithException('Unable to open RWH URL.', ex);
    }
  },
};

// RWH logger methods
ReplyWithHeader.Log = {
  info: function(msg) {
    this.logMsg('INFO', msg);
  },

  debug: function(msg) {
    if (ReplyWithHeader.Prefs.isDebugEnabled) {
      this.logMsg('DEBUG', msg);
    }
  },

  error: function(msg) {
    this.logMsg('ERROR', msg);
  },

  errorWithException: function(msg, ex) {
    var stack = '';
    var group = 'ReplyWithHeader';

    if (typeof ex.stack != 'undefined') {
      stack = ex.stack.replace('@', '\n  ');
    }

    var srcName = ex.fileName || '';
    var scriptError = Components.classes['@mozilla.org/scripterror;1']
                                .createInstance(Components.interfaces.nsIScriptError);

    // Addon generates this error, it is better to use warningFlag = 0x1
    scriptError.init(msg + '\n' + ex.message, srcName, stack, ex.lineNumber, 0, 0x1, group);
    this.console.logMessage(scriptError);
  },

  logMsg: function(l, m) {
    this.console.logStringMessage('RWH   '+ l + '\t' + m);
  }
};

// Getting Add-On version #
AddonManager.getAddonByID(ReplyWithHeaderAddonID, function(addon) {
  ReplyWithHeader.addonVersion = addon.version;
});

// Initializing Services
XPCOMUtils.defineLazyServiceGetter(ReplyWithHeader, 'appInfo',
                                   '@mozilla.org/xre/app-info;1',
                                   'nsIXULAppInfo');

XPCOMUtils.defineLazyServiceGetter(ReplyWithHeader, 'alerts',
                                   '@mozilla.org/alerts-service;1',
                                   'nsIAlertsService');

XPCOMUtils.defineLazyServiceGetter(ReplyWithHeader, 'messenger',
                                   '@mozilla.org/messenger;1',
                                   'nsIMessenger');

XPCOMUtils.defineLazyServiceGetter(ReplyWithHeader.Log, 'console',
                                   '@mozilla.org/consoleservice;1',
                                   'nsIConsoleService');

// based available service, initialize one
(function() {
  if ('@mozilla.org/parserutils;1' in Components.classes) {
    XPCOMUtils.defineLazyServiceGetter(ReplyWithHeader, 'parser',
                                       '@mozilla.org/parserutils;1',
                                       'nsIParserUtils');
  } else {
    XPCOMUtils.defineLazyServiceGetter(ReplyWithHeader, 'legacyParser',
                                       '@mozilla.org/feed-unescapehtml;1',
                                       'nsIScriptableUnescapeHTML');
  }
})();
