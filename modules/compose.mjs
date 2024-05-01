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
const fwdHdrLookupString = '-------- ';

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

    await rwh.process(tab);
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

    async process(tab) {
        let result = {isModified: false};

        if (rwhSettings.isTransSubjectPrefix()) {
            let subject = this.#composeDetails.subject;
            if (this.isReply) {
                result.subject = subject.replace('Re:', 'RE:')
            }
            if (this.isForward) {
                result.subject = subject.replace('Fwd:', 'FW:');
            }
        }

        if (this.isPlainText) {
            console.debug('Plain Text', this.plainTextBody);
            this.#text = this.plainTextBody;
            result = Object.assign({}, result, await this._processPlainText());
        } else {
            console.debug('HTML Content', this.htmlBody);
            this.#document = this._createDocumentFromString(this.htmlBody);
            result = Object.assign({}, result, await this._processHtml());
        }

        // Apply it to message compose window
        console.debug(result);
        messenger.compose.setComposeDetails(tab.id, result);
    }

    // So called private/internal methods

    async _processHtml() {
        let targetNodeClassName = this.targetNodeClassName;
        let targetNode = this._getByClassName(targetNodeClassName);
        if (!targetNode) {
            console.error('Thunderbird email target node (moz-cite-prefix or moz-forward-container) is not found');
            console.error('Due to internal changes in Thunderbird. RWH unable to process email headers, contact add-on author');

            // return original value as-is;
            return {
                body: this.#composeDetails.body
            }
        }

        let div = this._createElement('div');
        div.classList.add(targetNodeClassName);

        var headers = {
            'from': this._extractHeader('from', true, true),
            'to': this._extractHeader('to', true, true),
            'cc': this._extractHeader('cc', true, true),
            'date': this._extractHeader('date', false, true),
            'reply-to': this._extractHeader('reply-to', true, true),
            'subject': this._extractHeader('subject', false, true),
        }
        console.log(headers);

        let rwhHeaderString = await this._createHtmlHeaders(headers);
        console.log(rwhHeaderString);

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

    async _processPlainText() {
        var headers = {
            'from': this._extractHeader('from', true, false),
            'to': this._extractHeader('to', true, false),
            'cc': this._extractHeader('cc', true, false),
            'date': this._extractHeader('date', false, false),
            'reply-to': this._extractHeader('reply-to', true, false),
            'subject': this._extractHeader('subject', false, false),
        }
        console.log(headers);

        let rwhHeaders = await this._createPlainTextHeaders(headers);
        console.log(rwhHeaders);

        let textLines = this.#text.split(/\r?\n/);
        console.log(textLines);

        let locale = await rwhSettings.getHeaderLocale();
        let startPos = 0;
        let linesToDelete = 1;
        if (this.isReply) {
            let lookupWroteString = rwhI18n.i18n['wrote'][locale];
            for(let l of textLines) {
                if (l.trim().includes(lookupWroteString)) {
                    break;
                }
                startPos++;
            }
        } else if (this.isForward) {
            linesToDelete = rwhHeaders.length;
            for(let l of textLines) {
                if (l.trim().startsWith(fwdHdrLookupString)) {
                    break;
                }
                startPos++;
            }
        }

        console.log('startPos', startPos, textLines[startPos]);
        textLines.splice(startPos, linesToDelete, ...rwhHeaders);

        this.#text = textLines.join('\r\n');
        return {
            plainTextBody: this.#text
        }
    }

    async _createHtmlHeaders(headers) {
        let locale = await rwhSettings.getHeaderLocale();
        let headerLabelSeq = await rwhSettings.getHeaderLabelSeqStyle();
        let headerLabelSeqValues = rwhSettings.headerLabelSeqStyleSettings[headerLabelSeq];

        let rwhHeaders = '<div id="rwhHeaders"';
        if (await rwhSettings.isHeaderHtmlPrefixLine()) {
            let borderColor = await rwhSettings.getHeaderHtmlPrefixLineColor();
            rwhHeaders += ` style="border:none;border-top:solid ${borderColor} 1.0pt;padding:3.0pt 0cm 0cm 0cm"`
        }
        rwhHeaders += '>';

        headerLabelSeqValues.forEach(function (hdrKey, _) {
            if (hdrKey == 'reply-to' && this.isReply) {
                return;
            }

            let lbl = rwhI18n.i18n[hdrKey][locale]
            if (headerLabelSeq == 1 && hdrKey == 'date') {
                lbl = rwhI18n.i18n['sent'][locale]
            }

            if (headers[hdrKey]) {
                rwhHeaders += '<p style="margin:0cm;font-size:11.5pt"><span><b>' + lbl + '</b> ' + headers[hdrKey] + '</span></p>';
            }
        }, this);

        rwhHeaders += '</div><br>';

        return rwhHeaders;
    }

    async _createPlainTextHeaders(headers) {
        let locale = await rwhSettings.getHeaderLocale();
        let headerLabelSeq = await rwhSettings.getHeaderLabelSeqStyle();
        let headerLabelSeqValues = rwhSettings.headerLabelSeqStyleSettings[headerLabelSeq];
        let lineBreak = '\r\n';

        let rwhHeaders = [];
        if (await rwhSettings.isHeaderPlainPrefixText()) {
            rwhHeaders.push(this.isForward
                ? '-------- ' + rwhI18n.i18n.forwardedMessage[locale] + ' --------'
                : '-------- ' + rwhI18n.i18n.originalMessage[locale] + ' --------');
        } else {
            if (this.isForward) {
                rwhHeaders.push('');
            }
        }

        headerLabelSeqValues.forEach(function (hdrKey, _) {
            if (hdrKey == 'reply-to' && this.isReply) {
                return;
            }

            let lbl = rwhI18n.i18n[hdrKey][locale]
            if (headerLabelSeq == 1 && hdrKey == 'date') {
                lbl = rwhI18n.i18n['sent'][locale]
            }

            if (headers[hdrKey]) {
                rwhHeaders.push(lbl + ' ' + headers[hdrKey]);
            }
        }, this);

        rwhHeaders.push('');

        return rwhHeaders;
    }

    _extractHeader(key, clean, escape) {
        let values = this.#fullMessage.headers[key];
        if (!values) {
            return null;
        }

        let pv = [];
        for (let v of values) {
            pv.push((clean ? this._cleanEmail(v) : v));
        }
        return escape ? this._escapeHtml(pv.join(', ')) : pv.join(', ');
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