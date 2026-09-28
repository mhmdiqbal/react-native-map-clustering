# Changelog

## 5.0.0

- Rewrite the package in TypeScript. The types now come from the code, and the hand-written `index.d.ts` is gone.
- Ship both an ES module build and a CommonJS build, with types for each. `require` works, so Jest in apps no longer has to transform this package.
- Add a typed `Marker` export with the `cluster` prop.
- Export the types `ClusteredMapViewProps`, `Cluster`, `MapFeature`, `PointFeature`, `MarkerProps` and `RenderClusterProps`. `MapView` is also the type of the map instance.
- Breaking: deep imports like `.../lib/helpers` no longer work. Import from the package root.
- Breaking for TypeScript: `selectedClusterId` is a `number`, and `region` is a `Region`.
- `selectedClusterId` without `selectedClusterColor` now keeps `clusterColor`. Before, the cluster had no color.
- `selectedClusterId` and `selectedClusterColor` are no longer passed to the native `MapView`.
- A marker with `cluster={true}` no longer breaks the spiral.
- Remove `duration: 750` from `fitToCoordinates`. `react-native-maps` never read it. The zoom still animates.
- Add `react` to `peerDependencies`.

## 4.0.2

- Fix TypeScript types. The module name is now `@mhmdiqbal/react-native-map-clustering`, so the types load for the new package name.
- Add `onRegionChangeComplete(region, details, markers)` to the types.
- Remove `getClusterEngine` from the types. The code never used it.
- Remove the `@mapbox/geo-viewport` dependency. A small local function now finds the map zoom. It gives the same zoom as before.
- Rewrite the README. Add this changelog to the npm package.
- Move the tests out of `lib`.
- Add `oxlint`. `npm run lint` checks the code, fails on any warning, and runs before publish.
- `mapRef={null}` and `superClusterRef={null}` no longer crash.
- Add tests for the components. Coverage is 100%, and `npm test` fails if a file drops below 95%.
- Rebuild the clusters when `radius`, `maxZoom`, `minZoom`, `minPoints`, `extent` or `nodeSize` changes.
- Fix the spiral when more than one stacked cluster is in view. Before, the later clusters lost their markers.
- Support a function `ref`, like `ref={(map) => ...}`.
- Do not crash without `region` or `initialRegion`. The clusters show after the first `onRegionChangeComplete`.
- `renderCluster` now runs inside a small component. It gets the same data as before.

## 4.0.1

- First release as `@mhmdiqbal/react-native-map-clustering`.
- Center the cluster marker on its point (`anchor` and `centerOffset`).
- Pass `duration: 750` to `fitToCoordinates` when you press a cluster. `react-native-maps` ignores it (see 5.0.0).
- Use one shared empty array for empty state, to avoid extra renders.
- Add unit tests for the helpers.
- Publish only the files the package needs.

## 4.0.0

This fork starts here. Version 4.0.0 is the last version of the original
[react-native-map-clustering](https://github.com/tomekvenits/react-native-map-clustering) by Venits.
See the original repo for older changes.
