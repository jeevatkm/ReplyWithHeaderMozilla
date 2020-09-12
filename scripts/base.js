/*
* Copyright (c) Jeevanandam M. (jeeva@myjeeva.com)
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at
* https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE
*/

// define 'rwh' if not exists
if (typeof rwh === 'undefined') { var rwh = {}; }
else if (rwh.runtime && rwh.runtime.name != 'replywithheader-mail-extension@myjeeva.com') {
  throw new Error("RWH mail extension may not work due to namespace 'rwh' conflict");
}

// It is important TB provides out-of-the-box like interface 'nsIMsgCompType'
const TbMsgCompType = Object.freeze({
  New: 0,
  Reply: 1,
  ReplyAll: 2,
  ForwardAsAttachment: 3,
  ForwardInline: 4,
  NewsPost: 5,
  ReplyToSender: 6,
  ReplyToGroup: 7,
  ReplyToSenderAndGroup: 8,
  Draft: 9,
  Template: 10,
  MailToUrl: 11,
  ReplyWithTemplate: 12,
  fromValue: function(v) {
    return Object.keys(TbMsgCompType).find(k => TbMsgCompType[k] === v);
  },
});

async function initLogger() {
  if (typeof rwh.log !== 'undefined') {
    console.error('rwh is already defined - ref base');
    return; // already defined
  }

  let noop = function(){};
  let levels = { debug: 0, info: 1, warn: 2, error: 3 };

  // await messenger.storage.local.set({options: {debug: true}});
  let results = await messenger.storage.local.get('options');
  rwh.logLevel = results.options && results.options.logLevel || 0;

  // RWH simple logger module
  rwh.log = {
    levelToName: function(level) {
      return Object.keys(levels).find(k => levels[k] === level) || 'unknown';
    },
    debug: rwh.logLevel <= levels.debug ? console.debug.bind(window.console, 'RWH') : noop,
    info: rwh.logLevel <= levels.info ? console.info.bind(window.console, 'RWH') : noop,
    warn: rwh.logLevel <= levels.warn ? console.warn.bind(window.console, 'RWH') : noop,
    error: rwh.logLevel <= levels.error ? console.error.bind(window.console, 'RWH') : noop
  };

  console.info(`RWH Log level: ${rwh.log.levelToName(rwh.logLevel).toUpperCase()}`);
}

async function initInfo() {
  let manifest = await messenger.runtime.getManifest();

  // Defining about info
  let about = {};
  Object.defineProperties(about, {
    homepageUrl: { value: manifest.homepage_url, enumerable: true },
    addonUrl: { value: 'https://addons.mozilla.org/en-US/thunderbird/addon/replywithheader/', enumerable: true },
    supportUrl: { value: 'https://github.com/jeevatkm/ReplyWithHeaderMozilla/issues', enumerable: true },
    btcAddress: { value: '1FG6G5tCmFm7vrc7BzUyRxr3RBrMDJA6zp', enumerable: true },
    paypalDonateUrl: { value: 'https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=QWMZG74FW4QYC&lc=US&item_name=Jeevanandam%20M%2e&item_number=ReplyWithHeaderMozilla&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted', enumerable: true },
  });
  Object.defineProperty(rwh, 'about', { value: about, enumerable: true })

  // Defining runtime info
  let pi = await messenger.runtime.getPlatformInfo();
  let bi = await messenger.runtime.getBrowserInfo();
  let osFullName = { mac: 'macOS', win: 'Windows', linux: 'Linux' };
  let runtime = {};
  Object.defineProperties(runtime, {
    name: { value: manifest.name, enumerable: true },
    version: { value: manifest.version, enumerable: true },
    appName: { value: bi.name, enumerable: true },
    appVersion: { value: bi.version, enumerable: true },
    os: { value: osFullName[pi.os], enumerable: true },
    osArch: { value: pi.arch, enumerable: true },
    isMacOS: { get() { return this.os == osFullName.mac; }, enumerable: true },
    isLinux: { get() { return this.os == osFullName.linux; }, enumerable: true },
    isWindows: { get() { return this.os == osFullName.win; }, enumerable: true }
  });
  Object.defineProperty(rwh, 'runtime', { value: runtime, enumerable: true })
}

async function initBase() {
  await initLogger();
  await initInfo();
}