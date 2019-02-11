/*
 * Copyright (c) Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at
 * https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE
 */

'use strict';

/* globals ReplyWithHeader */

ChromeUtils.import('resource://gre/modules/XPCOMUtils.jsm');
ChromeUtils.import('resource://replywithheader/host.jsm');

ReplyWithHeader.Prefs = {
  getIntPref: function(p) {
    return this.branch.getIntPref('extensions.replywithheader.' + p);
  },

  getBoolPref: function(p) {
    return this.branch.getBoolPref('extensions.replywithheader.' + p);
  },

  getStringPref: function(p) {
    return this.branch.getCharPref('extensions.replywithheader.' + p);
  },

  get isEnabled() {
    return this.getBoolPref('enable');
  },

  get isDebugEnabled() {
    return this.getBoolPref('debug');
  },

  get fromLabelStyle() {
    return this.getIntPref('header.from.style');
  },

  get toccLabelStyle() {
    return this.getIntPref('header.tocc.style');
  },

  get beforeSepSpaceCnt() {
    return this.getIntPref('header.separator.space.before');
  },

  get beforeHdrSpaceCnt() {
    return this.getIntPref('header.space.before');
  },

  get afterHdrSpaceCnt() {
    return this.getIntPref('header.space.after');
  },

  get headerSepLineSize() {
    return this.getIntPref('header.separator.line.size');
  },

  get headerSepLineColor() {
    return this.getStringPref('header.separator.line.color');
  },

  get headerDateFormat() {
    return this.getIntPref('header.date.format');
  },

  get headerTimeFormat() {
    return this.getIntPref('header.time.format');
  },

  get headerIncludeTimeZone() {
    return this.getBoolPref('header.date.timezone');
  },

  get headerFontFace() {
    return this.getStringPref('header.font.face');
  },

  get headerFontSize() {
    return this.getIntPref('header.font.size');
  },

  get headerFontSizeUnit() {
    return this.getStringPref('header.font.size.unit');
  },

  get headerFontColor() {
    return this.getStringPref('header.font.color');
  },

  get headerQuotLblSeq() {
    return this.getIntPref('header.lblseq.style');
  },

  get headerLocale() {
    let hdrLocale = this.getStringPref('header.locale');
    if (hdrLocale == 'en') { // migrate settings value
      this.branch.setStringPref('extensions.replywithheader.header.locale', 'en-US');
      hdrLocale = 'en-US';
    }
    return hdrLocale;
  },

  get isSubjectPrefixEnabled() {
    return this.getBoolPref('trans.subject.prefix');
  },

  get cleanBlockQuote() {
    return this.getBoolPref('clean.blockquote');
  },

  get cleanNewBlockQuote() {
    return this.getBoolPref('clean.new.blockquote');
  },

  get cleanGreaterThanChar() {
    return this.getBoolPref('clean.char.greaterthan');
  },

  get cleanOnlyNewQuoteChar() {
    return this.getBoolPref('clean.only.new.quote.char');
  },

  get excludePlainTxtHdrPrefix() {
    return this.getBoolPref('clean.pln.hdr.prefix');
  },

  openWebsite: function() {
    ReplyWithHeader.openUrl(ReplyWithHeader.homepageUrl);
  },

  openReviews: function() {
    ReplyWithHeader.openUrl(ReplyWithHeader.reviewsPageUrl);
  },

  reportIssues: function() {
    ReplyWithHeader.openUrl(ReplyWithHeader.issuesPageUrl);
  },

  openPaypal: function() {
    ReplyWithHeader.showAlert('Opening PayPal Service. Thanks for supporting ReplyWithHeader.');
    ReplyWithHeader.openUrl(ReplyWithHeader.paypalDonateUrl);
  },

  copyBtcAddress: function() {
    this.copyToClipboard(ReplyWithHeader.btcAddress);
    ReplyWithHeader.showAlert('BTC address is copied. Thanks for supporting ReplyWithHeader.');
  },

  copyToClipboard: function(str) {
    if (str) {
      this.clipboard.copyString(str);
    }
  },

  fixCursorBlink: function() {
    // Ref: Due this Bug 567240 - Cursor does not blink when replying
    // (https://bugzilla.mozilla.org/show_bug.cgi?id=567240)
    // RWH is setting this 'mail.compose.max_recycled_windows' value to 0
    if (this.branch.getPrefType('mail.compose.max_recycled_windows')) {
      let maxRecycledWindows = this.branch.getIntPref('mail.compose.max_recycled_windows');
      if (maxRecycledWindows == 1) {
        this.branch.setIntPref('mail.compose.max_recycled_windows', 0);
      }
    } else {
      this.branch.setIntPref('mail.compose.max_recycled_windows', 0);
    }
  },

  createMenuItem: function(v, l) {
    var menuItem = document.createElement('menuitem');
    menuItem.setAttribute('value', v);
    menuItem.setAttribute('label', l);
    return menuItem;
  },

  loadFontFaces: function() {
    let allFonts = Cc['@mozilla.org/gfx/fontenumerator;1']
      .createInstance(Ci.nsIFontEnumerator).EnumerateAllFonts({});

    let hdrFontface = this.headerFontFace;
    let menuPopup = document.createElement('menupopup');
    let selectedIdx = 0;

    for (let fontCount = allFonts.length, i = 0; i < fontCount; i++) {
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
    let menuPopup = document.createElement('menupopup');
    let selectedIdx = 0;

    for (let i = 7, j = 0; i < 35; i++, j++) {
      menuPopup.appendChild(this.createMenuItem(i, i));
    }

    let hdrFontsizeObj = ReplyWithHeader.byId('hdrFontsize');
    hdrFontsizeObj.appendChild(menuPopup);
    hdrFontsizeObj.selectedIndex = this.headerFontSize - 7;
  },

  populateLocale: function() {
    var menu = ReplyWithHeader.byId('hdrLocale').firstChild;

    for (var lang in i18n.lang) {
      menu.appendChild(this.createMenuItem(
        lang, i18n.lang[lang] + ' (' + lang + ')'
      ));
    }
    menu.parentNode.value = this.headerLocale;
  },

  init: function() {
    this.toggleRwh();

    // Assigning RWH name and version #
    ReplyWithHeader.byId('abtRwhCaption').value = ReplyWithHeader.addOnName + ' v' + ReplyWithHeader.addOnVersion;

    let d = new Date();
    ReplyWithHeader.byId('abtRwhCopyrights').value = 'Ⓒ ' + d.getFullYear() + ' Jeevanandam M.'

    this.loadFontFaces();

    this.loadFontSizes();

    this.populateLocale();

    this.toggleBlockQuote();

    this.toggleQuoteChar();

    this.forPostbox(true);

    // Apply platform style
    this.applyPlatformStyle();
  },

  toggleRwh: function() {
    let rwh = ReplyWithHeader.byId('enableRwh');
    var ids = ['lblFromAttribution', 'fromAttributionStyle', 'lblHeaderToCcAttrib', 'toccAttributionStyle',
      'lblHdrDate', 'quotDateAttributionStyle', 'lblTypography', 'lblFontface', 'hdrFontface', 'lblFontsize',
      'hdrFontsize', 'hdrFontsizeUnit', 'lblFontcolor', 'hdrFontColor', 'lblSpace', 'lblBeforeHeader', 'spaceBeforeHdr',
      'lblAfterHeader', 'spaceAfterHdr', 'lblBeforeSeparator', 'spaceBeforeSep', 'lblSepLineSize', 'lblSepLineColor',
      'hdrSepLineSize', 'hdrSepLineColor', 'lblHeaderQuotSeq', 'quotSeqAttributionStyle', 'quotTimeAttributionStyle',
      'lblHeaderCleanups', 'hdrLocale', 'transSubjectPrefix', 'lblNotAppBeforeSeparator', 'lblCntFormat',
      'cleanBlockQuote', 'cleanNewBlockQuote', 'cleanGreaterThanChar', 'lblHeaderFormat', 'excludePlainTextHdrPrefix',
      'cleanOnlyNewQuoteChar', 'enableRwhDebugMode', 'quotDateIncludeTimezone'
    ];

    for (let len = ids.length, i = 0; i < len; i++) {
      this.toggle(ids[i], !rwh.checked);
    }

    this.forPostbox(true);
  },

  toggle: function(id, v) {
    let obj = ReplyWithHeader.byId(id);
    if (obj) {
      obj.disabled = v;
    } else {
      ReplyWithHeader.Log.debug('func: toggle - Element not found ['+ id +']');
    }
  },

  forPostbox: function(v) {
    if (ReplyWithHeader.isPostbox) {
      this.toggle('lblBeforeSeparator', v);
      this.toggle('spaceBeforeSep', v);
      this.toggle('lblNotAppBeforeSeparator', v);
    } else {
      ReplyWithHeader.byId('lblNotAppBeforeSeparator').style.display = 'none';
    }
  },

  toggleBlockQuote: function() {
    let cbq = ReplyWithHeader.byId('cleanBlockQuote');
    this.toggle('cleanNewBlockQuote', !cbq.checked);
  },

  toggleQuoteChar: function() {
    let cqc = ReplyWithHeader.byId('cleanGreaterThanChar');
    this.toggle('cleanOnlyNewQuoteChar', !cqc.checked);
  },

  applyPlatformStyle: function() {
    if (rwhhost.isMacOSX) {
      ReplyWithHeader.byId('hboxFromAttribution').style.marginTop = '-10px';
      ReplyWithHeader.byId('hboxCntFormat').style.marginTop = '-10px';
    } else if (rwhhost.isWindows) {
      ReplyWithHeader.byId('hdrFontsize').style.marginLeft = '6px';
      ReplyWithHeader.byId('spaceBeforeSep').style.marginLeft = '.63em';
      ReplyWithHeader.byId('hdrSepLineSize').style.marginLeft = '4.15em';
      ReplyWithHeader.byId('abtRwhLogo').style.marginLeft = '132px';
      ReplyWithHeader.byId('abtRwhCopyrights').style.marginLeft = '-133px';
      ReplyWithHeader.byId('hboxRwhBtn').style.marginLeft = '95px';
      ReplyWithHeader.byId('hboxEnableRwhDebugMode').style.marginLeft = '170px';
      ReplyWithHeader.byId('hboxDonateBtn').style.marginLeft = '16px';
    } else if (rwhhost.isLinux) {
      ReplyWithHeader.byId('hdrFontsize').style.marginLeft = '7px';
      ReplyWithHeader.byId('spaceBeforeSep').style.marginLeft = '0px';
      ReplyWithHeader.byId('hdrSepLineSize').style.marginLeft = '4.05em';
      ReplyWithHeader.byId('abtRwhLogo').style.marginLeft = '110px';
      ReplyWithHeader.byId('abtRwhCopyrights').style.marginLeft = '-164px';
      ReplyWithHeader.byId('hboxRwhBtn').style.marginLeft = '65px';
      ReplyWithHeader.byId('hboxDonateBtn').style.marginLeft = '19px';
    }
  }
};

// Initializing Services
XPCOMUtils.defineLazyServiceGetter(ReplyWithHeader.Prefs, 'branch',
                                   '@mozilla.org/preferences-service;1',
                                   'nsIPrefBranch');

XPCOMUtils.defineLazyServiceGetter(ReplyWithHeader.Prefs, 'clipboard',
                                  '@mozilla.org/widget/clipboardhelper;1',
                                  'nsIClipboardHelper');
