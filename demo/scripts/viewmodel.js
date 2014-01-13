(function() {

    var appTitle = 'OpenSeadragon Imaging';
    var appDesc = 'OpenSeadragonImagingHelper / OpenSeadragonViewerInputHook Plugins';

    $(window).resize(onWindowResize);
    $(window).resize();

    var tileSourcesPrefix = '../openseadragonimaging/data/',
    //var tileSourcesPrefix = '/media/openseadragonsamples/',
        tileSources = [
            tileSourcesPrefix + 'testpattern.dzi',
            tileSourcesPrefix + 'tall.dzi',
            tileSourcesPrefix + 'wide.dzi',
            new OpenSeadragon.LegacyTileSource( [{
                url: tileSourcesPrefix + 'dog_radiograph_2.jpg',
                width: 1909,
                height: 1331
            }] )
        ];

    var _navExpanderIsCollapsed = true,
        _$navExpander = $('.navigatorExpander'),
        _$navExpanderHeaderContainer = $('.expanderHeaderContainer'),
        _$navExpanderHeader = $(_$navExpanderHeaderContainer.children()[0]),
        _$navExpanderContentContainer = $('.expanderContentContainer'),
        _navExpanderExpandedOpacity = 1.0,
        _navExpanderCollapsedOpacity = 0.40,
        _navExpanderWidth = 190,
        _navExpanderHeight = 220,
        _navExpanderCollapsedWidth = _$navExpanderHeader.outerWidth(),
        _navExpanderCollapsedHeight = _$navExpanderHeaderContainer.outerHeight();

    var viewer = OpenSeadragon({
                    //debugMode: true,
                    //showReferenceStrip: true,
                    id: 'viewerDiv1',
                    prefixUrl: 'content/images/openseadragon/',
                    useCanvas: true,
                    showNavigationControl: true,
                    navigationControlAnchor: OpenSeadragon.ControlAnchor.BOTTOM_LEFT,
                    showSequenceControl: true,
                    sequenceControlAnchor: OpenSeadragon.ControlAnchor.BOTTOM_LEFT,
                    showNavigator: true,
                    navigatorId: 'navigatorDiv1',
                    navigatorAutoResize: false,
                    visibilityRatio: 0.1,
                    minZoomLevel: 0.001,
                    maxZoomLevel: 10,
                    zoomPerClick: 1.4,
                    autoResize: false, // If false, we have to handle resizing of the viewer
                    tileSources: tileSources
                }),
        imagingHelper = viewer.activateImagingHelper({onImageViewChanged: onImageViewChanged}),
        viewerInputHook = viewer.addViewerInputHook({hooks: [
            {tracker: 'viewer', handler: 'moveHandler', hookHandler: onHookOsdViewerMove},
            {tracker: 'viewer', handler: 'scrollHandler', hookHandler: onHookOsdViewerScroll},
            {tracker: 'viewer', handler: 'clickHandler', hookHandler: onHookOsdViewerClick}
        ]}),
        _$osdCanvas = null,
        _$svgOverlay = $('.imgvwrSVG');

    // Example SVG annotation overlay.  We use these observables to keep the example annotation sync'd with the image zoom/pan
    var annoGroupTranslateX = ko.observable(0.0),
        annoGroupTranslateY = ko.observable(0.0),
        annoGroupScale = ko.observable(1.0),
        annoGroupTransform = ko.computed(function () {
            return 'translate(' + annoGroupTranslateX() + ',' + annoGroupTranslateY() + ') scale(' + annoGroupScale() + ')';
        }, this);

    viewer.addHandler('open', function (event) {
        _$osdCanvas = $(viewer.canvas);
        setMinMaxZoomForImage();
        outputVM.haveImage(true);
        _$osdCanvas.on('mouseenter.osdimaginghelper', onOsdCanvasMouseEnter);
        _$osdCanvas.on('mousemove.osdimaginghelper', onOsdCanvasMouseMove);
        _$osdCanvas.on('mouseleave.osdimaginghelper', onOsdCanvasMouseLeave);
        updateImageVM();
        updateImgViewerViewVM();
        updateImgViewerDataCoordinatesVM();

        _$navExpander.css( 'visibility', 'visible');
        if (_navExpanderIsCollapsed) {
            _navExpanderDoCollapse(false);
        }
        else {
            _navExpanderDoExpand(true);
        }

        _$svgOverlay.css( 'visibility', 'visible');

        //// Example OpenSeadragon overlay
        //var olDiv = document.createElement('div');
        //olDiv.style.background = 'rgba(255,0,0,0.25)';
        //var olRect = new OpenSeadragon.Rect(-0.1, -0.1, 1.2, 1.0 / event.viewer.source.aspectRatio + 0.2);
        ////var olRect = new OpenSeadragon.Rect(-0.5, -0.5, 2.0, 1.0 / event.viewer.source.aspectRatio + 1.0);
        //_this._osd.drawer.addOverlay({
        //    element: olDiv,
        //    location: olRect,
        //    placement: OpenSeadragon.OverlayPlacement.TOP_LEFT
        //    //onDraw: function (position, size, element) {
        //    //    position = position || null;
        //    //}
        //});

        //// Example OpenSeadragon overlay
        //var img = document.createElement('img');
        //img.src = 'content/images/openseadragon/next_rest.png';
        //var point = new OpenSeadragon.Point(0.5, 0.5)
        //viewer.drawer.addOverlay(img, point);
    });

    viewer.addHandler('close', function (event) {
        _$navExpander.css( 'visibility', 'hidden');
        _$svgOverlay.css( 'visibility', 'hidden');
        outputVM.haveImage(false);
        _$osdCanvas.off('mouseenter.osdimaginghelper', onOsdCanvasMouseEnter);
        _$osdCanvas.off('mousemove.osdimaginghelper', onOsdCanvasMouseMove);
        _$osdCanvas.off('mouseleave.osdimaginghelper', onOsdCanvasMouseLeave);
        _$osdCanvas = null;
    });

    viewer.addHandler('navigator-scroll', function (event) {
        if (event.scroll > 0) {
            imagingHelper.zoomIn();
        }
        else {
            imagingHelper.zoomOut();
        }
    });

    viewer.addHandler('pre-full-page', function (event) {
        if (event.fullPage) {
            // Going to full-page mode...remove our bound DOM elements
            vm.outputVM(null);
            vm.svgOverlayVM(null);
        }
    });

    viewer.addHandler('full-page', function (event) {
        if (!event.fullPage) {
            // Exited full-page mode...restore our bound DOM elements
            vm.outputVM(outputVM);
            vm.svgOverlayVM(svgOverlayVM);
            _$svgOverlay.css( 'visibility', 'visible');
        }
    });

    viewer.addHandler('pre-full-screen', function (event) {
        if (event.fullScreen) {
            // Going to full-screen mode...remove our bound DOM elements
            vm.outputVM(null);
            vm.svgOverlayVM(null);
        }
    });

    viewer.addHandler('full-screen', function (event) {
        if (!event.fullScreen) {
            // Exited full-screen mode...restore our bound DOM elements
            vm.outputVM(outputVM);
            vm.svgOverlayVM(svgOverlayVM);
            _$svgOverlay.css( 'visibility', 'visible');
        }
    });

    function setMinMaxZoomForImage() {
        var minzoomX = 50.0 / imagingHelper.imgWidth;
        var minzoomY = 50.0 / imagingHelper.imgHeight;
        var minZoom = Math.min(minzoomX, minzoomY);
        var maxZoom = 10.0;
        imagingHelper.setMinZoom(minZoom);
        imagingHelper.setMaxZoom(maxZoom);
        imagingHelper.setZoomStepPercent(35);
    }

    function onImageViewChanged(event) {
        // event.viewportWidth == width of viewer viewport in logical coordinates relative to image native size
        // event.viewportHeight == height of viewer viewport in logical coordinates relative to image native size
        // event.viewportOrigin == OpenSeadragon.Point, top-left of the viewer viewport in logical coordinates relative to image
        // event.viewportCenter == OpenSeadragon.Point, center of the viewer viewport in logical coordinates relative to image
        // event.zoomFactor == current zoom factor
        updateImgViewerViewVM();
        updateImgViewerScreenCoordinatesVM();
        updateImgViewerDataCoordinatesVM();

        // Example SVG annotation overlay - keep the example annotation sync'd with the image zoom/pan
        //var p = viewer.viewport.pixelFromPoint(new OpenSeadragon.Point(0, 0), true);
        var p = imagingHelper.logicalToPhysicalPoint(new OpenSeadragon.Point(0, 0));
        annoGroupTranslateX(p.x);
        annoGroupTranslateY(p.y);
        annoGroupScale(imagingHelper.getZoomFactor());
    }

    function onHookOsdViewerMove(event) {
        // set event.stopHandlers = true to prevent any more handlers in the chain from being called
        // set event.stopBubbling = true to prevent the original event from bubbling
        // set event.preventDefaultAction = true to prevent viewer's default action
        outputVM.OsdMouseRelativeX(event.position.x);
        outputVM.OsdMouseRelativeY(event.position.y);
        event.stopHandlers = true;
        event.stopBubbling = true;
        event.preventDefaultAction = true;
    }

    function onHookOsdViewerScroll(event) {
        // set event.stopHandlers = true to prevent any more handlers in the chain from being called
        // set event.stopBubbling = true to prevent the original event from bubbling
        // set event.preventDefaultAction = true to prevent viewer's default action
        var logPoint = imagingHelper.physicalToLogicalPoint(event.position);
        if (event.scroll > 0) {
            imagingHelper.zoomInAboutLogicalPoint(logPoint);
        }
        else {
            imagingHelper.zoomOutAboutLogicalPoint(logPoint);
        }
        event.stopBubbling = true;
        event.preventDefaultAction = true;
    }

    function onHookOsdViewerClick(event) {
        // set event.stopHandlers = true to prevent any more handlers in the chain from being called
        // set event.stopBubbling = true to prevent the original event from bubbling
        // set event.preventDefaultAction = true to prevent viewer's default action
        if (event.quick) {
            var logPoint = imagingHelper.physicalToLogicalPoint(event.position);
            if (event.shift) {
                imagingHelper.zoomOutAboutLogicalPoint(logPoint);
            }
            else {
                imagingHelper.zoomInAboutLogicalPoint(logPoint);
            }
        }
        event.stopBubbling = true;
        event.preventDefaultAction = true;
    }

    function onOsdCanvasMouseEnter(event) {
        outputVM.haveMouse(true);
        updateImgViewerScreenCoordinatesVM();
    }

    function onOsdCanvasMouseMove(event) {
        var osdmouse = OpenSeadragon.getMousePosition(event),
            osdoffset = OpenSeadragon.getElementOffset(viewer.canvas);
        outputVM.OsdMousePositionX(osdmouse.x);
        outputVM.OsdMousePositionY(osdmouse.y);
        outputVM.OsdElementOffsetX(osdoffset.x);
        outputVM.OsdElementOffsetY(osdoffset.y);

        var offset = _$osdCanvas.offset();
        outputVM.mousePositionX(event.pageX);
        outputVM.mousePositionY(event.pageY);
        outputVM.elementOffsetX(offset.left);
        outputVM.elementOffsetY(offset.top);
        outputVM.mouseRelativeX(event.pageX - offset.left);
        outputVM.mouseRelativeY(event.pageY - offset.top);
        updateImgViewerScreenCoordinatesVM();
    }

    function onOsdCanvasMouseLeave(event) {
        outputVM.haveMouse(false);
    }

    function updateImageVM() {
        if (outputVM.haveImage()) {
            outputVM.imgWidth(imagingHelper.imgWidth);
            outputVM.imgHeight(imagingHelper.imgHeight);
            outputVM.imgAspectRatio(imagingHelper.imgAspectRatio);
            outputVM.minZoom(imagingHelper.getMinZoom());
            outputVM.maxZoom(imagingHelper.getMaxZoom());
        }
    }

    function updateImgViewerViewVM() {
        if (outputVM.haveImage()) {
            var containerSize = viewer.viewport.getContainerSize();
            outputVM.OsdContainerWidth(containerSize.x);
            outputVM.OsdContainerHeight(containerSize.y);
            outputVM.OsdZoom(viewer.viewport.getZoom(true));
            var boundsRect = viewer.viewport.getBounds(true);
            outputVM.OsdBoundsX(boundsRect.x),
            outputVM.OsdBoundsY(boundsRect.y),
            outputVM.OsdBoundsWidth(boundsRect.width),
            outputVM.OsdBoundsHeight(boundsRect.height),

            outputVM.zoomFactor(imagingHelper.getZoomFactor());
            outputVM.viewportWidth(imagingHelper._viewportWidth);
            outputVM.viewportHeight(imagingHelper._viewportHeight);
            outputVM.viewportOriginX(imagingHelper._viewportOrigin.x);
            outputVM.viewportOriginY(imagingHelper._viewportOrigin.y);
            outputVM.viewportCenterX(imagingHelper._viewportCenter.x);
            outputVM.viewportCenterY(imagingHelper._viewportCenter.y);
        }
    }

    function updateImgViewerScreenCoordinatesVM() {
        if (outputVM.haveImage() && outputVM.haveMouse()) {
            var logX = imagingHelper.physicalToLogicalX(outputVM.mouseRelativeX());
            var logY = imagingHelper.physicalToLogicalY(outputVM.mouseRelativeY());
            outputVM.physicalToLogicalX(logX);
            outputVM.physicalToLogicalY(logY);
            outputVM.logicalToPhysicalX(imagingHelper.logicalToPhysicalX(logX));
            outputVM.logicalToPhysicalY(imagingHelper.logicalToPhysicalY(logY));
            var dataX = imagingHelper.physicalToDataX( outputVM.mouseRelativeX());
            var dataY = imagingHelper.physicalToDataY( outputVM.mouseRelativeY());
            outputVM.physicalToDataX(dataX);
            outputVM.physicalToDataY(dataY);
            outputVM.dataToPhysicalX(imagingHelper.dataToPhysicalX(dataX));
            outputVM.dataToPhysicalY(imagingHelper.dataToPhysicalY(dataY));
        }
    }

    function updateImgViewerDataCoordinatesVM() {
        if (outputVM.haveImage()) {
            outputVM.logicalToDataTLX(imagingHelper.logicalToDataX(0.0));
            outputVM.logicalToDataTLY(imagingHelper.logicalToDataY(0.0));
            outputVM.logicalToDataBRX(imagingHelper.logicalToDataX(1.0));
            outputVM.logicalToDataBRY(imagingHelper.logicalToDataY(1.0));
            outputVM.dataToLogicalTLX(imagingHelper.dataToLogicalX(0));
            outputVM.dataToLogicalTLY(imagingHelper.dataToLogicalY(0));
            outputVM.dataToLogicalBRX(imagingHelper.dataToLogicalX(imagingHelper.imgWidth));
            outputVM.dataToLogicalBRY(imagingHelper.dataToLogicalY(imagingHelper.imgHeight));
        }
    }

    function onWindowResize() {
        var headerheight = $('.shell-header-wrapper').outerHeight(true);
        var footerheight = $('.shell-footer-wrapper').outerHeight(true);
        //var shellheight = $('.shell-wrapper').innerHeight();
        //var contentheight = shellheight - (headerheight + footerheight);
        $('.shell-view-wrapper').css('top', headerheight);
        $('.shell-view-wrapper').css('bottom', footerheight);

        $('.viewer-container').css('height', $('.output-container').height());

        if (viewer && imagingHelper && !viewer.autoResize) {
            // We're handling viewer resizing ourselves. Let the ImagingHelper do it.
            imagingHelper.notifyResize();
        }
    }

    _$navExpanderHeaderContainer.on('click', null, function (event) {
        if (_navExpanderIsCollapsed) {
            _navExpanderExpand();
        }
        else {
            _navExpanderCollapse();
        }
    });

    function _navExpanderMakeResizable() {
        _$navExpander.resizable({
            disabled: false,
            handles: 'e, s, se',
            minWidth: 100,
            minHeight: 100,
            maxWidth: null,
            maxHeight: null,
            containment: '#theImageViewerContainer',
            resize: function (event, ui) {
                _navExpanderWidth = ui.size.width;
                _navExpanderHeight = ui.size.height;
                _navExpanderResizeContent();
            }
        });
    }

    function _navExpanderRemoveResizable() {
        _$navExpander.resizable('destroy');
    }

    function _navExpanderDoExpand(adjustresizable) {
        if (adjustresizable) {
            _navExpanderMakeResizable();
        }
        _$navExpander.width(_navExpanderWidth);
        _$navExpander.height(_navExpanderHeight);
        _$navExpanderContentContainer.show('fast', function () {
            _navExpanderResizeContent();
        });
        _$navExpander.css('opacity', _navExpanderExpandedOpacity);
    }

    function _navExpanderDoCollapse(adjustresizable) {
        _$navExpander.css('opacity', _navExpanderCollapsedOpacity);
        _$navExpanderContentContainer.hide('fast');
        _$navExpander.width(_navExpanderCollapsedWidth);
        _$navExpander.height(_navExpanderCollapsedHeight);
        _navExpanderResizeContent();
        if (adjustresizable) {
            _navExpanderRemoveResizable();
        }
    }

    function _navExpanderExpand() {
        if (_navExpanderIsCollapsed) {
            _navExpanderDoExpand(true);
            _navExpanderIsCollapsed = false;
        }
    }

    function _navExpanderCollapse() {
        if (!_navExpanderIsCollapsed) {
            _navExpanderDoCollapse(true);
            _navExpanderIsCollapsed = true;
        }
    }

    function _navExpanderResizeContent() {
        var wrapperwidth = _$navExpander.innerWidth();
        var wrapperheight = _$navExpander.innerHeight();
        var headerheight = _$navExpanderHeaderContainer ? _$navExpanderHeaderContainer.outerHeight(true) : 0;
        var newheight = wrapperheight - headerheight;
        _$navExpanderContentContainer.width(wrapperwidth);
        _$navExpanderContentContainer.height(newheight);
        viewer.navigator.updateSize();
        viewer.navigator.update(viewer.viewport);
    }

    var outputVM = {
        haveImage: ko.observable(false),
        haveMouse: ko.observable(false),
        imgWidth: ko.observable(0),
        imgHeight: ko.observable(0),
        imgAspectRatio: ko.observable(0),
        minZoom: ko.observable(0),
        maxZoom: ko.observable(0),
        OsdContainerWidth: ko.observable(0),
        OsdContainerHeight: ko.observable(0),
        OsdZoom: ko.observable(0),
        OsdBoundsX: ko.observable(0),
        OsdBoundsY: ko.observable(0),
        OsdBoundsWidth: ko.observable(0),
        OsdBoundsHeight: ko.observable(0),
        OsdMousePositionX: ko.observable(0),
        OsdMousePositionY: ko.observable(0),
        OsdElementOffsetX: ko.observable(0),
        OsdElementOffsetY: ko.observable(0),
        OsdMouseRelativeX: ko.observable(0),
        OsdMouseRelativeY: ko.observable(0),
        zoomFactor: ko.observable(0),
        viewportWidth: ko.observable(0),
        viewportHeight: ko.observable(0),
        viewportOriginX: ko.observable(0),
        viewportOriginY: ko.observable(0),
        viewportCenterX: ko.observable(0),
        viewportCenterY: ko.observable(0),
        mousePositionX: ko.observable(0),
        mousePositionY: ko.observable(0),
        elementOffsetX: ko.observable(0),
        elementOffsetY: ko.observable(0),
        mouseRelativeX: ko.observable(0),
        mouseRelativeY: ko.observable(0),
        physicalToLogicalX: ko.observable(0),
        physicalToLogicalY: ko.observable(0),
        logicalToPhysicalX: ko.observable(0),
        logicalToPhysicalY: ko.observable(0),
        physicalToDataX: ko.observable(0),
        physicalToDataY: ko.observable(0),
        dataToPhysicalX: ko.observable(0),
        dataToPhysicalY: ko.observable(0),
        logicalToDataTLX: ko.observable(0),
        logicalToDataTLY: ko.observable(0),
        logicalToDataBRX: ko.observable(0),
        logicalToDataBRY: ko.observable(0),
        dataToLogicalTLX: ko.observable(0),
        dataToLogicalTLY: ko.observable(0),
        dataToLogicalBRX: ko.observable(0),
        dataToLogicalBRY: ko.observable(0)
    };

    var svgOverlayVM = {
        annoGroupTransform: annoGroupTransform
    };

    var vm = {
        appTitle: ko.observable(appTitle),
        appDesc: ko.observable(appDesc),
        outputVM: ko.observable(outputVM),
        svgOverlayVM: ko.observable(svgOverlayVM)
    };

    ko.applyBindings(vm);

}());
