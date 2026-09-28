# Example app

An Expo app that uses the library as npm would publish it.

## Run

From the repo root:

```sh
npm run example:setup
```

This builds the library, packs it into `example/`, and installs it.
Run it again after each change to the library.

Then start the app in the iOS simulator with Expo Go:

```sh
cd example
npx expo start --ios
```

## Device test

The flows in `.maestro/` use [Maestro](https://maestro.dev). Keep the app running, then:

```sh
cd example
maestro test .maestro/
```

They check clusters, cluster press, the spiral, clustering on/off, radius change, and a custom cluster.
