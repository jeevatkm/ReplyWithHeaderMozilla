/*
 * Copyright (c) Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at
 * https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE
 */

// RWH Compose Module

import * as rwhSettings from './settings.mjs';
import * as rwhI18n from './headers-i18n.mjs';

const positionBeforeBegin = 'beforebegin';
const positionAfterBegin = 'afterbegin';

export async function process(tab) {
    console.debug(`tab.id=${tab.id}, tab.type=${tab.type}, tab.mailTab=${tab.mailTab}`);

    let composeDetails = await messenger.compose.getComposeDetails(tab.id);
    console.debug(composeDetails);

    let fullMsg = await messenger.messages.getFull(composeDetails.relatedMessageId);
    console.info(fullMsg);

    let rwh = new ReplyWithHeader(composeDetails, fullMsg).init();
    if (!(rwh.isReply || rwh.isForward)) {
        console.warn(`Unsupported compose type ${rwh.composeType}`);
        return;
    }

    let result = await rwh.process();
    console.debug(result);
    messenger.compose.setComposeDetails(tab.id, {
        body: result.body,
        subject: result.subject,
        isModified: false
    });

}

class ReplyWithHeader {
    #composeDetails
    #fullMessage
    #document
    #text

    constructor(composeDetails, fullMessage) {
        this.#composeDetails = composeDetails;
        this.#fullMessage = fullMessage;
    }

    // Getters
    get composeType() {
        // reply or forward or draft
        return this.#composeDetails.type;
    }

    get isPlainText() {
        return this.#composeDetails.isPlainText;
    }

    get plainTextBody() {
        return this.#composeDetails.plainTextBody;
    }

    get htmlBody() {
        return this.#composeDetails.body;
    }

    get isReply() {
        return this.composeType === 'reply';
    }

    get isForward() {
        return this.composeType === 'forward';
    }

    get targetNodeClassName() {
        if (this.isReply) {
            return 'moz-cite-prefix'
        } else if (this.isForward) {
            return 'moz-email-headers-table'
        }
        return null;
    }

    // Setters


    // Method

    init() {
        console.debug(`composeType=${this.composeType}, messageId=${this.#composeDetails.relatedMessageId}, isPlainText=${this.#composeDetails.isPlainText}`);

        return this;
    }

    async process() {
        let result = null;

        if (this.isPlainText) {
            console.debug('Plain Text', this.plainTextBody);
            this.#text = this.plainTextBody;
            this._processPlainText();
        } else {
            console.debug('HTML Content', this.htmlBody);
            // Parse the message into an HTML document
            this.#document = this._createDocumentFromString(this.htmlBody);
            result = await this._processHtml();
        }

        if (result && rwhSettings.isTransSubjectPrefix()) {
            let subject = this.#composeDetails.subject;
            result.subject = this.isReply ? subject.replace('Re:', 'RE:')
                : subject.replace('Fwd:', 'FW:');
        }

        return result;
    }

    // So called private/internal methods

    async _processHtml() {
        let targetNodeClassName = this.targetNodeClassName;
        let targetNode = this._getByClassName(targetNodeClassName);
        if (!targetNode) {
            console.warn('Thunderbird email target node (moz-cite-prefix or moz-forward-container) not found');

            // return original value as-is;
            return {
                body: this.#composeDetails.body
            }
        }

        let div = this._createElement('div');
        div.classList.add(targetNodeClassName);

        var headers = {
            'from': this._extractAddress('from'),
            'to': this._extractAddress('to'),
            'cc': this._extractAddress('cc'),
            'date': this._extractAddress('date'),
            'reply-to': this._extractAddress('reply-to'),
            'subject': this._extractAddress('subject'),
        }

        console.log(headers);

        let rwhHeaderString = await this._createHtmlHeaders(headers);
        console.log(rwhHeaderString)

        let rwhHeaderHtmlElement = this._createElementFromString(rwhHeaderString);
        div.insertAdjacentElement(positionAfterBegin, rwhHeaderHtmlElement);
        targetNode.replaceWith(div);

        // put back the cleaned up <br> tags as-is
        if (this.isReply) {
            div.insertAdjacentElement(positionAfterBegin, this._createElement('br'));
        }
        if (this.isForward) {
            let mozForwardContainer = this._getByClassName('moz-forward-container');
            this._cleanNodesUpToClassName(mozForwardContainer, targetNodeClassName);
            mozForwardContainer.insertAdjacentElement(positionAfterBegin, this._createElement('br'));
        }

        return {
            body: new XMLSerializer().serializeToString(this.#document),
        }
    }

    _processPlainText() {
        console.log('_processPlainText called');

    }

    async _createHtmlHeaders(headers) {
        let locale = await rwhSettings.getHeaderLocale();
        let headerLabelSeq = await rwhSettings.getHeaderLabelSeqStyle();
        let headerLabelSeqValues = rwhSettings.headerLabelSeqStyleSettings[headerLabelSeq];

        let rwhHdr = '<div id="rwhHeaders"';
        if (await rwhSettings.isHeaderHtmlPrefixLine()) {
            let borderColor = await rwhSettings.getHeaderHtmlPrefixLineColor();
            rwhHdr += ` style="border:none;border-top:solid ${borderColor} 1.0pt;padding:3.0pt 0cm 0cm 0cm"`
        }
        rwhHdr += '>';

        headerLabelSeqValues.forEach(function (hdrKey, _) {
            if (hdrKey == 'reply-to' && this.isReply) {
                return;
            }

            let lbl = rwhI18n.i18n[hdrKey][locale]
            if (headerLabelSeq == 1 && hdrKey == 'date') {
                lbl = rwhI18n.i18n['sent'][locale]
            }

            if (headers[hdrKey]) {
                rwhHdr += '<p style="margin:0cm;font-size:11.5pt"><span><b>' + lbl + '</b> ' + headers[hdrKey] + '</span></p>';
            }
        }, this);

        rwhHdr += '</div><br>';

        return rwhHdr;
    }

    _extractAddress(key) {
        let values = this.#fullMessage.headers[key];
        if (!values) {
            return null;
        }

        let pv = [];
        for (let v of values) {
            pv.push(this._cleanEmail(v));
        }
        return this._escapeHtml(pv.join(', '));
    }

    _getByClassName(className) {
        return this.#document?.getElementsByClassName(className)?.[0];
    }

    _createElement(tagName) {
        return this.#document?.createElement(tagName);
    }

    _cleanEmail(v) {
        let pv = (v || '').replace(/\\/g, '').replace(/\"/g, '');
        if (pv.startsWith('<')) {
            pv = pv.substring(1, pv.length - 1);
        }
        return pv;
    }

    _escapeHtml(v) {
        return (v || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    }

    _createDocumentFromString(s) {
        return new DOMParser().parseFromString(s, 'text/html')
    }

    _createElementFromString(htmlString) {
        var div = document.createElement('div');
        div.innerHTML = htmlString.trim();
        return div.firstElementChild;
    }

    _cleanNodesUpToClassName(node, cssClassName) {
        while (node.firstChild) {
            if (node.firstChild?.className?.includes(cssClassName)) {
                break;
            }
            node.removeChild(node.firstChild);
        }
    }
}