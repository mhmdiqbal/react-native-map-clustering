import { act, createRef, type ReactElement } from "react";
import { createRoot } from "test-renderer";
import type { MapMarker } from "react-native-maps";
import Marker from "../src/Marker";

const coordinate = { latitude: 52.4, longitude: 18.7 };

const renderMarker = async (element: ReactElement) => {
  const root = createRoot();
  await act(async () => {
    root.render(element);
  });
  return root.container.queryAll((node) => node.type === "Marker");
};

describe("Marker", () => {
  it("renders a react-native-maps Marker with the same props", async () => {
    const [marker] = await renderMarker(
      <Marker coordinate={coordinate} title="Home" testID="home" />
    );

    expect(marker.props).toMatchObject({ coordinate, title: "Home", testID: "home" });
  });

  it("does not pass cluster to the native Marker", async () => {
    const [marker] = await renderMarker(<Marker coordinate={coordinate} cluster={false} />);

    expect(marker.props).not.toHaveProperty("cluster");
  });

  it("forwards the ref", async () => {
    const ref = createRef<MapMarker>();
    await renderMarker(<Marker ref={ref} coordinate={coordinate} />);

    expect(ref.current).not.toBeNull();
  });
});
