/*
 * Copyright (c) Jeevanandam M. (jeeva@myjeeva.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at
 * https://github.com/jeevatkm/ReplyWithHeaderMozilla/blob/master/LICENSE
 */

// RWH Logger Module

const _no_op = function () { };

export var rwhLogger = {
    LevelError: 1,
    LevelWarn: 2,
    LevelInfo: 3,
    LevelDebug: 4,

    get level() {
        return this._level;
    },

    set level(level) {
        this.error = (level >= this.LevelError)
            ? console.error.bind(window.console, 'RWH:ERROR::')
            : _no_op;

        this.warn = (level >= this.LevelWarn)
            ? console.warn.bind(window.console, 'RWH:WARN::')
            : _no_op;

        this.info = (level >= this.LevelInfo)
            ? console.info.bind(window.console, 'RWH:INFO::')
            : _no_op;

        this.debug = (level >= this.LevelDebug)
            ? console.debug.bind(window.console, 'RWH:DEBUG::')
            : _no_op;

        this._level = level;
    }
};

// Log Level
rwhLogger.level = rwhLogger.LevelInfo;
