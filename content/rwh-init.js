"use strict";

/*
 * Copyright (c) 2015 Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code is subject to terms of MIT License.
 * Please refer to LICENSE.txt in the root folder of RWH extension.
 * You download a copy of license at https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE.txt
 */

// Registering RWH into compose window Thunderbird/Postbox
window.setTimeout( function(){
	document.getElementById('msgcomposeWindow')
                    .addEventListener('compose-window-init', ReplyWithHeader.initListener, false);
},10 );
