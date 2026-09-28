# React Native Map Clustering

> This is a fork of [react-native-map-clustering](https://github.com/tomekvenits/react-native-map-clustering) by Venits.
> It is published on npm as [`@mhmdiqbal/react-native-map-clustering`](https://www.npmjs.com/package/@mhmdiqbal/react-native-map-clustering).
> See [Credits](#credits) for more.

This module groups the markers on a [react-native-maps](https://github.com/react-native-maps/react-native-maps) map into clusters.
It uses [supercluster](https://github.com/mapbox/supercluster) to build the clusters.

- Works on Android and iOS.
- Works with Expo and with the React Native CLI.
- Includes TypeScript types.

![Demo](https://raw.githubusercontent.com/venits/react-native-map-clustering/assets/assets/demo.gif)

## Installation

```sh
npm install @mhmdiqbal/react-native-map-clustering react-native-maps
```

Or with yarn:

```sh
yarn add @mhmdiqbal/react-native-map-clustering react-native-maps
```

`react-native-maps` is a peer dependency. Set it up first. See the [react-native-maps installation guide](https://github.com/react-native-maps/react-native-maps/blob/master/docs/installation.md).

## Usage

Use `MapView` from this package in place of the `MapView` from `react-native-maps`.
Put your `Marker` components inside it. The markers are clustered for you.

```js
import React from "react";
import MapView from "@mhmdiqbal/react-native-map-clustering";
import { Marker } from "react-native-maps";

const INITIAL_REGION = {
  latitude: 52.5,
  longitude: 19.2,
  latitudeDelta: 8.5,
  longitudeDelta: 8.5,
};

const App = () => (
  <MapView initialRegion={INITIAL_REGION} style={{ flex: 1 }}>
    <Marker coordinate={{ latitude: 52.4, longitude: 18.7 }} />
    <Marker coordinate={{ latitude: 52.1, longitude: 18.4 }} />
    <Marker coordinate={{ latitude: 52.6, longitude: 18.3 }} />
    <Marker coordinate={{ latitude: 51.6, longitude: 18.0 }} />
    <Marker coordinate={{ latitude: 53.1, longitude: 18.8 }} />
    <Marker coordinate={{ latitude: 52.9, longitude: 19.4 }} />
    <Marker coordinate={{ latitude: 52.2, longitude: 21 }} />
    <Marker coordinate={{ latitude: 52.4, longitude: 21 }} />
    <Marker coordinate={{ latitude: 51.8, longitude: 20 }} />
  </MapView>
);

export default App;
```

To keep a marker out of clustering, give it the prop `cluster={false}`.

All other props go to the `MapView` of `react-native-maps`.

## Props

### Clustering

These props go to [supercluster](https://github.com/mapbox/supercluster#options).

| Name                  | Type   | Default              | Note                                           |
| --------------------- | ------ | -------------------- | ---------------------------------------------- |
| **clusteringEnabled** | Bool   | `true`               | Set to `false` to turn off clustering.         |
| **radius**            | Number | 6% of window width   | Cluster radius, in pixels.                     |
| **minZoom**           | Number | `1`                  | Lowest zoom level that has clusters.           |
| **maxZoom**           | Number | `20`                 | Highest zoom level that has clusters.          |
| **minPoints**         | Number | `2`                  | Lowest number of markers that make a cluster.  |
| **extent**            | Number | `512`                | Tile extent. The radius uses this unit.        |
| **nodeSize**          | Number | `64`                 | Size of the KD-tree leaf node.                 |

### Cluster style

| Name                     | Type     | Default     | Note                                                                          |
| ------------------------ | -------- | ----------- | ----------------------------------------------------------------------------- |
| **clusterColor**         | String   | `#00B386`   | Background color of a cluster.                                                |
| **clusterTextColor**     | String   | `#FFFFFF`   | Color of the number in a cluster.                                             |
| **clusterFontFamily**    | String   | `undefined` | Font family of the number in a cluster.                                       |
| **selectedClusterId**    | String   | `undefined` | ID of the selected cluster. This cluster uses `selectedClusterColor`.         |
| **selectedClusterColor** | String   | `undefined` | Background color of the selected cluster.                                     |
| **spiderLineColor**      | String   | `#FF0000`   | Color of the lines from the center to each marker in the spiral view.         |
| **renderCluster**        | Function | `undefined` | Renders your own cluster component. See [Custom cluster](#custom-cluster).    |

### Behavior

| Name                             | Type                  | Default                                        | Note                                                                                                                          |
| -------------------------------- | --------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **preserveClusterPressBehavior** | Bool                  | `false`                                        | If `true`, the map does not zoom in when you press a cluster.                                                                 |
| **edgePadding**                  | Object                | `{ top: 50, left: 50, bottom: 50, right: 50 }` | Padding for `fitToCoordinates` when the map zooms in to a pressed cluster.                                                    |
| **spiralEnabled**                | Bool                  | `true`                                         | At zoom level 18 and higher, clusters open into a spiral of markers. Set to `false` to turn this off.                         |
| **tracksViewChanges**            | Bool                  | `false`                                        | Whether cluster markers track view changes. It is off by default because it is faster.                                        |
| **animationEnabled**             | Bool                  | `true`                                         | Animates clusters when they split or join. **iOS only.**                                                                      |
| **layoutAnimationConf**          | LayoutAnimationConfig | `LayoutAnimation.Presets.spring`               | The animation config for splitting and joining clusters. **iOS only.**                                                        |

### Callbacks and refs

| Name                                                 | Type             | Default    | Note                                                                                                      |
| ---------------------------------------------------- | ---------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| **onClusterPress(cluster, markers)**                 | Function         | `() => {}` | Called when you press a cluster. You get the cluster and its markers.                                     |
| **onRegionChangeComplete(region, details, markers)** | Function         | `() => {}` | Called when the map region changes. You get the region, the details from `react-native-maps`, and the markers. |
| **onMarkersChange(markers)**                         | Function         | `() => {}` | Called when the markers change. You get the markers.                                                      |
| **mapRef(map)**                                      | Function         | `() => {}` | Called with the `react-native-maps` `MapView` instance. For a ref object, use `ref`. See below.           |
| **superClusterRef**                                  | MutableRefObject | `{}`       | Gets the `supercluster` instance. See the [supercluster docs](https://github.com/mapbox/supercluster).    |

## Access the map

Pass a ref with `ref`. The ref gets the `react-native-maps` `MapView` instance.
You can then call its methods, such as `animateToRegion()`.

```js
import React, { useRef } from "react";
import { Button } from "react-native";
import MapView from "@mhmdiqbal/react-native-map-clustering";

const INITIAL_REGION = {
  latitude: 52.5,
  longitude: 19.2,
  latitudeDelta: 8.5,
  longitudeDelta: 8.5,
};

const App = () => {
  const mapRef = useRef();

  const animateToRegion = () => {
    const region = {
      latitude: 42.5,
      longitude: 15.2,
      latitudeDelta: 7.5,
      longitudeDelta: 7.5,
    };

    mapRef.current.animateToRegion(region, 2000);
  };

  return (
    <>
      <MapView ref={mapRef} initialRegion={INITIAL_REGION} style={{ flex: 1 }} />
      <Button onPress={animateToRegion} title="Animate" />
    </>
  );
};

export default App;
```

`mapRef` is a function, not a ref object. Use it like this:

```js
<MapView mapRef={(map) => (myMap = map)} />
```

Do not pass a `useRef()` object to `mapRef`. The app will crash. Use `ref` for that.

## Custom cluster

Use `renderCluster` to draw your own cluster.
The function gets the cluster data and an `onPress` handler.

```js
import { Text, View } from "react-native";
import { Marker } from "react-native-maps";

const renderCluster = (cluster) => {
  const { id, geometry, onPress, properties } = cluster;

  return (
    <Marker
      key={`cluster-${id}`}
      coordinate={{
        longitude: geometry.coordinates[0],
        latitude: geometry.coordinates[1],
      }}
      onPress={onPress}
    >
      <View style={{ padding: 8, borderRadius: 20, backgroundColor: "#333" }}>
        <Text style={{ color: "#fff" }}>{properties.point_count}</Text>
      </View>
    </Marker>
  );
};

<MapView renderCluster={renderCluster} />;
```

The cluster data also has `clusterColor`, `clusterTextColor` and `clusterFontFamily`.

## Moving from react-native-map-clustering

1. Remove the old package and add this one:

   ```sh
   npm uninstall react-native-map-clustering
   npm install @mhmdiqbal/react-native-map-clustering
   ```

2. Change your imports:

   ```diff
   - import MapView from "react-native-map-clustering";
   + import MapView from "@mhmdiqbal/react-native-map-clustering";
   ```

3. If you come from version 3.x, check `onRegionChangeComplete`.
   The markers are now the third argument, not the second:

   ```diff
   - onRegionChangeComplete={(region, markers) => {}}
   + onRegionChangeComplete={(region, details, markers) => {}}
   ```

The props are the same as in the original package.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## Support

Found a bug or have a question? Please open an issue on [GitHub](https://github.com/mhmdiqbal/react-native-map-clustering/issues).
Pull requests are welcome.

## Credits

This package is a fork of [react-native-map-clustering](https://github.com/tomekvenits/react-native-map-clustering) by Venits.
The original package is on npm as [`react-native-map-clustering`](https://www.npmjs.com/package/react-native-map-clustering).
This fork starts from its version 4.0.0.

Thanks to Venits and to all contributors of the original project.

## License

MIT. See [LICENSE](LICENSE).
The license keeps the copyright of the original author.
