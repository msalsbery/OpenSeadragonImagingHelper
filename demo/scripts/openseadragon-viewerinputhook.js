//! OpenSeadragonViewerInputHook 1.0.0
//! Build date: 2013-11-08
//! Git commit: v1.0.0-5-g5a832be
//! https://github.com/msalsbery/OpenSeadragonViewerInputHook
/* 
 * Copyright (c) 2013 Mark Salsbery
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * @author Mark Salsbery <msalsbery@hotmail.com>
 */

(function($) {

    $.Viewer.prototype.addViewerInputHook = function(options) {
        options = options || {};
        options.viewer = this;
        return new $.ViewerInputHook(options);
    };

    /**
     *
     * @class
     * @param {Object} options
     * @param {Object} options.viewer 
     *
     **/
    $.ViewerInputHook = function(options) {
        options = options || {};

        if (!options.viewer) {
            throw new Error("A viewer must be specified.");
        }

        var tracker = options.viewer.innerTracker;

        var callHandlers = function (hookHandler, origHandler, event) {
            var ret = hookHandler(event);
            if (origHandler && !event.stopHandlers) {
                ret = origHandler(event);
            }
            return event.stopBubbling ? false : ret;
        };

        if (options.onViewerEnter) {
            var origOnViewerEnter = tracker.enterHandler;
            tracker.enterHandler = function (event) {
                return callHandlers(options.onViewerEnter, origOnViewerEnter, event);
            };
        }
        if (options.onViewerExit) {
            var origOnViewerExit = tracker.exitHandler;
            tracker.exitHandler = function (event) {
                return callHandlers(options.onViewerExit, origOnViewerExit, event);
            };
        }
        if (options.onViewerPress) {
            var origOnViewerPress = tracker.pressHandler;
            tracker.pressHandler = function (event) {
                return callHandlers(options.onViewerPress, origOnViewerPress, event);
            };
        }
        if (options.onViewerRelease) {
            var origOnViewerRelease = tracker.releaseHandler;
            tracker.releaseHandler = function (event) {
                return callHandlers(options.onViewerRelease, origOnViewerRelease, event);
            };
        }
        if (options.onViewerMove) {
            var origOnViewerMove = tracker.moveHandler;
            tracker.moveHandler = function (event) {
                return callHandlers(options.onViewerMove, origOnViewerMove, event);
            };
        }
        if (options.onViewerScroll) {
            var origOnViewerScroll = tracker.scrollHandler;
            tracker.scrollHandler = function (event) {
                return callHandlers(options.onViewerScroll, origOnViewerScroll, event);
            };
        }
        if (options.onViewerClick) {
            var origOnViewerClick = tracker.clickHandler;
            tracker.clickHandler = function (event) {
                return callHandlers(options.onViewerClick, origOnViewerClick, event);
            };
        }
        if (options.onViewerDrag) {
            var origOnViewerDrag = tracker.dragHandler;
            tracker.dragHandler = function (event) {
                return callHandlers(options.onViewerDrag, origOnViewerDrag, event);
            };
        }
        if (options.onViewerKey) {
            var origOnViewerKey = tracker.keyHandler;
            tracker.keyHandler = function (event) {
                return callHandlers(options.onViewerKey, origOnViewerKey, event);
            };
        }
        if (options.onViewerFocus) {
            var origOnViewerFocus = tracker.focusHandler;
            tracker.focusHandler = function (event) {
                return callHandlers(options.onViewerFocus, origOnViewerFocus, event);
            };
        }
        if (options.onViewerBlur) {
            var origOnViewerBlur = tracker.blurHandler;
            tracker.blurHandler = function (event) {
                return callHandlers(options.onViewerBlur, origOnViewerBlur, event);
            };
        }
    };

}(OpenSeadragon));
