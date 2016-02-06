'use strict';

/*
 * Copyright (c) 2015-2016 Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code is subject to terms of MIT License.
 * Please refer to LICENSE.txt in the root folder of RWH extension.
 * You can download a copy of license at https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE.txt
 */

 /* globals ReplyWithHeader, RCc, RCi */

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

   get isDebugEnabled() {
     return this.getBool('extensions.replywithheader.debug');
   },

   get fromLabelStyle() {
     return this.getInt('extensions.replywithheader.header.from.style');
   },

   get toccLabelStyle() {
     return this.getInt('extensions.replywithheader.header.tocc.style');
   },

   get beforeSepSpaceCnt() {
     return this.getInt('extensions.replywithheader.header.separator.space.before');
   },

   get beforeHdrSpaceCnt() {
     return this.getInt('extensions.replywithheader.header.space.before');
   },

   get afterHdrSpaceCnt() {
     return this.getInt('extensions.replywithheader.header.space.after');
   },

   get dateFormat() {
     return this.getInt('extensions.replywithheader.header.date.format');
   },

   get headerFontFace() {
     return this.getString('extensions.replywithheader.header.font.face');
   },

   get headerFontSize() {
     return this.getInt('extensions.replywithheader.header.font.size');
   },

   get headerFontColor() {
     return this.getString('extensions.replywithheader.header.font.color');
   },

   get headerQuotLblSeq() {
     return this.getInt('extensions.replywithheader.header.lblseq.style');
   },

   get isSubjectPrefixEnabled() {
     return this.getBool('extensions.replywithheader.trans.subject.prefix');
   },

   get cleanBlockQuote() {
     return this.getBool('extensions.replywithheader.clean.blockquote');
   },

   get cleanNewBlockQuote() {
     return this.getBool('extensions.replywithheader.clean.new.blockquote');
   },

   get cleanGreaterThanChar() {
     return this.getBool('extensions.replywithheader.clean.char.greaterthan');
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

   loadFontFaces: function() {
     let allFonts = RCc['@mozilla.org/gfx/fontenumerator;1']
     .createInstance(RCi.nsIFontEnumerator).EnumerateAllFonts({});

     let hdrFontface = this.headerFontFace;
     ReplyWithHeader.Log.debug('Header Font Face: ' + hdrFontface);

     let menuPopup = document.createElement('menupopup');
     let selectedIdx = 0;

     for (let fontCount=allFonts.length, i=0; i<fontCount; i++) {
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

     for (let i=10, j=0; i<35; i++, j++) {
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
     ReplyWithHeader.byId('abtRwhCaption').value = ReplyWithHeader.addonName + ' v' + ReplyWithHeader.version;

     this.loadFontFaces();

     this.loadFontSizes();

     this.forPostbox(true);
   },

   toggleRwh: function() {
     let rwh = document.getElementById('enableRwh');
     var ids = ['lblFromAttribution', 'fromAttributionStyle', 'lblHeaderToCcAttrib', 'toccAttributionStyle',
     'lblTypography', 'lblFontface', 'hdrFontface', 'lblFontsize', 'hdrFontsize', 'lblFontcolor',
     'hdrFontColor', 'lblSpace', 'lblBeforeHeader', 'spaceBeforeHdr', 'lblAfterHeader',
     'spaceAfterHdr', 'lblBeforeSeparator', 'spaceBeforeSep', 'lblHeaderQuotSeq', 'quotSeqAttributionStyle',
     'transSubjectPrefix', 'lblNotAppBeforeSeparator', 'lblCntFormat', 'cleanBlockQuote',
     'cleanNewBlockQuote', 'cleanGreaterThanChar'];

     if (rwh.checked) {
       for (let len=ids.length, i=0; i<len; i++) {
         this.toggle(ids[i], false);
       }
     } else {
       for (let len=ids.length, i=0; i<len; i++) {
         this.toggle(ids[i], true);
       }
     }

     this.forPostbox(true);
   },

   toggle: function(id, v) {
     ReplyWithHeader.byId(id).disabled = v;
   },

   forPostbox: function(v) {
     if (ReplyWithHeader.hostApp == 'Postbox') {
       this.toggle('lblBeforeSeparator', v);
       this.toggle('spaceBeforeSep', v);
       this.toggle('lblNotAppBeforeSeparator', v);
     }
   }
 };
