//! OpenSeadragonImagingHelper 1.0.0
//! Build date: 2013-11-22
//! Git commit: v1.0.0-8-g9f1b6be-dirty
//! https://github.com/msalsbery/OpenSeadragonImagingHelper
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
 * The OpenSeadragon namespace
 * @external OpenSeadragon
 * @see {@link http://openseadragon.github.io/docs/symbols/OpenSeadragon.html OpenSeadragon Documentation}
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
 * @see {@link http://openseadragon.github.io/docs/symbols/OpenSeadragon.Point.html OpenSeadragon.Point Documentation}
 * @property {Number} x
 * @property {Number} y
 */

/**
 * @namespace OpenSeadragon
 * @extends external:OpenSeadragon
 */
(function($) {

    /**
     * Event handler method signature used by all OpenSeadragon events.
     *
     * @callback EventHandler
     * @memberof OpenSeadragon
     * @param {Object} event - See individual events for event properties passed.
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
     * @method activateImagingHelper
     * @memberof OpenSeadragon.Viewer#
     * @param {Object} options
     * @param {OpenSeadragon.EventHandler} [options.onImageViewChanged] - {@link OpenSeadragon.ImagingHelper.event:image-view-changed} handler method.
     * @returns {OpenSeadragon.ImagingHelper}
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
     * @param {OpenSeadragon.EventHandler} [options.onImageViewChanged] - {@link OpenSeadragon.ImagingHelper.event:image-view-changed} handler method.
     *
     **/
    $.ImagingHelper = function(options) {
        options = options || {};

        if (!options.viewer) {
            throw new Error('A viewer must be specified.');
        }
        if (options.viewer.imagingHelper) {
            throw new Error('Viewer already has an ImagingHelper.');
        }

        $.EventSource.call(this);
        
        this._viewer = options.viewer;
        this._viewer.imagingHelper = this;

        /**
         * A reference to the options passed at creation.
         * @member {object} options
         * @memberof OpenSeadragon.ImagingHelper#
         * @property {external:"OpenSeadragon.Viewer"} viewer - Reference to OpenSeadragon viewer this ImagingHelper is attached to.
         * @property {OpenSeadragon.EventHandler} [onImageViewChanged] - {@link OpenSeadragon.ImagingHelper.event:image-view-changed} handler method.
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
        this._haveImage = false;
        this._viewerSize = null;
        // Unadjusted viewport settings (aspect ratio not applied)
        // All coordinates are logical (0 to 1) relative to the image
        this._viewportWidth = 0.0;
        this._viewportHeight = 0.0;
        this._viewportOrigin = new OpenSeadragon.Point(0, 0);
        this._viewportCenter = new OpenSeadragon.Point(0, 0);

        if (options.onImageViewChanged) {
            this.addHandler('image-view-changed', options.onImageViewChanged);
        }

        this._viewer.addHandler("open", $.delegate(this, this.onOpen));
        this._viewer.addHandler("close", $.delegate(this, this.onClose));
        this._viewer.addHandler("animation", $.delegate(this, this.onAnimation));
        this._viewer.addHandler("animation-finish", $.delegate(this, this.onAnimationFinish));
        this._viewer.addHandler("resize", $.delegate(this, this.onResize));
        this._viewer.addHandler("full-page", $.delegate(this, this.onFullPage));
        this._viewer.addHandler("full-screen", $.delegate(this, this.onFullScreen));
    };

    $.extend($.ImagingHelper.prototype, $.EventSource.prototype,
    /** @lends OpenSeadragon.ImagingHelper.prototype */
    {
        /**
         * Gets the size of the viewer's container element.
         *
         * @method
         * @returns {external:"OpenSeadragon.Point"}
         *
         **/
        getViewerContainerSize: function () {
            //return this._viewer.viewport.getContainerSize();
            var element = this._viewer.container;
            //return new $.Point(
            //    (element.clientWidth === 0 ? 1 : element.clientWidth),
            //    (element.clientHeight === 0 ? 1 : element.clientHeight)
            //);
            return new $.Point(element.clientWidth, element.clientHeight);
        },

        /**
         * Helper method for users of the OpenSeadragon.Viewer's pollForResize = false option.
         * Call this whenever the viewer is resized, and the image will stay displayed at the same scale 
         * and same center point.
         *
         * @method
         * @fires OpenSeadragon.ImagingHelper.image-view-changed
         *
         **/
        notifyResize: function () {
            var newViewerSize,
                center,
                zoom;
            if (this._haveImage) {
                newViewerSize = this.getViewerContainerSize();
                if (!newViewerSize.equals(this._viewerSize)) {
                    center = new OpenSeadragon.Point(this._viewportCenter.x, this._viewportCenter.y / this.imgAspectRatio);
                    zoom = this._zoomFactor;
                    this._viewer.viewport.resize(newViewerSize, false);
                    this._viewer.viewport.zoomTo((zoom * this.imgWidth) / newViewerSize.x, null, true);
                    this._viewer.viewport.panTo(center, true);
                    this.raiseImageViewChanged();
                }
            }
        },

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
            this._viewer.minZoomLevel = (value * this.imgWidth) / this.getViewerContainerSize().x;
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
            this._viewer.maxZoomLevel = (value * this.imgWidth) / this.getViewerContainerSize().x;
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
                this._viewer.viewport.zoomTo((value * this.imgWidth) / this.getViewerContainerSize().x,
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
                this._viewer.viewport.zoomTo((newzoomfactor * this.imgWidth) / this.getViewerContainerSize().x,
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
            return this._haveImage ? (this._viewportOrigin.x + ((x / this.getViewerContainerSize().x) * this._viewportWidth)) : 0;
        },

        /**
         *
         *
         * @method
         *
         **/
        physicalToLogicalY: function (y) {
            return this._haveImage ? (this._viewportOrigin.y + ((y / this.getViewerContainerSize().y) * this._viewportHeight)) : 0;
        },

        /**
         *
         *
         * @method
         *
         **/
        logicalToPhysicalX: function (x) {
            return this._haveImage ? (((x - this._viewportOrigin.x) / this._viewportWidth) * this.getViewerContainerSize().x) : 0;
        },

        /**
         *
         *
         * @method
         *
         **/
        logicalToPhysicalY: function (y) {
            return this._haveImage ? (((y - this._viewportOrigin.y) / this._viewportHeight) * this.getViewerContainerSize().y) : 0;
        },

        /**
         *
         *
         * @method
         *
         **/
        physicalToLogicalDistance: function (distance) {
            return this._haveImage ? ((distance / this.getViewerContainerSize().x) * this._viewportWidth) : 0;
        },

        /**
         *
         *
         * @method
         *
         **/
        logicalToPhysicalDistance: function (distance) {
            return this._haveImage ? ((distance / this._viewportWidth) * this.getViewerContainerSize().x) : 0;
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
            return (this._haveImage && this.getViewerContainerSize().x > 0) ? ((this._viewportOrigin.x + ((x / this.getViewerContainerSize().x) * this._viewportWidth)) * this.imgWidth) : 0;
        },

        /**
         *
         *
         * @method
         *
         **/
        physicalToDataY: function (y) {
            return (this._haveImage && this.getViewerContainerSize().y > 0) ? ((this._viewportOrigin.y + ((y / this.getViewerContainerSize().y) * this._viewportHeight)) * this.imgHeight) : 0;
        },

        /**
         *
         *
         * @method
         *
         **/
        dataToPhysicalX: function (x) {
            return (this._haveImage && this.imgWidth > 0) ? ((((x / this.imgWidth) - this._viewportOrigin.x) / this._viewportWidth) * this.getViewerContainerSize().x) : 0;
        },

        /**
         *
         *
         * @method
         *
         **/
        dataToPhysicalY: function (y) {
            return (this._haveImage && this.imgHeight > 0) ? ((((y / this.imgHeight) - this._viewportOrigin.y) / this._viewportHeight) * this.getViewerContainerSize().y) : 0;
        },

        /*
         * 
         * Raises the {@link OpenSeadragon.ImagingHelper.image-view-changed} event
         * 
         * @private
         * @method
         *
         **/
        raiseImageViewChanged: function () {
            /**
             * Raised whenever the viewer's zoom or pan changes and the ImagingHelper's properties have been updated.
             * @event image-view-changed
             * @memberof OpenSeadragon.ImagingHelper
             * @type {Object}
             * @property {OpenSeadragon.ImagingHelper} eventSource - A reference to the ImagingHelper which raised the event.
             * @property {number} viewportWidth - Width of viewport in logical coordinates.
             * @property {number} viewportHeight - Height of viewport in logical coordinates.
             * @property {external:"OpenSeadragon.Point"} viewportOrigin - Center of viewport in logical coordinates.
             * @property {external:"OpenSeadragon.Point"} viewportCenter - Center of viewport in logical coordinates.
             * @property {number} zoomFactor - Zoom factor.
             * @property {Object} [userData=null] - Arbitrary subscriber-defined object.
             */
            this.raiseEvent('image-view-changed', {
                viewportWidth:  this._viewportWidth,
                viewportHeight: this._viewportHeight,
                viewportOrigin: this._viewportOrigin,
                viewportCenter: this._viewportCenter,
                zoomFactor:     this._zoomFactor
            });
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
            this._zoomFactor = this.getViewerContainerSize().x / (this._viewportWidth * this.imgWidth);

            this.raiseImageViewChanged();
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

        onResize: function() {
            if (this._viewer && this._viewer.pollForResize) {
                this.trackZoomPan();
            }
        },

        onFullPage: function() {
            this.trackZoomPan();
        },

        onFullScreen: function() {
            this.trackZoomPan();
        }

    });

}(OpenSeadragon));
