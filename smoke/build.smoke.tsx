import { act } from "react";
import { createRoot } from "test-renderer";
import { Marker } from "react-native-maps";

type Package = typeof import("../src");

const region = { latitude: 52.5, longitude: 19.2, latitudeDelta: 8.5, longitudeDelta: 8.5 };

describe.each(["../lib/commonjs/index.js", "../lib/module/index.js"])("%s", (path) => {
  const { default: MapView, Marker: ClusterableMarker } = jest.requireActual<Package>(path);

  it("renders a cluster and a single marker", async () => {
    const root = createRoot();
    await act(async () => {
      root.render(
        <MapView initialRegion={region}>
          <Marker testID="a1" coordinate={{ latitude: 52.4, longitude: 18.7 }} />
          <Marker testID="a2" coordinate={{ latitude: 52.45, longitude: 18.75 }} />
          <ClusterableMarker testID="b" coordinate={{ latitude: 50, longitude: 25 }} />
        </MapView>
      );
    });
    const markers = root.container.queryAll((node) => node.type === "Marker");

    expect(markers.filter((node) => node.props.anchor)).toHaveLength(1);
    expect(markers.map((node) => node.props.testID).filter(Boolean)).toEqual(["b"]);
  });
});
