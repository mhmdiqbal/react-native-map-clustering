# Changelog

## 4.0.2

- Fix TypeScript types. The module name is now `@mhmdiqbal/react-native-map-clustering`, so the types load for the new package name.
- Add `onRegionChangeComplete(region, details, markers)` to the types.
- Remove `getClusterEngine` from the types. The code never used it.
- Remove the `@mapbox/geo-viewport` dependency. A small local function now finds the map zoom. It gives the same zoom as before.
- Rewrite the README. Add this changelog to the npm package.
- Move the tests out of `lib`.
- Add `oxlint`. `npm run lint` checks the code, and it runs before publish.
- `mapRef={null}` and `superClusterRef={null}` no longer crash.
- Add tests for the components. Coverage is 100%, and `npm test` fails if a file drops below 95%.

## 4.0.1

- First release as `@mhmdiqbal/react-native-map-clustering`.
- Center the cluster marker on its point (`anchor` and `centerOffset`).
- Animate the zoom when you press a cluster (750 ms).
- Use one shared empty array for empty state, to avoid extra renders.
- Add unit tests for the helpers.
- Publish only the files the package needs.

## 4.0.0

This fork starts here. Version 4.0.0 is the last version of the original
[react-native-map-clustering](https://github.com/tomekvenits/react-native-map-clustering) by Venits.
See the original repo for older changes.
