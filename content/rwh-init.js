"use strict";

// Registering RWH into compose window Thunderbird/Postbox
window.setTimeout( function(){
	document.getElementById('msgcomposeWindow')
                    .addEventListener('compose-window-init', ReplyWithHeader.initListener, false);
},10 );
