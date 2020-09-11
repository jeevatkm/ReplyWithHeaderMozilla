var { ExtensionCommon } = ChromeUtils.import('resource://gre/modules/ExtensionCommon.jsm');

var MsgCompose = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {    
    let { extension } = context;
    let { tabManager } = extension;
    let COMPOSE_WINDOW_URI = 'chrome://messenger/content/messengercompose/messengercompose.xhtml';

    function getComposeTab(tabId) {
      let tab = tabManager.get(tabId);
      // console.log(tab);
      let location = tab.nativeTab.location.href;
      // console.log(location);
      if (location != COMPOSE_WINDOW_URI) {
        throw new Error(`Not a valid compose window: ${location}`);
      }
      return tab;
    }
    
    return {
      MsgCompose: {
        resetModificationCount: function(tabId) {
          let tab = getComposeTab(tabId);
          let composeWindow = tab.nativeTab;
          composeWindow.gMsgCompose.bodyModified = false;
          composeWindow.gContentChanged = false;
        },

        beginningOfDocument: function(tabId) {
          let tab = getComposeTab(tabId);
          let composeWindow = tab.nativeTab;
          let editor = composeWindow.GetCurrentEditor();
          editor.beginningOfDocument();
        },

        endOfDocument: function(tabId) {
          let tab = getComposeTab(tabId);
          let composeWindow = tab.nativeTab;
          let editor = composeWindow.GetCurrentEditor();
          editor.endOfDocument();
        }
      }
    };
  }
};
