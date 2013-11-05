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
 * @external OpenSeadragon
 * @see {@link http://openseadragon.github.io/docs/symbols/OpenSeadragon.html OpenSeadragon.Viewer Documentation}
 */

/**
 * @external "OpenSeadragon.Viewer"
 * @see {@link http://openseadragon.github.io/docs/symbols/OpenSeadragon.Viewer.html OpenSeadragon.Viewer Documentation}
 */

/**
 * @external "OpenSeadragon.EventSource"
 * @see {@link http://openseadragon.github.io/docs/symbols/OpenSeadragon.EventHandler.html OpenSeadragon.EventSource Documentation}
 */

/**
 * @external "OpenSeadragon.Point"
 * @see {@link http://openseadragon.github.io/docs/symbols/OpenSeadragon.Point.html OpenSeadragon.EventSource Documentation}
 */

/**
 * @namespace OpenSeadragon
 * @extends external:OpenSeadragon
 */
(function($) {

    /**
     * Event handler method signature used by all OpenSeadragon events.
     *
     * @callback eventHandler
     * @memberof OpenSeadragon
     * @param {object} event - See individual events for event properties passed.
     */

    /**
     *
     * @class OpenSeadragon.Viewer
     * @memberof OpenSeadragon
     * @extends external:"OpenSeadragon.Viewer"
     *
     **/

    /**
     * Creates a new ImagingHelper attached to the viewer.
     *
     * @memberof OpenSeadragon.Viewer
     * @method OpenSeadragon.Viewer#activateImagingHelper
     * @param {Object} options
     * @param {OpenSeadragon.eventHandler} [options.viewChangedHandler] - {@link OpenSeadragon.ImagingHelper.event:image-view-changed} handler method.
     *
     **/
    $.Viewer.prototype.activateImagingHelper = function(options) {
        if (!this.imagingHelper) {
            options = options || {};
            options.viewer = this;
            this.imagingHelper = new $.ImagingHelper(options);
        }
        return this.imagingHelper;
    };

    /**
     * Creates a new ImagingHelper attached to the viewer instance passed in the options parameter.
     *
     * @class ImagingHelper
     * @classdesc Provides imaging helper methods and properties for the OpenSeadragon viewer.
     * @memberof OpenSeadragon
     * @extends external:"OpenSeadragon.EventSource"
     * @param {Object} options
     * @param {external:"OpenSeadragon.Viewer"} options.viewer - Required! Reference to OpenSeadragon viewer to attach to.
     * @param {OpenSeadragon.eventHandler} [options.viewChangedHandler] - {@link OpenSeadragon.ImagingHelper.event:image-view-changed} handler method.
     *
     **/
    $.ImagingHelper = function(options) {
        options = options || {};

        if (!options.viewer) {
            throw new Error("A viewer must be specified.");
        }

        if (!options.viewer.imagingHelper) {
            options.viewer.imagingHelper = this;
        }

        // TODO Scope these public

        /**
         * A reference to the options passed at creation.
         * @member {object} options
         * @memberof OpenSeadragon.ImagingHelper#
         * @property {external:"OpenSeadragon.Viewer"} viewer - Reference to OpenSeadragon viewer this ImagingHelper is attached to.
         * @property {OpenSeadragon.eventHandler} [viewChangedHandler] - {@link OpenSeadragon.ImagingHelper.event:image-view-changed} handler method.
         */
        this.options = options;
        /**
         * The image's native width in pixels.
         * @member {number} imgWidth
         * @memberof OpenSeadragon.ImagingHelper#
         */
        this.imgWidth = 0.0;
        /**
         * The image's native height in pixels.
         * @member {number} imgHeight
         * @memberof OpenSeadragon.ImagingHelper#
         */
        this.imgHeight = 0.0;
        /**
         * The image's aspect ratio (width / height).
         * @member {number} imgAspectRatio
         * @memberof OpenSeadragon.ImagingHelper#
         */
        this.imgAspectRatio = 0.0;

        // TODO Scope these private

        this._zoomFactor = 1.0;
        this._minZoom = 0.001;
        this._maxZoom = 10;
        this._zoomStepPercent = 30;
        this._viewer = options.viewer;
        this._haveImage = false;
        // Unadjusted viewport settings (aspect ratio not applied)
        // All coordinates are logical (0 to 1) relative to the image
        this._viewportWidth = 0.0;
        this._viewportHeight = 0.0;
        this._viewportOrigin = new OpenSeadragon.Point(0, 0);
        this._viewportCenter = new OpenSeadragon.Point(0, 0);

        $.EventSource.call(this);
        
        if (options.viewChangedHandler) {
            this.addHandler('image-view-changed', options.viewChangedHandler);
        }

        this._viewer.addHandler("open", $.delegate(this, this.onOpen));
        this._viewer.addHandler("close", $.delegate(this, this.onClose));
        this._viewer.addHandler("animation", $.delegate(this, this.onAnimation));
        this._viewer.addHandler("animation-finish", $.delegate(this, this.onAnimationFinish));
        this._viewer.addHandler("fullpage", $.delegate(this, this.onFullPage));
    };

    $.extend($.ImagingHelper.prototype, $.EventSource.prototype,
    /** @lends OpenSeadragon.ImagingHelper.prototype */
    {
        /**
         * Raised whenever the viewer's zoom or pan changes and the ImagingHelper's properties have been updated.
         *
         * @event image-view-changed
         * @memberof OpenSeadragon.ImagingHelper
         * @type {object}
         * @property {OpenSeadragon.ImagingHelper} eventSource - A reference to the ImagingHelper which raised the event.
         * @property {number} viewportWidth - Width of viewport in logical coordinates.
         * @property {number} viewportHeight - Height of viewport in logical coordinates.
         * @property {external:"OpenSeadragon.Point"} viewportCenter - Center of viewport in logical coordinates.
         */

        /**
         * Gets the minimum zoom factor allowed.
         *
         * @method
         * @returns {number}
         *
         **/
        getMinZoom: function () {
            return this._minZoom;
        },

        /**
         * Sets the minimum zoom factor allowed.
         *
         * @method
         * @param {number} value - The desired minimum zoom factor.
         *
         **/
        setMinZoom: function (value) {
            this._minZoom = value;
            this._viewer.minZoomLevel = (value * this.imgWidth) / this._viewer.viewport.getContainerSize().x;
        },

        /**
         * Gets the maximum zoom factor allowed.
         *
         * @method
         * @returns {number}
         *
         **/
        getMaxZoom: function () {
            return this._maxZoom;
        },

        /**
         * Sets the maximum zoom factor allowed.
         *
         * @method
         * @param {number} value - The desired maximum zoom factor.
         *
         **/
        setMaxZoom: function (value) {
            this._maxZoom = value;
            this._viewer.maxZoomLevel = (value * this.imgWidth) / this._viewer.viewport.getContainerSize().x;
        },

        /**
         * Gets the percentage of the current zoom factor to increase/decrease when using the zoomIn/zoomOut methods.
         *
         * @method
         * @returns {number}
         *
         **/
        getZoomStepPercent: function () {
            return this._zoomStepPercent;
        },

        /**
         * Sets the percentage of the current zoom factor to increase/decrease when using the zoomIn/zoomOut methods.
         *
         * @method
         * @param {number} value - The desired percentage.
         *
         **/
        setZoomStepPercent: function (value) {
            this._zoomStepPercent = value;
        },

        /**
         * Zooms and/or pans the viewport based on a viewport width and center point.
         *
         * @method
         * @param {number} width - The desired viewport width in logical units.
         * @param {number} height - The desired viewport width in logical units (currently not used, native image aspect ratio is preserved).
         * @param {external:"OpenSeadragon.Point"} centerpoint - The desired viewport center point in logical units.
         * @param {boolean} [immediately] - If true, the view is set immediately with no spring animation.
         *
         **/
        setView: function (width, height, centerpoint, immediately) {
            if (this._haveImage) {
                if (this._viewportWidth != width || this._viewportHeight != height) {
                    this._viewer.viewport.zoomTo(1.0 / width, null, immediately);
                }
                if (this._viewportCenter.x != centerpoint.x || this._viewportCenter.y != centerpoint.y) {
                    this._viewer.viewport.panTo(new OpenSeadragon.Point(centerpoint.x, centerpoint.y / this.imgAspectRatio), immediately);
                }
            }
        },

        /**
         * Gets the current zoom factor, the ratio of the displayed size to the image's native size.
         *
         * @method
         * @returns {number}
         *
         **/
        getZoomFactor: function () {
            return this._zoomFactor;
        },

        /**
         * Sets the zoom factor, the ratio of the displayed size to the image's native size.
         *
         * @method
         * @param {number} value - The desired zoom factor.
         * @param {boolean} [immediately] - If true, the view is set immediately with no spring animation.
         *
         **/
        setZoomFactor: function (value, immediately) {
            if (this._haveImage && value != this._zoomFactor && value > 0.0) {
                this._viewer.viewport.zoomTo((value * this.imgWidth) / this._viewer.viewport.getContainerSize().x,
                                             new OpenSeadragon.Point(this._viewportCenter.x, this._viewportCenter.y / this.imgAspectRatio), immediately);
            }
        },

        /**
         * Zooms in by a factor of getZoomStepPercent().
         *
         * @method
         * @param {boolean} [immediately] - If true, the view is set immediately with no spring animation.
         *
         **/
        zoomIn: function (immediately) {
            var newzoom = this._zoomFactor;
            newzoom *= (1.0 + this._zoomStepPercent / 100.0);
            if (newzoom > this._maxZoom) {
                newzoom = this._maxZoom;
            }
            this.setZoomFactor(newzoom, immediately);
        },

        /**
         * Zooms out by a factor of getZoomStepPercent().
         *
         * @method
         * @param {boolean} [immediately] - If true, the view is set immediately with no spring animation.
         *
         **/
        zoomOut: function (immediately) {
            var newzoom = this._zoomFactor;
            newzoom *= (1.0 - this._zoomStepPercent / 100.0);
            if (newzoom < this._minZoom) {
                newzoom = this._minZoom;
            }
            this.setZoomFactor(newzoom, immediately);
        },

        /**
         * Sets the zoom factor, the ratio of the displayed size to the image's native size, leaving the logical point in the same viewer position.
         *
         * @method
         * @param {number} newzoomfactor - The desired zoom factor.
         * @param {external:"OpenSeadragon.Point"} logpoint - The logical point to remain in current displayed position.
         * @param {boolean} [immediately] - If true, the view is set immediately with no spring animation.
         *
         **/
        zoomAboutLogicalPoint: function (newzoomfactor, logpoint, immediately) {
            if (this._haveImage && newzoomfactor != this._zoomFactor && newzoomfactor > 0.0) {
                this._viewer.viewport.zoomTo((newzoomfactor * this.imgWidth) / this._viewer.viewport.getContainerSize().x,
                                             new OpenSeadragon.Point(logpoint.x, logpoint.y / this.imgAspectRatio), immediately);
            }
        },

        /**
         * Zooms in by a factor of getZoomStepPercent(), leaving the logical point in the same viewer position.
         *
         * @method
         * @param {external:"OpenSeadragon.Point"} logpoint - The logical point to remain in current displayed position.
         * @param {boolean} [immediately] - If true, the view is set immediately with no spring animation.
         *
         **/
        zoomInAboutLogicalPoint: function (logpoint, immediately) {
            var newzoom = this._zoomFactor;
            newzoom *= (1.0 + this._zoomStepPercent / 100.0);
            if (newzoom > this._maxZoom) {
                newzoom = this._maxZoom;
            }
            this.zoomAboutLogicalPoint(newzoom, logpoint, immediately);
        },

        /**
         * Zooms out by a factor of getZoomStepPercent(), leaving the logical point in the same viewer position.
         *
         * @method
         * @param {external:"OpenSeadragon.Point"} logpoint - The logical point to remain in current displayed position.
         * @param {boolean} [immediately] - If true, the view is set immediately with no spring animation.
         *
         **/
        zoomOutAboutLogicalPoint: function (logpoint, immediately) {
            var newzoom = this._zoomFactor;
            newzoom *= (1.0 - this._zoomStepPercent / 100.0);
            if (newzoom < this._minZoom) {
                newzoom = this._minZoom;
            }
            this.zoomAboutLogicalPoint(newzoom, logpoint, immediately);
        },

        /**
         * Pans the view so the logical point is centered in the viewport.
         *
         * @method
         * @param {external:"OpenSeadragon.Point"} logpoint - The desired center point.
         * @param {boolean} [immediately] - If true, the view is set immediately with no spring animation.
         *
         **/
        centerAboutLogicalPoint: function (logpoint, immediately) {
            if (this._haveImage && this._viewportCenter.x != logpoint.x || this._viewportCenter.y != logpoint.y) {
                this._viewer.viewport.panTo(new OpenSeadragon.Point(logpoint.x, logpoint.y / this.imgAspectRatio), immediately);
            }
        },

        /**
         *
         *
         * @method
         *
         **/
        physicalToLogicalPoint: function (point) {
            return new OpenSeadragon.Point(this.physicalToLogicalX(point.x), this.physicalToLogicalY(point.y));
        },

        /**
         *
         *
         * @method
         *
         **/
        logicalToPhysicalPoint: function (point) {
            return new OpenSeadragon.Point(this.logicalToPhysicalX(point.x), this.logicalToPhysicalY(point.y));
        },

        /**
         *
         *
         * @method
         *
         **/
        physicalToLogicalX: function (x) {
            return this._haveImage ? (this._viewportOrigin.x + ((x / this._viewer.viewport.getContainerSize().x) * this._viewportWidth)) : 0;
        },

        /**
         *
         *
         * @method
         *
         **/
        physicalToLogicalY: function (y) {
            return this._haveImage ? (this._viewportOrigin.y + ((y / this._viewer.viewport.getContainerSize().y) * this._viewportHeight)) : 0;
        },

        /**
         *
         *
         * @method
         *
         **/
        logicalToPhysicalX: function (x) {
            return this._haveImage ? (((x - this._viewportOrigin.x) / this._viewportWidth) * this._viewer.viewport.getContainerSize().x) : 0;
        },

        /**
         *
         *
         * @method
         *
         **/
        logicalToPhysicalY: function (y) {
            return this._haveImage ? (((y - this._viewportOrigin.y) / this._viewportHeight) * this._viewer.viewport.getContainerSize().y) : 0;
        },

        /**
         *
         *
         * @method
         *
         **/
        physicalToLogicalDistance: function (distance) {
            return this._haveImage ? ((distance / this._viewer.viewport.getContainerSize().x) * this._viewportWidth) : 0;
        },

        /**
         *
         *
         * @method
         *
         **/
        logicalToPhysicalDistance: function (distance) {
            return this._haveImage ? ((distance / this._viewportWidth) * this._viewer.viewport.getContainerSize().x) : 0;
        },

        /**
         *
         *
         * @method
         *
         **/
        logicalToDataPoint: function (point) {
            return new OpenSeadragon.Point(this.logicalToDataX(point.x), this.logicalToDataY(point.y));
        },

        /**
         *
         *
         * @method
         *
         **/
        dataToLogicalPoint: function (point) {
            return new OpenSeadragon.Point(this.dataToLogicalX(point.x), this.dataToLogicalY(point.y));
        },

        /**
         *
         *
         * @method
         *
         **/
        physicalToDataPoint: function (point) {
            return new OpenSeadragon.Point(this.physicalToDataX(point.x), this.physicalToDataY(point.y));
        },

        /**
         *
         *
         * @method
         *
         **/
        dataToPhysicalPoint: function (point) {
            return new OpenSeadragon.Point(this.dataToPhysicalX(point.x), this.dataToPhysicalY(point.y));
        },

        /**
         *
         *
         * @method
         *
         **/
        logicalToDataX: function (x) {
            return this._haveImage ? (x * this.imgWidth) : 0;
        },

        /**
         *
         *
         * @method
         *
         **/
        logicalToDataY: function (y) {
            return this._haveImage ? (y * this.imgHeight) : 0;
        },

        /**
         *
         *
         * @method
         *
         **/
        dataToLogicalX: function (x) {
            return (this._haveImage && this.imgWidth > 0) ? (x / this.imgWidth) : 0;
        },

        /**
         *
         *
         * @method
         *
         **/
        dataToLogicalY: function (y) {
            return (this._haveImage && this.imgHeight > 0) ? (y / this.imgHeight) : 0;
        },

        /**
         *
         *
         * @method
         *
         **/
        physicalToDataX: function (x) {
            return (this._haveImage && this._viewer.viewport.getContainerSize().x > 0) ? ((this._viewportOrigin.x + ((x / this._viewer.viewport.getContainerSize().x) * this._viewportWidth)) * this.imgWidth) : 0;
        },

        /**
         *
         *
         * @method
         *
         **/
        physicalToDataY: function (y) {
            return (this._haveImage && this._viewer.viewport.getContainerSize().y > 0) ? ((this._viewportOrigin.y + ((y / this._viewer.viewport.getContainerSize().y) * this._viewportHeight)) * this.imgHeight) : 0;
        },

        /**
         *
         *
         * @method
         *
         **/
        dataToPhysicalX: function (x) {
            return (this._haveImage && this.imgWidth > 0) ? ((((x / this.imgWidth) - this._viewportOrigin.x) / this._viewportWidth) * this._viewer.viewport.getContainerSize().x) : 0;
        },

        /**
         *
         *
         * @method
         *
         **/
        dataToPhysicalY: function (y) {
            return (this._haveImage && this.imgHeight > 0) ? ((((y / this.imgHeight) - this._viewportOrigin.y) / this._viewportHeight) * this._viewer.viewport.getContainerSize().y) : 0;
        },

        /*
         * 
         * Called whenever the OpenSeadragon viewer zoom/pan changes
         * 
         * @private
         * @method
         * @fires OpenSeadragon.ImagingHelper.image-view-changed
         *
         **/
        trackZoomPan: function () {
            var boundsRect = this._viewer.viewport.getBounds(true);
            this._viewportOrigin.x = boundsRect.x;
            this._viewportOrigin.y = boundsRect.y * this.imgAspectRatio;
            this._viewportWidth = boundsRect.width;
            this._viewportHeight = boundsRect.height * this.imgAspectRatio;
            this._viewportCenter.x = this._viewportOrigin.x + (this._viewportWidth / 2.0);
            this._viewportCenter.y = this._viewportOrigin.y + (this._viewportHeight / 2.0);
            this._zoomFactor = this._viewer.viewport.getContainerSize().x / (this._viewportWidth * this.imgWidth);
            this.raiseEvent('image-view-changed', {
                eventSource: this,
                viewportWidth: this._viewportWidth,
                viewportHeight: this._viewportHeight,
                viewportCenter: this._viewportCenter
            });
        },

        onOpen: function() {
            this._haveImage = true;
            this.imgWidth = this._viewer.viewport.contentSize.x;
            this.imgHeight = this._viewer.viewport.contentSize.y;
            this.imgAspectRatio = this.imgWidth / this.imgHeight;
            this.trackZoomPan();
        },

        onClose: function() {
            this._haveImage = false;
            this.imgWidth = 0.0;
            this.imgHeight = 0.0;
            this.imgAspectRatio = 0.0;
        },

        onAnimation: function() {
            this.trackZoomPan();
        },

        onAnimationFinish: function() {
            this.trackZoomPan();
        },

        onFullPage: function() {
            this.trackZoomPan();
        }

    });

}(OpenSeadragon));
