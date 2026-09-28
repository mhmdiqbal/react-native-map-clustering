import { act } from "react";
import { createRoot } from "test-renderer";
import ClusteredMarker from "../lib/ClusteredMarker";

const renderMarker = async (props) => {
  const root = createRoot();
  await act(async () => {
    root.render(
      <ClusteredMarker
        geometry={{ coordinates: [-122.4, 37.75] }}
        properties={{ point_count: 60 }}
        clusterColor="#123456"
        clusterTextColor="#abcdef"
        clusterFontFamily="Inter"
        tracksViewChanges={false}
        onPress={jest.fn()}
        {...props}
      />
    );
  });
  return root.container;
};

const byType = (container, type) =>
  container.queryAll((node) => node.type === type);

describe("ClusteredMarker", () => {
  it("renders a Marker at the cluster coordinate", async () => {
    const [marker] = byType(await renderMarker(), "Marker");

    expect(marker.props.coordinate).toEqual({ latitude: 37.75, longitude: -122.4 });
    expect(marker.props.anchor).toEqual({ x: 0.5, y: 0.5 });
    expect(marker.props.centerOffset).toEqual({ x: 0, y: 0 });
    expect(marker.props.style).toEqual({ zIndex: 61 });
    expect(marker.props.tracksViewChanges).toBe(false);
  });

  it("passes onPress to the Marker", async () => {
    const onPress = jest.fn();
    const [marker] = byType(await renderMarker({ onPress }), "Marker");

    marker.props.onPress();

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("sizes the cluster by point count", async () => {
    const [touchable] = byType(await renderMarker(), "TouchableOpacity");
    const [wrapper, cluster] = byType(touchable, "View");

    expect(touchable.props.style[1]).toEqual({ width: 84, height: 84 });
    expect(wrapper.props.style[1]).toMatchObject({ width: 84, height: 84, borderRadius: 42 });
    expect(cluster.props.style[1]).toMatchObject({ width: 64, height: 64, borderRadius: 32 });
  });

  it("uses the cluster colors and font", async () => {
    const container = await renderMarker();
    const [wrapper, cluster] = byType(container, "View");
    const [text] = byType(container, "Text");

    expect(wrapper.props.style[1].backgroundColor).toBe("#123456");
    expect(cluster.props.style[1].backgroundColor).toBe("#123456");
    expect(text.props.style[1]).toEqual({ color: "#abcdef", fontSize: 20, fontFamily: "Inter" });
  });

  it("shows the point count", async () => {
    const [text] = byType(await renderMarker({ properties: { point_count: 7 } }), "Text");

    expect(text.children).toEqual(["7"]);
  });
});
