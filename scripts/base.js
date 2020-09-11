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
    debug: rwh.logLevel <= levels.debug ? console.debug.bind(window.console, 'RWH') : noop,
    info: rwh.logLevel <= levels.info ? console.info.bind(window.console, 'RWH') : noop,
    warn: rwh.logLevel <= levels.warn ? console.warn.bind(window.console, 'RWH') : noop,
    error: rwh.logLevel <= levels.error ? console.error.bind(window.console, 'RWH') : noop
  };

  if (rwh.logLevel <= levels.debug) {
    rwh.log.info('Debug mode enabled');
  }

}

async function loadRuntimeInfo() {
  let pi = await messenger.runtime.getPlatformInfo();
  let bi = await messenger.runtime.getBrowserInfo();
  let manifest = await messenger.runtime.getManifest();
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

  rwh.log.debug('Runtime Info', rwh.runtime);
}

async function initBase() {
  await initLogger();
  await loadRuntimeInfo();
}