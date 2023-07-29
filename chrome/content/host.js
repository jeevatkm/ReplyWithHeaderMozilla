/*
 * Copyright (c) Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at
 * https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE
 */

'use strict';

// Host related definitions
var host = {
  appinfo: Services.appinfo, // nsIXULAppInfo, nsIXULRuntime

  get app() {
    let appId = this.appinfo.ID;
    if (appId == '{3550f703-e582-4d05-9a08-453d09bdfdc6}') {
      return 'Thunderbird';
    }
    return 'unknown';
  },

  get OS() {
    let platform = this.appinfo.OS.toLowerCase();
    if (platform == 'darwin') {
      return 'macOS'
    } else if (platform == 'linux') {
      return 'Linux'
    } else if (platform == 'winnt') {
      return 'Windows'
    }
    return "unknown"
  },

  get version() {
    return this.appinfo.version;
  },

  get buildID() {
    return this.appinfo.appBuildID;
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

  get isThunderbird() {
    return (this.app == 'Thunderbird');
  }
};
