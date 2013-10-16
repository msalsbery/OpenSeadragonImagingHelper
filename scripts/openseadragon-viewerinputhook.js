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

        if (options.enterHandler) {
            var origEnterHandler = tracker.enterHandler;
            tracker.enterHandler = function (event) {
                return callHandlers(options.enterHandler, origEnterHandler, event);
            };
        }
        if (options.exitHandler) {
            var origExitHandler = tracker.exitHandler;
            tracker.exitHandler = function (event) {
                return callHandlers(options.exitHandler, origExitHandler, event);
            };
        }
        if (options.pressHandler) {
            var origPressHandler = tracker.pressHandler;
            tracker.pressHandler = function (event) {
                return callHandlers(options.pressHandler, origPressHandler, event);
            };
        }
        if (options.releaseHandler) {
            var origReleaseHandler = tracker.releaseHandler;
            tracker.releaseHandler = function (event) {
                return callHandlers(options.releaseHandler, origReleaseHandler, event);
            };
        }
        if (options.moveHandler) {
            var origMoveHandler = tracker.moveHandler;
            tracker.moveHandler = function (event) {
                return callHandlers(options.moveHandler, origMoveHandler, event);
            };
        }
        if (options.scrollHandler) {
            var origScrollHandler = tracker.scrollHandler;
            tracker.scrollHandler = function (event) {
                return callHandlers(options.scrollHandler, origScrollHandler, event);
            };
        }
        if (options.clickHandler) {
            var origClickHandler = tracker.clickHandler;
            tracker.clickHandler = function (event) {
                return callHandlers(options.clickHandler, origClickHandler, event);
            };
        }
        if (options.dragHandler) {
            var origDragHandler = tracker.dragHandler;
            tracker.dragHandler = function (event) {
                return callHandlers(options.dragHandler, origDragHandler, event);
            };
        }
        if (options.keyHandler) {
            var origKeyHandler = tracker.keyHandler;
            tracker.keyHandler = function (event) {
                return callHandlers(options.keyHandler, origKeyHandler, event);
            };
        }
        if (options.focusHandler) {
            var origFocusHandler = tracker.focusHandler;
            tracker.focusHandler = function (event) {
                return callHandlers(options.focusHandler, origFocusHandler, event);
            };
        }
        if (options.blurHandler) {
            var origBlurHandler = tracker.blurHandler;
            tracker.blurHandler = function (event) {
                return callHandlers(options.blurHandler, origBlurHandler, event);
            };
        }
    };

}(OpenSeadragon));
