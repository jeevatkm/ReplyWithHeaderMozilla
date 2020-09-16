/*
 * Copyright (c) Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at
 * https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE
 */

// RWH Options base init from background page
window.rwhBackgroundPage = messenger.extension.getBackgroundPage();
window.rwh = rwhBackgroundPage.rwh;

// Expected to have "rwh" object exists
// if (typeof rwh === 'undefined') {
//   throw new Error('RWH mail extension encountered an unexpected error');
// }

// rwh.options.ui = {
//   get log() { return rwh.log; },
//   get options() { return rwh.options; },

//   get test() {
//     this.log.debug('test debug');
//     this.log.info('test info');
//   }


// };

function openCity(evt, cityName) {
  rwh.log.info(cityName);
  // Declare all variables
  var i, tabcontent, tablinks;

  // Get all elements with class="tabcontent" and hide them
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Get all elements with class="tablinks" and remove the class "active"
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the current tab, and add an "active" class to the button that opened the tab
  document.getElementById(cityName).style.display = "block";
  evt.currentTarget.className += " active";

}

(async function(){
  // await initLogger();
  // await initAbout();

  // Get all elements with class="tablinks" and remove the class "active"
  tablinks = document.getElementsByClassName("tablinks");
  console.log(tablinks);
  for (i = 0; i < tablinks.length; i++) {
    console.log(tablinks[i]);
    tablinks[i].onclick = function(e) {
      openCity(e, e.target.dataset.id);
    }
    // tablinks[i].className = tablinks[i].className.replace(" active", "");
  }


  console.log(rwh.storage.options);
  rwh.storage.options.header = {};
  rwh.storage.options.header.fontSize = 14;

  // let results = await messenger.storage.sync.get('options');
  // console.log(results.options);

  console.log(rwh.storage.options);
  rwh.storage.persist();


  // results = await messenger.storage.sync.get('options');
  // console.log(results.options);

  // rwh.storage.options = {test1: true, welcome1: 23243};
  // console.log(rwh.storage.options);

  // let results = await messenger.storage.local.get('options');
  // console.log(results.options);

  // rwh.storage.options = {test1: false, welcome1:44364};
  // console.log(rwh.storage.options);
  // results = await messenger.storage.local.get('options');
  // console.log(results.options);

  // rwh.storage.options = {};
  // console.log(rwh.storage.options);

  // results = await messenger.storage.local.get('options');
  // console.log(results.options);

  // rwh.storage.options = {newtest: 123};
  // console.log(rwh.storage.options);

  // await messenger.storage.local.set({options: {test1: true, welcome1: 23243}});

  // let results = await messenger.storage.local.get('options');
  // console.log(results.options);

  // await messenger.storage.local.set({options: {}});

  // let results2 = await messenger.storage.local.get('options');
  // console.log(results2.options);

  // var page = messenger.extension.getBackgroundPage();
  // console.log(page);
  // console.log(page.rwh.runtime);

  // await messenger.storage.local.set({options: {debug: true}});

  // console.log(await messenger.runtime.getManifest());
  // console.dir(messenger.runtime);
  // console.log(getPlatformInfo());
  // console.log(await messenger.runtime.getBrowserInfo());
})();

// console.dir(window);

// initOptions().catch(console.error);

// 'use strict';

// /* globals ReplyWithHeader */
// var { XPCOMUtils } = ChromeUtils.import('resource://gre/modules/XPCOMUtils.jsm');
// var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');
// var { rwhlog } = ChromeUtils.import('resource://replywithheader/log.jsm');
// var { rwhhost } = ChromeUtils.import('resource://replywithheader/host.jsm');

// ReplyWithHeader.Prefs = {
//   prefService: Services.prefs,

//   getIntPref: function(p) {
//     return this.prefService.getIntPref('extensions.replywithheader.' + p);
//   },

//   getBoolPref: function(p) {
//     return this.prefService.getBoolPref('extensions.replywithheader.' + p);
//   },

//   getStringPref: function(p) {
//     return this.prefService.getCharPref('extensions.replywithheader.' + p);
//   },

//   get isEnabled() {
//     return this.getBoolPref('enable');
//   },

//   get isDebugEnabled() {
//     return this.getBoolPref('debug');
//   },

//   get fromLabelStyle() {
//     return this.getIntPref('header.from.style');
//   },

//   get toccLabelStyle() {
//     return this.getIntPref('header.tocc.style');
//   },

//   get beforeSepSpaceCnt() {
//     return this.getIntPref('header.separator.space.before');
//   },

//   get beforeHdrSpaceCnt() {
//     return this.getIntPref('header.space.before');
//   },

//   get afterHdrSpaceCnt() {
//     return this.getIntPref('header.space.after');
//   },

//   get headerSepLineSize() {
//     return this.getIntPref('header.separator.line.size');
//   },

