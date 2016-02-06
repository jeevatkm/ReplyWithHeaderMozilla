/*
 * Copyright (c) 2015-2016 Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code is subject to terms of MIT License.
 * Please refer to LICENSE.txt in the root folder of RWH extension.
 * You can download a copy of license at https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE.txt
 */

// jshint strict: false

// RWH default preferences values
pref('extensions.replywithheader.enable', true);

// RWH Header
pref('extensions.replywithheader.header.from.style', 1);
pref('extensions.replywithheader.header.tocc.style', 1);
pref('extensions.replywithheader.header.lblseq.style', 1);
pref('extensions.replywithheader.header.font.face', 'Tahoma');
pref('extensions.replywithheader.header.font.size', 13);
pref('extensions.replywithheader.header.font.color', '#000000');
pref('extensions.replywithheader.header.separator.space.before', 0);
pref('extensions.replywithheader.header.space.before', 0);
pref('extensions.replywithheader.header.space.after', 1);
pref('extensions.replywithheader.trans.subject.prefix', false);

// As per http://momentjs.com/docs/#/displaying/format/
// 0 - Locale date format
// 1 - International date format - GMT
pref('extensions.replywithheader.header.date.format', 0);

// RWH Mail message
pref('extensions.replywithheader.clean.blockquote', true);
pref('extensions.replywithheader.clean.new.blockquote', false);
pref('extensions.replywithheader.clean.char.greaterthan', true);
pref('extensions.replywithheader.clean.pln.hdr.prefix', false);

// RWH Debug settings
pref('extensions.replywithheader.debug', false);
