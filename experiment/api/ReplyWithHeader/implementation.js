var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
var { ExtensionParent } = ChromeUtils.import("resource://gre/modules/ExtensionParent.jsm");
var extension = ExtensionParent.GlobalManager.getExtension("replywithheader@myjeeva.com");

function fixCursorBlink() {
  // Ref: Due this Bug 567240 - Cursor does not blink when replying
  // (https://bugzilla.mozilla.org/show_bug.cgi?id=567240)
  // RWH is setting this 'mail.compose.max_recycled_windows' value to 0
  if (Services.prefs.getPrefType('mail.compose.max_recycled_windows')) {
    let maxRecycledWindows = Services.prefs.getIntPref('mail.compose.max_recycled_windows');
    if (maxRecycledWindows == 1) {
      Services.prefs.setIntPref('mail.compose.max_recycled_windows', 0);
    }
  } else {
    Services.prefs.setIntPref('mail.compose.max_recycled_windows', 0);
  }
}

function composeWindowIsReady(composeWindow) {
  return new Promise(resolve => {
    if (composeWindow.composeEditorReady) {
      resolve();
      return;
    }
    composeWindow.addEventListener("compose-editor-ready", resolve, {
      once: true,
    });
  });
}

async function install(window) {
  if (window.ReplyWithHeader) {
    return;
  }

  // Do this for each new open composer, just to be sure.
  fixCursorBlink();
  await composeWindowIsReady(window);
  
  // Load an additional JavaScript file.
  Services.scriptloader.loadSubScript(extension.rootURI.resolve("chrome/content/core.js"), window, 'UTF-8');
  Services.scriptloader.loadSubScript(extension.rootURI.resolve("chrome/content/prefs.js"), window.ReplyWithHeader, 'UTF-8');
  Services.scriptloader.loadSubScript(extension.rootURI.resolve("chrome/content/i18n.js"), window.ReplyWithHeader, 'UTF-8');
  Services.scriptloader.loadSubScript(extension.rootURI.resolve("chrome/content/log.js"), window.ReplyWithHeader, 'UTF-8');
  Services.scriptloader.loadSubScript(extension.rootURI.resolve("chrome/content/host.js"), window.ReplyWithHeader, 'UTF-8');
  window.ReplyWithHeader.init();
}

function uninstall(window) {
  // There is not much to do
}

var ReplyWithHeader = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    /**
     * Returns messageCompose window associated with the given tab.
     *
     * @param {integer} tabId
     * @returns {DOMWindow} window
     */
    function getComposeWindow(tabId) {
      let { nativeTab } = context.extension.tabManager.get(tabId);
      if (nativeTab instanceof Ci.nsIDOMWindow && nativeTab.document.documentElement.getAttribute("windowtype") == "msgcompose") {
        return nativeTab;
      }
      return null;
    }

    return {
      ReplyWithHeader: {
        async getInstalledFonts (aName) {
          return Cc['@mozilla.org/gfx/fontenumerator;1'].createInstance(Ci.nsIFontEnumerator).EnumerateAllFonts({});
        },
        async patchTab (tabId) {
          let window = getComposeWindow(tabId);
          if (!window) {
            return;
          }
          await install(window);
        }
      },
    };
  }

  onShutdown(isAppShutdown) {
    if (isAppShutdown) return;

    // Uninstall from any composeWindow.
    for (let window of Services.wm.getEnumerator("msgcompose")) {
      uninstall(window);
    }
  }
};
