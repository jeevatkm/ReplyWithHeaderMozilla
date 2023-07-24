var { ExtensionCommon } = ChromeUtils.import(
  "resource://gre/modules/ExtensionCommon.jsm"
);

var ReplyWithHeader = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    return {
      ReplyWithHeader: {
        getInstalledFonts: async function (aName) {
          return Cc['@mozilla.org/gfx/fontenumerator;1'].createInstance(Ci.nsIFontEnumerator).EnumerateAllFonts({});
        },
      },
    };
  }
};
