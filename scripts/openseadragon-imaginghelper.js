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
        this._zoomStepPercent = 20;
        this._viewer = options.viewer;
        this._haveImage = false;
        this._bitmapImageViewportWidth = 0.0;
        this._bitmapImageViewportOrigin = new OpenSeadragon.Point(0, 0);
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

        var self = this;
        this._viewer.addHandler("open", function(event) {
            self.onOpen(event);
        });
        this._viewer.addHandler("close", function(event) {
            self.onClose(event);
        });
        this._viewer.addHandler("animation", function(event) {
            self.onAnimation();
        });
        this._viewer.addHandler("animation-finish", function(event) {
            self.onAnimationFinish();
        });
        this._viewer.addHandler("fullpage", function(event) {
            self.onFullPage();
        });
    };

    $.extend($.ImagingHelper.prototype, $.EventSource.prototype, {

        getMinZoom: function () {
            return this._minZoom;
        },

        setMinZoom: function (value) {
            this._minZoom = value;
            // TODO Calculate this correctly to match OpenSeadragon coordinate system
            this._viewer.minZoomLevel = value;
        },

        getMaxZoom: function () {
            return this._maxZoom;
        },

        setMaxZoom: function (value) {
            this._maxZoom = value;
            // TODO Calculate this correctly to match OpenSeadragon coordinate system
            this._viewer.maxZoomLevel = value;
        },

        getZoomStepPercent: function () {
            return this._zoomStepPercent;
        },

        setZoomStepPercent: function (value) {
            this._zoomStepPercent = value;
        },

        setView: function (width, height, centerpoint, immediately) {
            this._viewportWidth = width;
            this._viewportHeight = height;
            this._viewportCenter = centerpoint;
            this._viewportOrigin.x = this._viewportCenter.x - (this._viewportWidth / 2.0);
            this._viewportOrigin.y = this._viewportCenter.y - (this._viewportHeight / 2.0);

            this.setBitmapImageViewportWidth(this._viewportWidth, immediately);
            this.setBitmapImageViewportOrigin(new OpenSeadragon.Point(this._viewportOrigin.x, this._viewportOrigin.y / this.imgAspectRatio), immediately);
        },

        getZoomFactor: function () {
            return this._zoomFactor;
        },

        setZoomFactor: function (value) {
            if (value != this._zoomFactor && value > 0.0) {
                this._zoomFactor = value;
                if (this.imgWidth != 0.0 && this.imgHeight != 0.0) {
                    this._viewportWidth = this._viewer.viewport.getContainerSize().x / (this.imgWidth * value);
                    this._viewportHeight = this._viewer.viewport.getContainerSize().y / (this.imgHeight * value);
                    this._viewportOrigin.x = this._viewportCenter.x - (this._viewportWidth / 2.0);
                    this._viewportOrigin.y = this._viewportCenter.y - (this._viewportHeight / 2.0);

                    this.setBitmapImageViewportWidth(this._viewportWidth);
                    this.setBitmapImageViewportOrigin(new OpenSeadragon.Point(this._viewportOrigin.x, this._viewportOrigin.y / this.imgAspectRatio));
                }
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
            if (newzoomfactor != this._zoomFactor && newzoomfactor > 0.0) {
                this._zoomFactor = newzoomfactor;
                if (this.imgWidth != 0.0 && this.imgHeight != 0.0) {
                    var physpoint = this.logicalToPhysicalPoint(logpoint);

                    this._viewportWidth = this._viewer.viewport.getContainerSize().x / (this.imgWidth * newzoomfactor);
                    this._viewportHeight = this._viewer.viewport.getContainerSize().y / (this.imgHeight * newzoomfactor);
                    this._viewportOrigin.x = logpoint.x - ((physpoint.x / this._viewer.viewport.getContainerSize().x) * this._viewportWidth);
                    this._viewportOrigin.y = logpoint.y - ((physpoint.y / this._viewer.viewport.getContainerSize().y) * this._viewportHeight);
                    this._viewportCenter.x = this._viewportOrigin.x + (this._viewportWidth / 2.0);
                    this._viewportCenter.y = this._viewportOrigin.y + (this._viewportHeight / 2.0);

                    this.setBitmapImageViewportWidth(this._viewportWidth);
                    this.setBitmapImageViewportOrigin(new OpenSeadragon.Point(this._viewportOrigin.x, this._viewportOrigin.y / this.imgAspectRatio));

                    //this.raiseEvent('image-view-changed', {
                    //    viewportWidth: this._viewportWidth,
                    //    viewportHeight: this._viewportHeight,
                    //    viewportCenter: this._viewportCenter
                    //});
                }
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
            if (this.imgWidth != 0.0 && this.imgHeight != 0.0 && ((this._viewportCenter.x != logpoint.x) || (this._viewportCenter.y != logpoint.y))) {
                this._viewportCenter = logpoint;
                this._viewportOrigin.x = this._viewportCenter.x - (this._viewportWidth / 2.0);
                this._viewportOrigin.y = this._viewportCenter.y - (this._viewportHeight / 2.0);

                this.setBitmapImageViewportOrigin(new OpenSeadragon.Point(this._viewportOrigin.x, this._viewportOrigin.y / this.imgAspectRatio));

                //this.raiseEvent('image-view-changed', {
                //    viewportWidth: this._viewportWidth,
                //    viewportHeight: this._viewportHeight,
                //    viewportCenter: this._viewportCenter
                //});
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

        getBitmapImageViewportWidth: function () {
            return this._bitmapImageViewportWidth;
        },

        setBitmapImageViewportWidth: function (value, immediately) {
            this._bitmapImageViewportWidth = value;
            if (this._haveImage) {
                this._viewer.viewport.zoomTo((this.getZoomFactor() * this.imgWidth) / this._viewer.viewport.getContainerSize().x, null, immediately);
            }
        },

        getBitmapImageViewportOrigin: function () {
            return this._bitmapImageViewportOrigin;
        },

        setBitmapImageViewportOrigin: function (value, immediately) {
            if (value == null) {
                this._bitmapImageViewportOrigin = new OpenSeadragon.Point(0, 0);
            }
            else {
                this._bitmapImageViewportOrigin = value;
            }
            if (this._haveImage) {
                this._viewer.viewport.panTo(new OpenSeadragon.Point(this._viewportCenter.x, this._viewportCenter.y / this.imgAspectRatio), immediately);
            }
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