//   get headerSepLineColor() {
//     return this.getStringPref('header.separator.line.color');
//   },

//   get headerDateFormat() {
//     return this.getIntPref('header.date.format');
//   },

//   get headerTimeFormat() {
//     return this.getIntPref('header.time.format');
//   },

//   get headerIncludeTimeZone() {
//     return this.getBoolPref('header.date.timezone');
//   },

//   get headerFontFace() {
//     return this.getStringPref('header.font.face');
//   },

//   get headerFontSize() {
//     return this.getIntPref('header.font.size');
//   },

//   get headerFontSizeUnit() {
//     return this.getStringPref('header.font.size.unit');
//   },

//   get headerFontColor() {
//     return this.getStringPref('header.font.color');
//   },

//   get headerQuotLblSeq() {
//     return this.getIntPref('header.lblseq.style');
//   },

//   get headerLocale() {
//     let hdrLocale = this.getStringPref('header.locale');
//     if (hdrLocale == 'en') { // migrate settings value
//       this.prefService.setStringPref('extensions.replywithheader.header.locale', 'en-US');
//       hdrLocale = 'en-US';
//     }
//     return hdrLocale;
//   },

//   get isSubjectPrefixEnabled() {
//     return this.getBoolPref('trans.subject.prefix');
//   },

//   get cleanBlockQuote() {
//     return this.getBoolPref('clean.blockquote');
//   },

//   get cleanNewBlockQuote() {
//     return this.getBoolPref('clean.new.blockquote');
//   },

//   get cleanGreaterThanChar() {
//     return this.getBoolPref('clean.char.greaterthan');
//   },

//   get cleanOnlyNewQuoteChar() {
//     return this.getBoolPref('clean.only.new.quote.char');
//   },

//   get excludePlainTxtHdrPrefix() {
//     return this.getBoolPref('clean.pln.hdr.prefix');
//   },

//   openWebsite: function() {
//     ReplyWithHeader.openUrl(ReplyWithHeader.homepageUrl);
//   },

//   openReviews: function() {
//     ReplyWithHeader.openUrl(ReplyWithHeader.reviewsPageUrl);
//   },

//   reportIssues: function() {
//     ReplyWithHeader.openUrl(ReplyWithHeader.issuesPageUrl);
//   },

//   openPaypal: function() {
//     ReplyWithHeader.showAlert('Opening PayPal Service. Thanks for supporting ReplyWithHeader.');
//     ReplyWithHeader.openUrl(ReplyWithHeader.paypalDonateUrl);
//   },

//   copyBtcAddress: function() {
//     this.copyToClipboard(ReplyWithHeader.btcAddress);
//     ReplyWithHeader.showAlert('BTC address is copied. Thanks for supporting ReplyWithHeader.');
//   },

//   copyToClipboard: function(str) {
//     if (str) {
//       this.clipboard.copyString(str);
//     }
//   },

//   fixCursorBlink: function() {
//     // Ref: Due this Bug 567240 - Cursor does not blink when replying
//     // (https://bugzilla.mozilla.org/show_bug.cgi?id=567240)
//     // RWH is setting this 'mail.compose.max_recycled_windows' value to 0
//     if (this.prefService.getPrefType('mail.compose.max_recycled_windows')) {
//       let maxRecycledWindows = this.prefService.getIntPref('mail.compose.max_recycled_windows');
//       if (maxRecycledWindows == 1) {
//         this.prefService.setIntPref('mail.compose.max_recycled_windows', 0);
//       }
//     } else {
//       this.prefService.setIntPref('mail.compose.max_recycled_windows', 0);
//     }
//   },

//   createMenuItem: function(v, l) {
//     var menuItem = document.createElement('menuitem');
//     menuItem.setAttribute('value', v);
//     menuItem.setAttribute('label', l);
//     return menuItem;
//   },

//   loadFontFaces: function() {
//     let allFonts = Cc['@mozilla.org/gfx/fontenumerator;1']
//       .createInstance(Ci.nsIFontEnumerator).EnumerateAllFonts({});

//     let hdrFontface = this.headerFontFace;
//     let menuPopup = document.createElement('menupopup');
//     let selectedIdx = 0;

//     for (let fontCount = allFonts.length, i = 0; i < fontCount; i++) {
//       if (allFonts[i] == hdrFontface) {
//         selectedIdx = i;
//       }
//       menuPopup.appendChild(this.createMenuItem(allFonts[i], allFonts[i]));
//     }

//     let hdrFontfaceObj = ReplyWithHeader.byId('hdrFontface');
//     hdrFontfaceObj.appendChild(menuPopup);
//     hdrFontfaceObj.selectedIndex = selectedIdx;
//   },

//   loadFontSizes: function() {
//     let menuPopup = document.createElement('menupopup');
//     let selectedIdx = 0;

