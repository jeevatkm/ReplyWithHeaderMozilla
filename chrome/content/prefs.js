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

var prefs = {

  getIntPref: function(p) {
    return Services.prefs.getIntPref('extensions.replywithheader.' + p);
  },

  getBoolPref: function(p) {
    return Services.prefs.getBoolPref('extensions.replywithheader.' + p);
  },

  getStringPref: function(p) {
    return Services.prefs.getCharPref('extensions.replywithheader.' + p);
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
      Services.prefs.setStringPref('extensions.replywithheader.header.locale', 'en-US');
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

};
