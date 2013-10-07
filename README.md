##OpenSeadragonImagingHelper

OpenSeadragonImagingHelper is a plugin for [OpenSeadragon](https://github.com/openseadragon/openseadragon) 
which implements some properties and methods helpful in
imaging applications.

###Usage

To use, include *openseadragon-imaginghelper.js* after *openseadragon.js*.
This adds the *ImagingHelper* class to the OpenSeadragon namespace.

An *ImagingHelper* object can be attached to an OpenSeadragon viewer two ways:


1. Call the activateImagingHelper method on the viewer
2. Create a new ImagingHelper object, passing a viewer reference in the options parameter

Both methods return a new ImagingHelper object, and both methods also add the ImagingHelper
object reference to the viewer as a property called 'imagingHelper'.

```javascript
    //Examples

    // create an OpenSeadragon viewer
    var viewer = OpenSeadragon( {...} );
    // add an ImagingHelper to the viewer
    var imagingHelper = viewer.activateImagingHelper();

    // ... or, create an ImagingHelper and attach it to an existing OpenSeadragon viewer
    var imagingHelper = new OpenSeadragon.ImagingHelper({viewer: existingviewer});
```

The ImagingHelper class provides a simplified zoomFactor which is simply the ratio
of the displayed image pixel size to the image's native pixel size.

The ImagingHelper methods use three coordinate systems,
named as follows:


1. **physical:** Device pixel coordinates relative to the SeaDragon viewer
2. **logical:**  0.0 to 1.0 relative to the image's native dimensions
3. **data:**     Pixel coordinates relative to the image's native dimensions

Methods are provided to zoom and/or pan using these conventions, as well as to convert
individual horizontal/vertical values or point ({x,y}) objects between coordinate systems 
*(Note: methods that return a point object return new [OpenSeadragon.Point](http://openseadragon.github.io/docs/symbols/OpenSeadragon.Point.html)
objects)*