//     for (let i = 7, j = 0; i < 35; i++, j++) {
//       menuPopup.appendChild(this.createMenuItem(i, i));
//     }

//     let hdrFontsizeObj = ReplyWithHeader.byId('hdrFontsize');
//     hdrFontsizeObj.appendChild(menuPopup);
//     hdrFontsizeObj.selectedIndex = this.headerFontSize - 7;
//   },

//   populateLocale: function() {
//     var menu = ReplyWithHeader.byId('hdrLocalePopup');
//     if (!menu) {
//       rwhlog.error('It seems TB introduced the breaking changes, contact addon author.')
//     }

//     for (var lang in i18n.lang) {
//       menu.appendChild(this.createMenuItem(
//         lang, i18n.lang[lang] + ' (' + lang + ')'
//       ));
//     }
//     menu.parentNode.value = this.headerLocale;
//   },

//   init: function() {
//     this.toggleRwh();

//     // Assigning RWH name and version #
//     ReplyWithHeader.byId('abtRwhCaption').value = ReplyWithHeader.addOnName + ' v' + ReplyWithHeader.addOnVersion;

//     let d = new Date();
//     ReplyWithHeader.byId('abtRwhCopyrights').value = 'Ⓒ 2015-' + d.getFullYear() + ' Jeevanandam M.'

//     this.loadFontFaces();

//     this.loadFontSizes();

//     this.populateLocale();

//     this.toggleBlockQuote();

//     this.toggleQuoteChar();

//     this.forPostbox(true);

//     // Apply platform style
//     this.applyPlatformStyle();
//   },

//   toggleRwh: function() {
//     let rwh = ReplyWithHeader.byId('enableRwh');
//     var ids = ['lblFromAttribution', 'fromAttributionStyle', 'lblHeaderToCcAttrib', 'toccAttributionStyle',
//       'lblHdrDate', 'quotDateAttributionStyle', 'lblTypography', 'lblFontface', 'hdrFontface', 'lblFontsize',
//       'hdrFontsize', 'hdrFontsizeUnit', 'lblFontcolor', 'hdrFontColor', 'lblSpace', 'lblBeforeHeader', 'spaceBeforeHdr',
//       'lblAfterHeader', 'spaceAfterHdr', 'lblBeforeSeparator', 'spaceBeforeSep', 'lblSepLineSize', 'lblSepLineColor',
//       'hdrSepLineSize', 'hdrSepLineColor', 'lblHeaderQuotSeq', 'quotSeqAttributionStyle', 'quotTimeAttributionStyle',
//       'lblHeaderCleanups', 'hdrLocale', 'transSubjectPrefix', 'lblNotAppBeforeSeparator', 'lblCntFormat',
//       'cleanBlockQuote', 'cleanNewBlockQuote', 'cleanGreaterThanChar', 'lblHeaderFormat', 'excludePlainTextHdrPrefix',
//       'cleanOnlyNewQuoteChar', 'enableRwhDebugMode', 'quotDateIncludeTimezone'
//     ];

//     for (let len = ids.length, i = 0; i < len; i++) {
//       this.toggle(ids[i], !rwh.checked);
//     }

//     this.forPostbox(true);
//   },

//   toggle: function(id, v) {
//     let obj = ReplyWithHeader.byId(id);
//     if (obj) {
//       obj.disabled = v;
//     } else {
//       ReplyWithHeader.Log.debug('func: toggle - Element not found ['+ id +']');
//     }
//   },

//   forPostbox: function(v) {
//     if (ReplyWithHeader.isPostbox) {
//       this.toggle('lblBeforeSeparator', v);
//       this.toggle('spaceBeforeSep', v);
//       this.toggle('lblNotAppBeforeSeparator', v);
//     } else {
//       ReplyWithHeader.byId('lblNotAppBeforeSeparator').style.display = 'none';
//     }
//   },

//   toggleBlockQuote: function() {
//     let cbq = ReplyWithHeader.byId('cleanBlockQuote');
//     this.toggle('cleanNewBlockQuote', !cbq.checked);
//   },

//   toggleQuoteChar: function() {
//     let cqc = ReplyWithHeader.byId('cleanGreaterThanChar');
//     this.toggle('cleanOnlyNewQuoteChar', !cqc.checked);
//   },

//   applyPlatformStyle: function() {
//     if (rwhhost.isMacOSX) {
//       ReplyWithHeader.byId('hboxFromAttribution').style.marginTop = '-10px';
//       ReplyWithHeader.byId('hboxCntFormat').style.marginTop = '-10px';
//     }
//   }
// };

// // Initializing Services
// XPCOMUtils.defineLazyServiceGetter(ReplyWithHeader.Prefs, 'clipboard',
//                                   '@mozilla.org/widget/clipboardhelper;1',
//                                   'nsIClipboardHelper');