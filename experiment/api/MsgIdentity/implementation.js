var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
var { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");

var MsgIdentity = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    // let { extension } = context;
    // let { tabManager } = extension;

    return {
      MsgIdentity: {
        getIdentitySettings: function(identityId) {
          let identity = MailServices.accounts.allIdentities.find(
            i => i.key == identityId
          );
          if (identity === undefined || !identity) {
            throw new Error(`Not a valid identity Id: ${identityId}`)
          }

          return {
            replyOnTop: !!Number(identity.replyOnTop),
            sigOnBottom: identity.sigBottom,
            sigOnForward: identity.getBoolAttribute('sig_on_fwd'),
            sigOnReply: identity.getBoolAttribute('sig_on_reply'),
            attachSignature: identity.attachSignature,
            composeHtml: identity.composeHtml,
          };
        }
      }
    };
  }
};
