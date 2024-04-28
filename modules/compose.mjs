/*
 * Copyright (c) Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at
 * https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE
 */

// RWH Compose Module

async function process(tab) {
    console.debug(`tab.id=${tab.id}, tab.type=${tab.type}, tab.mailTab=${tab.mailTab}`);

    // Get the existing message.
    let composeDetails = await messenger.compose.getComposeDetails(tab.id);
    console.debug(composeDetails);

    // TODO remove
    // await messenger.compose.setComposeDetails(tab.id, {
    //     subject: 'RW: ' + composeDetails.subject + ' welcome',
    //     isModified: false
    // });

    let { type, relatedMessageId } = composeDetails;
    console.debug(`composeType=${type}, relatedMessageId=${relatedMessageId}`);

    let fullMsg = await messenger.messages.getFull(relatedMessageId);
    console.info(fullMsg.headers);

}


export { process };
