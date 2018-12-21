//! openseadragonannohost 2.0.0
//! Build date: 2018-12-20
//! Git commit: v2.0.0-0-5f43fcc
//! https://github.com/msalsbery/OpenSeadragonAnnoHost
/*
 * Copyright (c) 2013-2014 Mark Salsbery
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

/* global OpenSeadragon */

/**
 * @file
 * @version  openseadragonannohost 2.0.0
 * @author Mark Salsbery <msalsbery@hotmail.com>
 *
 */

/**
 * @module openseadragon-annohost
 * @version  openseadragonannohost 2.0.0
 *
 */

(function (OSD, $, undefined) {
	if (!OSD.version || OSD.version.major < 1) {
		throw new Error(
			'OpenSeadragon.Annotations requires OpenSeadragon version 1.0.0+'
		);
	}

	/**
	 * Creates a new AnnoHost attached to the viewer.
	 *
	 * @method activateAnnoHost
	 * @memberof external:"OpenSeadragon.Viewer"#
	 * @param {Object} options
	 * @param {external:OpenSeadragon.EventHandler} [options.onImageViewChanged] - {@link OpenSeadragonImaging.ImagingHelper.event:image-view-changed} handler method.
	 * @returns {OpenSeadragonImaging.AnnoHost}
	 *
	 **/
	OSD.Viewer.prototype.activateAnnoHost = function (options) {
		if (!this.annoHost) {
			options = options || {};
			options.viewer = this;
			this.annoHost = new $.AnnoHost(options);
		}
		return this.annoHost;
	};

	/**
	 * Creates a new AnnoHost attached to the viewer instance passed in the options parameter.
	 *
	 * @class AnnoHost
	 * @classdesc Provides a framework for annotating OpenSeadragon images.
	 * @memberof OpenSeadragonImaging
	 * @extends OpenSeadragonImaging.ImagingHelper
	 * @param {Object} options
	 * @param {external:"OpenSeadragon.Viewer"} options.viewer - Required! Reference to OpenSeadragon viewer to attach to.
	 * @param {external:OpenSeadragon.EventHandler} [options.onImageViewChanged] - {@link OpenSeadragonImaging.ImagingHelper.event:image-view-changed} handler method.
	 *
	 **/
	$.AnnoHost = function (options) {
		options = options || {};

		if (typeof OSD.Viewer.prototype.activateImagingHelper !== 'function') {
			throw new Error(
				'OpenSeadragon.Annotations.AnnoHost requires the OpenSeadragonImagingHelper plugin.'
			);
		}
		if (!$.ImagingHelper.version || $.ImagingHelper.version.major < 1) {
			throw new Error(
				'OpenSeadragon.Annotations.AnnoHost requires OpenSeadragonImagingHelper plugin version 1.0.0+'
			);
		}
		if (typeof OSD.Viewer.prototype.addViewerInputHook !== 'function') {
			throw new Error(
				'OpenSeadragon.Annotations.AnnoHost requires the OpenSeadragonViewerInputHook plugin.'
			);
		}
		if (!$.ViewerInputHook.version || $.ViewerInputHook.version.major < 1) {
			throw new Error(
				'OpenSeadragon.Annotations.AnnoHost requires OpenSeadragonViewerInputHook plugin version 1.0.0+'
			);
		}
		if (!options.viewer) {
			throw new Error('A viewer must be specified.');
		}
		if (options.viewer.annoHost) {
			throw new Error('Viewer already has an AnnoHost.');
		}

		// Call base class constructor
		$.ImagingHelper.call(this, options);

		// Add this object to the Viewer
		this._viewer.annoHost = this;

		// Private
		this._osdCanvas = null;
		this._annotationGrappleWidth = 8 | 0;

		// Wire up event handlers
		this.addHandler(
			'image-view-changed',
			OSD.delegate(this, onImageViewChanged)
		);
		this._viewerInputHook = this._viewer.addViewerInputHook({
			hooks: [
				{
					tracker: 'viewer',
					handler: 'dragHandler',
					hookHandler: OSD.delegate(this, onHookViewerDrag)
				},
				{
					tracker: 'viewer',
					handler: 'enterHandler',
					hookHandler: OSD.delegate(this, onHookViewerEnter)
				},
				{
					tracker: 'viewer',
					handler: 'moveHandler',
					hookHandler: OSD.delegate(this, onHookViewerMove)
				},
				{
					tracker: 'viewer',
					handler: 'exitHandler',
					hookHandler: OSD.delegate(this, onHookViewerExit)
				},
				{
					tracker: 'viewer',
					handler: 'scrollHandler',
					hookHandler: OSD.delegate(this, onHookViewerScroll)
				},
				{
					tracker: 'viewer',
					handler: 'clickHandler',
					hookHandler: OSD.delegate(this, onHookViewerClick)
				}
			]
		});
		this._viewer.addHandler('open', OSD.delegate(this, onOpen));
		this._viewer.addHandler('close', OSD.delegate(this, onClose));
		this._viewer.addHandler(
			'pre-full-page',
			OSD.delegate(this, onPreFullPage)
		);
		this._viewer.addHandler('full-page', OSD.delegate(this, onFullPage));
		this._viewer.addHandler(
			'pre-full-screen',
			OSD.delegate(this, onPreFullScreen)
		);
		this._viewer.addHandler(
			'full-screen',
			OSD.delegate(this, onFullScreen)
		);
	};

	/**
	 * AnnoHost version.
	 * @member {Object} OpenSeadragonImaging.AnnoHost.version
	 * @property {String} versionStr - The version number as a string ('major.minor.revision').
	 * @property {Number} major - The major version number.
	 * @property {Number} minor - The minor version number.
	 * @property {Number} revision - The revision number.
	 */
	$.AnnoHost.version = {
		versionStr: '2.0.0'
	};
	var versionSplits = $.AnnoHost.version.versionStr.split('.');
	$.AnnoHost.version.major = parseInt(versionSplits[0], 10);
	$.AnnoHost.version.minor = parseInt(versionSplits[1], 10);
	$.AnnoHost.version.revision = parseInt(versionSplits[2], 10);

	// Inherit OpenSeadragonImaging.ImagingHelper
	$.AnnoHost.prototype = Object.create($.ImagingHelper.prototype);
	Object.defineProperty($.AnnoHost.prototype, 'constructor', {
		enumerable: false,
		value: $.AnnoHost
	});

	// Properties
	Object.defineProperties($.AnnoHost.prototype, {
		/**
		 * Gets the image's native width in pixels.
		 * @member {Number} dataWidth
		 * @memberof OpenSeadragonImaging.AnnoHost#
		 *
		 **/
		dataWidth: {
			get: function () {
				return this.imgWidth;
			},
			enumerable: true,
			configurable: true
		},
		/**
		 * Gets the image's native height in pixels.
		 * @member {Number} dataHeight
		 * @memberof OpenSeadragonImaging.AnnoHost#
		 *
		 **/
		dataHeight: {
			get: function () {
				return this.imgHeight;
			},
			enumerable: true,
			configurable: true
		},
		/**
		 * Gets the dimensions of annotation UI grapples in pixels.
		 * @member {Number} annotationGrappleWidth
		 * @memberof OpenSeadragonImaging.AnnoHost#
		 *
		 **/
		annotationGrappleWidth: {
			get: function () {
				return this._annotationGrappleWidth;
			},
			enumerable: true,
			configurable: true
		}
	});

	// Methods
	OSD.extend(
		$.AnnoHost.prototype,
		/** @lends OpenSeadragonImaging.AnnoHost.prototype */
		{
			/**
			 * TEST.
			 * @method
			 * @returns {number}
			 *
			 **/
			testMethod: function () {
				return 0;
			},

			/**
			 * Called by Annotation objects when editing starts.
			 * @method
			 * @param {OpenSeadragonImaging.Annotation} annotation
			 *
			 **/
			notifyAnnotationTrackingEditStarted: function (annotation) {
				annotation = annotation || null;
			}
		}
	);

	/*
	 * @private
	 * @method
	 *
	 **/
	function onOpen() {
		//this._haveImage = true;
		this._osdCanvas = this._viewer.canvas;
	}

	/*
	 * @private
	 * @method
	 *
	 **/
	function onClose() {
		//this._haveImage = false;
		this._osdCanvas = null;
	}

	/*
	 * @private
	 * @method
	 *
	 **/
	function onImageViewChanged() {
		// Raised whenever the viewer's zoom or pan changes and the ImagingHelper's properties have been updated.
		// event.viewportWidth == width of viewer viewport in logical coordinates relative to image native size
		// event.viewportHeight == height of viewer viewport in logical coordinates relative to image native size
		// event.viewportOrigin == OpenSeadragon.Point, top-left of the viewer viewport in logical coordinates relative to image
		// event.viewportCenter == OpenSeadragon.Point, center of the viewer viewport in logical coordinates relative to image
		// event.zoomFactor == current zoom factor
	}

	/*
	 * @private
	 * @method
	 *
	 **/
	function onPreFullPage(event) {
		// set event.preventDefaultAction = true to prevent viewer's default action
		if (event.fullPage) {
			// Going to full-page mode
		}
	}

	/*
	 * @private
	 * @method
	 *
	 **/
	function onFullPage(event) {
		if (!event.fullPage) {
			// Exited full-page mode
		}
	}

	/*
	 * @private
	 * @method
	 *
	 **/
	function onPreFullScreen(event) {
		// set event.preventDefaultAction = true to prevent viewer's default action
		if (event.fullScreen) {
			// Going to full-screen mode
		}
	}

	/*
	 * @private
	 * @method
	 *
	 **/
	function onFullScreen(event) {
		if (!event.fullScreen) {
			// Exited full-screen mode
		}
	}

	/*
	 * @private
	 * @method
	 *
	 **/
	function onHookViewerDrag() {
		// set event.stopHandlers = true to prevent any more handlers in the chain from being called
		// set event.stopBubbling = true to prevent the original event from bubbling
		// set event.preventDefaultAction = true to prevent viewer's default action
	}

	/*
	 * @private
	 * @method
	 *
	 **/
	function onHookViewerEnter() {
		// set event.stopHandlers = true to prevent any more handlers in the chain from being called
		// set event.stopBubbling = true to prevent the original event from bubbling
		// set event.preventDefaultAction = true to prevent viewer's default action
	}

	/*
	 * @private
	 * @method
	 *
	 **/
	function onHookViewerMove() {
		// set event.stopHandlers = true to prevent any more handlers in the chain from being called
		// set event.stopBubbling = true to prevent the original event from bubbling
		// set event.preventDefaultAction = true to prevent viewer's default action
	}

	/*
	 * @private
	 * @method
	 *
	 **/
	function onHookViewerExit() {
		// set event.stopHandlers = true to prevent any more handlers in the chain from being called
		// set event.stopBubbling = true to prevent the original event from bubbling
		// set event.preventDefaultAction = true to prevent viewer's default action
	}

	/*
	 * @private
	 * @method
	 *
	 **/
	function onHookViewerScroll() {
		// set event.stopHandlers = true to prevent any more handlers in the chain from being called
		// set event.stopBubbling = true to prevent the original event from bubbling
		// set event.preventDefaultAction = true to prevent viewer's default action
	}

	/*
	 * @private
	 * @method
	 *
	 **/
	function onHookViewerClick() {
		// set event.stopHandlers = true to prevent any more handlers in the chain from being called
		// set event.stopBubbling = true to prevent the original event from bubbling
		// set event.preventDefaultAction = true to prevent viewer's default action
	}
})(
	OpenSeadragon,
	(window.OpenSeadragonImaging = window.OpenSeadragonImaging || {})
);

/*
 * Copyright (c) 2013-2014 Mark Salsbery
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

/* global OpenSeadragon */

(function (OSD, $, undefined) {
	/**
	 * Base class for all annotations.
	 *
	 * @class Annotation
	 * @classdesc Base class for all annotations.
	 * @memberof OpenSeadragonImaging
	 * @param {Object} options
	 *
	 **/
	$.Annotation = function (options) {
		options = options || {};

		this._annoHost = null;
	};

	OSD.extend(
		$.Annotation.prototype,
		/** @lends OpenSeadragonImaging.Annotation.prototype */
		{}
	);

	/*
	 * @private
	 * @method
	 *
	 **/
	//function onOpen() {
	//}
})(
	OpenSeadragon,
	(window.OpenSeadragonImaging = window.OpenSeadragonImaging || {})
);
