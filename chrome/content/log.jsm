/*
 * Copyright (c) Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at
 * https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE
 */

'use strict';

var EXPORTED_SYMBOLS = ["rwhlog"];

var Services = globalThis.Services || ChromeUtils.import(
  'resource://gre/modules/Services.jsm'
).Services;

// RWH logger
var rwhlog = {
    enableDebug: false,
    console: Services.console, // nsIConsoleService

    info: function(msg) {
      this._toConsole('INFO', msg);
    },
  
    debug: function(msg) {
      if (this.enableDebug) {
        this._toConsole('DEBUG', msg);
      }
    },
  
    error: function(msg) {
      this._toConsole('ERROR', msg);
    },
  
    errorWithException: function(msg, ex) {
      var stack = '';
      var group = 'ReplyWithHeader';
  
      if (typeof ex.stack != 'undefined') {
        stack = ex.stack.replace('@', '\n  ');
      }
  
      var srcName = ex.fileName || '';
      var scriptError = Cc['@mozilla.org/scripterror;1'].createInstance(Ci.nsIScriptError);
  
      // Addon generates this error, it is better to use warningFlag = 0x1
      scriptError.init(msg + '\n' + ex.message, srcName, stack, ex.lineNumber, 0, 0x1, group);
      this.console.logMessage(scriptError);
    },
  
    _toConsole: function(l, m) {
      this.console.logStringMessage('RWH  '+ l + '   ' + m);
    }
};