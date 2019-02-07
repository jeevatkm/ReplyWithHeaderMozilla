/*
 * Copyright (c) Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at
 * https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE
 */

'use strict';

var EXPORTED_SYMBOLS = ["rwhhost"];

ChromeUtils.import('resource://gre/modules/XPCOMUtils.jsm');

 // Host related definitions
var rwhhost = {
  get app() {
    let appId = this.appInfo.ID;
    if (appId == '{3550f703-e582-4d05-9a08-453d09bdfdc6}') {
      return 'Thunderbird';
    } else if (appId == 'postbox@postbox-inc.com') {
      return 'Postbox';
    }
    return 'unknown';
  },

  get OS() {
    let platform = this.appInfo.OS.toLowerCase();
    if (platform === 'darwin') {
      return 'macOS'
    } else if (platform === 'linux') {
      return 'Linux'
    } else if (platform === 'winnt') {
      return 'Windows'
    }
    return "unknown"
  },

  get version() {
    return this.appRuntime.version;
  },

  get buildID() {
    return this.appRuntime.appBuildID;
  },

  get isMacOSX() {
    return (this.OS == 'macOS');
  },

  get isLinux() {
    return (this.OS == 'Linux');
  },

  get isWindows() {
    return (this.OS == 'Windows');
  },

  get isPostbox() {
    return (this.app == 'Postbox');
  },

  get isThunderbird() {
    return (this.app == 'Thunderbird');
  }
};

// Initializing Services
// https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIXULAppInfo
XPCOMUtils.defineLazyServiceGetter(rwhhost, 'appInfo',
                                   '@mozilla.org/xre/app-info;1',
                                   'nsIXULAppInfo');

// https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIXULRuntime
XPCOMUtils.defineLazyServiceGetter(rwhhost, 'appRuntime',
                                  '@mozilla.org/xre/app-info;1',
                                  'nsIXULRuntime');