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

    $.Viewer.prototype.activateImagingHelper = function(options) {
        if (!this.imagingHelper) {
            options = options || {};
            options.viewer = this;
            this.imagingHelper = new $.ImagingHelper(options);
        }
        return this.imagingHelper;
    };

    /**
     *
     * @class
     * @extends OpenSeadragon.EventSource
     * @param {Object} options
     * @param {Object} options.viewer 
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
        this.options = options;
        this.imgWidth = 0.0;       // in pixels
        this.imgHeight = 0.0;      // in pixels
        this.imgAspectRatio = 0.0; // imgWidth / imgHeight
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

    $.extend($.ImagingHelper.prototype, $.EventSource.prototype, {

        getMinZoom: function () {
            return this._minZoom;
        },

        setMinZoom: function (value) {
            this._minZoom = value;
            this._viewer.minZoomLevel = (value * this.imgWidth) / this._viewer.viewport.getContainerSize().x;
        },

        getMaxZoom: function () {
            return this._maxZoom;
        },

        setMaxZoom: function (value) {
            this._maxZoom = value;
            this._viewer.maxZoomLevel = (value * this.imgWidth) / this._viewer.viewport.getContainerSize().x;
        },

        getZoomStepPercent: function () {
            return this._zoomStepPercent;
        },

        setZoomStepPercent: function (value) {
            this._zoomStepPercent = value;
        },

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

        getZoomFactor: function () {
            return this._zoomFactor;
        },

        setZoomFactor: function (value) {
            if (this._haveImage && value != this._zoomFactor && value > 0.0) {
                this._viewer.viewport.zoomTo((value * this.imgWidth) / this._viewer.viewport.getContainerSize().x, 
                                             new OpenSeadragon.Point(this._viewportCenter.x, this._viewportCenter.y / this.imgAspectRatio), false);
            }
        },

        zoomIn: function () {
            var newzoom = this._zoomFactor;
            newzoom *= (1.0 + this._zoomStepPercent / 100.0);
            if (newzoom > this._maxZoom) {
                newzoom = this._maxZoom;
            }
            this.setZoomFactor(newzoom);
        },

        zoomOut: function () {
            var newzoom = this._zoomFactor;
            newzoom *= (1.0 - this._zoomStepPercent / 100.0);
            if (newzoom < this._minZoom) {
                newzoom = this._minZoom;
            }
            this.setZoomFactor(newzoom);
        },

        zoomAboutLogicalPoint: function (newzoomfactor, logpoint) {
            if (this._haveImage && newzoomfactor != this._zoomFactor && newzoomfactor > 0.0) {
                this._viewer.viewport.zoomTo((newzoomfactor * this.imgWidth) / this._viewer.viewport.getContainerSize().x, 
                                             new OpenSeadragon.Point(logpoint.x, logpoint.y / this.imgAspectRatio), false);
            }
        },

        zoomInAboutLogicalPoint: function (logpoint) {
            var newzoom = this._zoomFactor;
            newzoom *= (1.0 + this._zoomStepPercent / 100.0);
            if (newzoom > this._maxZoom) {
                newzoom = this._maxZoom;
            }
            this.zoomAboutLogicalPoint(newzoom, logpoint);
        },

        zoomOutAboutLogicalPoint: function (logpoint) {
            var newzoom = this._zoomFactor;
            newzoom *= (1.0 - this._zoomStepPercent / 100.0);
            if (newzoom < this._minZoom) {
                newzoom = this._minZoom;
            }
            this.zoomAboutLogicalPoint(newzoom, logpoint);
        },

        centerAboutLogicalPoint: function (logpoint) {
            if (this._haveImage && this._viewportCenter.x != logpoint.x || this._viewportCenter.y != logpoint.y) {
                this._viewer.viewport.panTo(new OpenSeadragon.Point(logpoint.x, logpoint.y / this.imgAspectRatio), false);
            }
        },

        physicalToLogicalPoint: function (point) {
            return new OpenSeadragon.Point(this.physicalToLogicalX(point.x), this.physicalToLogicalY(point.y));
        },

        logicalToPhysicalPoint: function (point) {
            return new OpenSeadragon.Point(this.logicalToPhysicalX(point.x), this.logicalToPhysicalY(point.y));
        },

        physicalToLogicalX: function (x) {
            return this._haveImage ? (this._viewportOrigin.x + ((x / this._viewer.viewport.getContainerSize().x) * this._viewportWidth)) : 0;
        },

        physicalToLogicalY: function (y) {
            return this._haveImage ? (this._viewportOrigin.y + ((y / this._viewer.viewport.getContainerSize().y) * this._viewportHeight)) : 0;
        },

        logicalToPhysicalX: function (x) {
            return this._haveImage ? (((x - this._viewportOrigin.x) / this._viewportWidth) * this._viewer.viewport.getContainerSize().x) : 0;
        },

        logicalToPhysicalY: function (y) {
            return this._haveImage ? (((y - this._viewportOrigin.y) / this._viewportHeight) * this._viewer.viewport.getContainerSize().y) : 0;
        },

        physicalToLogicalDistance: function (distance) {
            return this._haveImage ? ((distance / this._viewer.viewport.getContainerSize().x) * this._viewportWidth) : 0;
        },

        logicalToPhysicalDistance: function (distance) {
            return this._haveImage ? ((distance / this._viewportWidth) * this._viewer.viewport.getContainerSize().x) : 0;
        },

        logicalToDataPoint: function (point) {
            return new OpenSeadragon.Point(this.logicalToDataX(point.x), this.logicalToDataY(point.y));
        },

        dataToLogicalPoint: function (point) {
            return new OpenSeadragon.Point(this.dataToLogicalX(point.x), this.dataToLogicalY(point.y));
        },

        physicalToDataPoint: function (point) {
            return new OpenSeadragon.Point(this.physicalToDataX(point.x), this.physicalToDataY(point.y));
        },

        dataToPhysicalPoint: function (point) {
            return new OpenSeadragon.Point(this.dataToPhysicalX(point.x), this.dataToPhysicalY(point.y));
        },

        logicalToDataX: function (x) {
            return this._haveImage ? (x * this.imgWidth) : 0;
        },

        logicalToDataY: function (y) {
            return this._haveImage ? (y * this.imgHeight) : 0;
        },

        dataToLogicalX: function (x) {
            return (this._haveImage && this.imgWidth > 0) ? (x / this.imgWidth) : 0;
        },

        dataToLogicalY: function (y) {
            return (this._haveImage && this.imgHeight > 0) ? (y / this.imgHeight) : 0;
        },

        physicalToDataX: function (x) {
            return (this._haveImage && this._viewer.viewport.getContainerSize().x > 0) ? ((this._viewportOrigin.x + ((x / this._viewer.viewport.getContainerSize().x) * this._viewportWidth)) * this.imgWidth) : 0;
        },

        physicalToDataY: function (y) {
            return (this._haveImage && this._viewer.viewport.getContainerSize().y > 0) ? ((this._viewportOrigin.y + ((y / this._viewer.viewport.getContainerSize().y) * this._viewportHeight)) * this.imgHeight) : 0;
        },

        dataToPhysicalX: function (x) {
            return (this._haveImage && this.imgWidth > 0) ? ((((x / this.imgWidth) - this._viewportOrigin.x) / this._viewportWidth) * this._viewer.viewport.getContainerSize().x) : 0;
        },

        dataToPhysicalY: function (y) {
            return (this._haveImage && this.imgHeight > 0) ? ((((y / this.imgHeight) - this._viewportOrigin.y) / this._viewportHeight) * this._viewer.viewport.getContainerSize().y) : 0;
        },

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
                viewportWidth: this._viewportWidth,
                viewportHeight: this._viewportHeight,
                viewportCenter: this._viewportCenter
            });
        },

        onOpen: function(event) {
            this._haveImage = true;
            this.imgWidth = this._viewer.viewport.contentSize.x;
            this.imgHeight = this._viewer.viewport.contentSize.y;
            this.imgAspectRatio = this.imgWidth / this.imgHeight;
            this.trackZoomPan();
        },

        onClose: function(event) {
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
