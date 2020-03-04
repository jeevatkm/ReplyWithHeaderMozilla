/*
 * Copyright (c) Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at
 * https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE
 */

/* globals Preferences */
Preferences.addAll([
    { id: 'extensions.replywithheader.enable', type: 'bool' },
    { id: 'extensions.replywithheader.header.locale', type: 'string' },
    { id: 'extensions.replywithheader.header.from.style', type: 'int' },
    { id: 'extensions.replywithheader.header.tocc.style', type: 'int' },
    { id: 'extensions.replywithheader.header.lblseq.style', type: 'int' },
    { id: 'extensions.replywithheader.header.date.format', type: 'int' },
    { id: 'extensions.replywithheader.header.time.format', type: 'int' },
    { id: 'extensions.replywithheader.header.date.timezone', type: 'bool' },
    { id: 'extensions.replywithheader.header.font.face', type: 'string' },
    { id: 'extensions.replywithheader.header.font.size', type: 'int' },
    { id: 'extensions.replywithheader.header.font.size.unit', type: 'string' },
    { id: 'extensions.replywithheader.header.font.color', type: 'string' },
    { id: 'extensions.replywithheader.header.space.before', type: 'int' },
    { id: 'extensions.replywithheader.header.space.after', type: 'int' },
    { id: 'extensions.replywithheader.header.separator.space.before', type: 'int' },
    { id: 'extensions.replywithheader.header.separator.line.size', type: 'int' },
    { id: 'extensions.replywithheader.header.separator.line.color', type: 'string' },
    { id: 'extensions.replywithheader.clean.blockquote', type: 'bool' },
    { id: 'extensions.replywithheader.clean.new.blockquote', type: 'bool' },
    { id: 'extensions.replywithheader.clean.char.greaterthan', type: 'bool' },
    { id: 'extensions.replywithheader.clean.only.new.quote.char', type: 'bool' },
    { id: 'extensions.replywithheader.trans.subject.prefix', type: 'bool' },
    { id: 'extensions.replywithheader.clean.pln.hdr.prefix', type: 'bool' },
    { id: 'extensions.replywithheader.debug', type: 'bool' },
]);