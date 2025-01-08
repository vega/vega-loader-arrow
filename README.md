# vega-loader-arrow

Data loading for the [Apache Arrow](https://arrow.apache.org/) format.

This package extends Vega's set of data format parsers to support the type `"arrow"` in Vega version 5.0 and higher. It can load either Apache Arrow IPC binary data or pre-parsed tables from the [`@uwdata/flechette`](https://idl.uw.edu/flechette/) or [`apache-arrow`](https://arrow.apache.org/docs/js/) libraries. Internally, this package bundles flechette to parse binary IPC data.

You can try the Arrow loader in our Observable notebook examples for both [Vega](https://observablehq.com/@vega/vega-and-apache-arrow) and [Vega-](https://observablehq.com/@vega/apache-arrow-in-vega-lite)[Lite](https://observablehq.com/@randomfractals/chicago-crimes-arrow-data-vega-viz).

## Usage Instructions

### Browser Use

To use this package in a web application, include the compiled `vega-loader-arrow.min.js` JavaScript file as a script import on a web page.

Import the vega-loader-arrow package _after_ Vega has been imported. For example, loading all libraries from a CDN:

```html
  <script src="https://cdn.jsdelivr.net/npm/vega"></script>
  <script src="https://cdn.jsdelivr.net/npm/vega-loader-arrow"></script>
```

### Node.js or Bundle Use

In the web browser case above, the Arrow data reader is automatically added to the `vega.format` data format registry. If you are instead importing the `vega-loader-arrow` package in node.js or for use in an application bundle, you will need to explicitly register the package:

```js
const arrow = require('vega-loader-arrow');
const { formats } = require('vega');

// register arrow reader under type 'arrow'
formats('arrow', arrow);
```

### Vega Specifications

Once vega-loader-arrow has been imported and registered, Vega specs can reference and load Arrow data like so:

```json
{
  "data": [
    {
      "name": "scrabble",
      "format": {"type": "arrow"},
      "url": "https://gist.githubusercontent.com/TheNeuralBit/64d8cc13050c9b5743281dcf66059de5/raw/c146baf28a8e78cfe982c6ab5015207c4cbd84e3/scrabble.arrow"
    }
  ]
}
```

For more about the dataset above (concerning over 1.5M scrabble games!), see ["Introduction to Apache Arrow"](https://beta.observablehq.com/@theneuralbit/introduction-to-apache-arrow) by Brian Hulette.

## API Reference

<a name="arrow" href="#arrow">#</a>
vega.format.<b>arrow</b>(<i>data</i>)
[<>](https://github.com/vega/vega-loader-arrow/blob/master/src/index.js "Source")

Returns an array of data objects for the input *data*. The *data* can either be Arrow IPC binary data as an `ArrayBuffer`, `Uint8Array`, or `Uint8Array[]`, or a pre-parsed table created by `@uwdata/flechette` or `apache-arrow`.

The returned data objects include properties for all named fields; property access results in a lookup against an underlying Arrow column. If the Arrow table includes multiple fields with the same name, the proxy object accesses the column with the lowest index. An error is thrown if a caller attempts to set values on named field properties. Writes to properties other than Arrow field names are supported, and will not affect the underlying Arrow data.

## Making a release

To make a release, tag a new version with `npm version XXX` and push the tag. GitHub actions will automatically make a release.
