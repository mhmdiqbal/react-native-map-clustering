import { act, createRef } from "react";
import { createRoot } from "test-renderer";
import { LayoutAnimation, Platform, View } from "react-native";
import { Marker, mapInstance } from "react-native-maps";
import MapView from "../lib/ClusteredMapView";

const INITIAL_REGION = {
  latitude: 52.5,
  longitude: 19.2,
  latitudeDelta: 8.5,
  longitudeDelta: 8.5,
};
const CLOSE_REGION = {
  latitude: 52.45,
  longitude: 18.75,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};
const STREET_REGION = {
  latitude: 52.4,
  longitude: 18.7,
  latitudeDelta: 0.0005,
  longitudeDelta: 0.0005,
};
const EMPTY_STREET_REGION = { ...STREET_REGION, latitude: 10, longitude: 10 };
const details = { isGesture: true };

const groupMarkers = [
  <Marker key="a1" testID="a1" coordinate={{ latitude: 52.4, longitude: 18.7 }} />,
  <Marker key="a2" testID="a2" coordinate={{ latitude: 52.45, longitude: 18.75 }} />,
  <Marker key="a3" testID="a3" coordinate={{ latitude: 52.5, longitude: 18.8 }} />,
  <Marker key="b" testID="b" coordinate={{ latitude: 50, longitude: 25 }} />,
];

const stackMarkers = (prefix, latitude, longitude) =>
  [1, 2, 3].map((n) => (
    <Marker
      key={`${prefix}${n}`}
      testID={`${prefix}${n}`}
      coordinate={{ latitude, longitude }}
    />
  ));

const render = async (element) => {
  const root = createRoot();
  await act(async () => {
    root.render(element);
  });
  return root;
};

const rerender = async (root, element) => {
  await act(async () => {
    root.render(element);
  });
};

const byType = (root, type) => root.container.queryAll((node) => node.type === type);
const map = (root) => byType(root, "MapView")[0];
const clusters = (root) => byType(root, "Marker").filter((node) => node.props.anchor);
const userMarkerIds = (root) =>
  byType(root, "Marker")
    .map((node) => node.props.testID)
    .filter(Boolean)
    .toSorted();
const clusterCount = (cluster) =>
  cluster.queryAll((node) => node.type === "Text")[0].children[0];

const changeRegion = async (root, region) => {
  await act(async () => {
    map(root).props.onRegionChangeComplete(region, details);
  });
};

const press = async (cluster) => {
  await act(async () => {
    cluster.props.onPress();
  });
};

const openSpiral = async (props = {}, markers = stackMarkers("s", 52.4, 18.7)) => {
  const root = await render(
    <MapView initialRegion={INITIAL_REGION} {...props}>
      {markers}
    </MapView>
  );
  await press(clusters(root)[0]);
  await changeRegion(root, STREET_REGION);
  return root;
};

describe("ClusteredMapView", () => {
  describe("clustering", () => {
    it("groups close markers into a cluster and keeps far markers alone", async () => {
      const root = await render(
        <MapView initialRegion={INITIAL_REGION}>{groupMarkers}</MapView>
      );

      expect(clusters(root)).toHaveLength(1);
      expect(clusterCount(clusters(root)[0])).toBe("3");
      expect(userMarkerIds(root)).toEqual(["b"]);
    });

    it("uses the region prop when there is no initialRegion", async () => {
      const root = await render(<MapView region={INITIAL_REGION}>{groupMarkers}</MapView>);

      expect(clusters(root)).toHaveLength(1);
    });

    it("renders children that are not markers as they are", async () => {
      const root = await render(
        <MapView initialRegion={INITIAL_REGION}>
          {groupMarkers}
          <View testID="overlay" />
        </MapView>
      );

      expect(byType(root, "View").map((node) => node.props.testID)).toContain("overlay");
    });

    it("does not cluster a marker with cluster={false}", async () => {
      const root = await render(
        <MapView initialRegion={INITIAL_REGION}>
          {groupMarkers}
          <Marker testID="solo" cluster={false} coordinate={{ latitude: 52.41, longitude: 18.71 }} />
        </MapView>
      );

      expect(clusterCount(clusters(root)[0])).toBe("3");
      expect(userMarkerIds(root)).toEqual(["b", "solo"]);
    });

    it("renders all markers without clusters when clusteringEnabled is false", async () => {
      const root = await render(
        <MapView initialRegion={INITIAL_REGION} clusteringEnabled={false}>
          {groupMarkers}
        </MapView>
      );

      expect(clusters(root)).toHaveLength(0);
      expect(userMarkerIds(root)).toEqual(["a1", "a2", "a3", "b"]);
    });

    it("splits the cluster when the map zooms in", async () => {
      const root = await render(
        <MapView initialRegion={INITIAL_REGION}>{groupMarkers}</MapView>
      );

      await changeRegion(root, CLOSE_REGION);

      expect(clusters(root)).toHaveLength(0);
      expect(userMarkerIds(root)).toEqual(["a1", "a2", "a3"]);
    });

    it("gives the supercluster options to superClusterRef", async () => {
      const superClusterRef = createRef();
      await render(
        <MapView
          initialRegion={INITIAL_REGION}
          superClusterRef={superClusterRef}
          radius={10}
          maxZoom={15}
          minZoom={2}
          minPoints={3}
          extent={256}
          nodeSize={32}
        >
          {groupMarkers}
        </MapView>
      );

      expect(superClusterRef.current.options).toMatchObject({
        radius: 10,
        maxZoom: 15,
        minZoom: 2,
        minPoints: 3,
        extent: 256,
        nodeSize: 32,
      });
    });

    it("uses 6% of the window width as the default radius", async () => {
      const superClusterRef = createRef();
      await render(
        <MapView initialRegion={INITIAL_REGION} superClusterRef={superClusterRef}>
          {groupMarkers}
        </MapView>
      );

      expect(superClusterRef.current.options).toMatchObject({
        radius: 375 * 0.06,
        maxZoom: 20,
        minZoom: 1,
        minPoints: 2,
        extent: 512,
        nodeSize: 64,
      });
    });

    test.failing("rebuilds clusters when a cluster prop changes (#1)", async () => {
      const root = await render(
        <MapView initialRegion={INITIAL_REGION} radius={0.1}>
          {groupMarkers}
        </MapView>
      );
      expect(clusters(root)).toHaveLength(0);

      await rerender(
        root,
        <MapView initialRegion={INITIAL_REGION} radius={40}>
          {groupMarkers}
        </MapView>
      );

      expect(clusters(root)).toHaveLength(1);
    });

    test.failing("renders without region or initialRegion", async () => {
      const root = await render(<MapView>{groupMarkers}</MapView>);

      expect(map(root)).toBeDefined();
    });
  });

  describe("cluster style", () => {
    it("passes the colors, font and tracksViewChanges to the cluster marker", async () => {
      const root = await render(
        <MapView
          initialRegion={INITIAL_REGION}
          clusterColor="#111111"
          clusterTextColor="#222222"
          clusterFontFamily="Inter"
          tracksViewChanges
        >
          {groupMarkers}
        </MapView>
      );
      const [cluster] = clusters(root);
      const [text] = cluster.queryAll((node) => node.type === "Text");

      expect(cluster.queryAll((node) => node.type === "View")[0].props.style[1].backgroundColor).toBe("#111111");
      expect(text.props.style[1]).toMatchObject({ color: "#222222", fontFamily: "Inter" });
      expect(cluster.props.tracksViewChanges).toBe(true);
    });

    it("uses the default colors", async () => {
      const root = await render(
        <MapView initialRegion={INITIAL_REGION}>{groupMarkers}</MapView>
      );
      const [cluster] = clusters(root);
      const [text] = cluster.queryAll((node) => node.type === "Text");

      expect(cluster.queryAll((node) => node.type === "View")[0].props.style[1].backgroundColor).toBe("#00B386");
      expect(text.props.style[1].color).toBe("#FFFFFF");
      expect(cluster.props.tracksViewChanges).toBe(false);
    });

    it("uses selectedClusterColor for the selected cluster", async () => {
      const onClusterPress = jest.fn();
      const root = await render(
        <MapView initialRegion={INITIAL_REGION} onClusterPress={onClusterPress}>
          {groupMarkers}
        </MapView>
      );
      await press(clusters(root)[0]);
      const [cluster] = onClusterPress.mock.calls[0];

      await rerender(
        root,
        <MapView
          initialRegion={INITIAL_REGION}
          selectedClusterId={cluster.id}
          selectedClusterColor="#ff00ff"
        >
          {groupMarkers}
        </MapView>
      );

      const wrapper = clusters(root)[0].queryAll((node) => node.type === "View")[0];
      expect(wrapper.props.style[1].backgroundColor).toBe("#ff00ff");
    });

    it("renders a custom cluster with renderCluster", async () => {
      const renderCluster = jest.fn((cluster) => (
        <View key={cluster.id} testID="custom-cluster" onPress={cluster.onPress} />
      ));
      const root = await render(
        <MapView
          initialRegion={INITIAL_REGION}
          renderCluster={renderCluster}
          clusterColor="#111111"
          clusterTextColor="#222222"
          clusterFontFamily="Inter"
        >
          {groupMarkers}
        </MapView>
      );

      expect(clusters(root)).toHaveLength(0);
      expect(renderCluster).toHaveBeenCalledWith(
        expect.objectContaining({
          clusterColor: "#111111",
          clusterTextColor: "#222222",
          clusterFontFamily: "Inter",
          properties: expect.objectContaining({ point_count: 3 }),
          onPress: expect.any(Function),
        })
      );

      const custom = byType(root, "View").find((node) => node.props.testID === "custom-cluster");
      await press(custom);

      expect(mapInstance.fitToCoordinates).toHaveBeenCalledTimes(1);
    });
  });

  describe("cluster press", () => {
    it("zooms to the cluster markers and calls onClusterPress", async () => {
      const onClusterPress = jest.fn();
      const root = await render(
        <MapView initialRegion={INITIAL_REGION} onClusterPress={onClusterPress}>
          {groupMarkers}
        </MapView>
      );

      await press(clusters(root)[0]);

      const coordinates = mapInstance.fitToCoordinates.mock.calls[0][0];
      expect(coordinates).toHaveLength(3);
      expect(coordinates).toEqual(
        expect.arrayContaining([
          { latitude: 52.4, longitude: 18.7 },
          { latitude: 52.45, longitude: 18.75 },
          { latitude: 52.5, longitude: 18.8 },
        ])
      );
      expect(mapInstance.fitToCoordinates.mock.calls[0][1]).toEqual({
        edgePadding: { top: 50, left: 50, right: 50, bottom: 50 },
        duration: 750,
      });

      const [cluster, leaves] = onClusterPress.mock.calls[0];
      expect(cluster.properties.point_count).toBe(3);
      expect(leaves).toHaveLength(3);
    });

    it("uses the edgePadding prop", async () => {
      const edgePadding = { top: 1, left: 2, right: 3, bottom: 4 };
      const root = await render(
        <MapView initialRegion={INITIAL_REGION} edgePadding={edgePadding}>
          {groupMarkers}
        </MapView>
      );

      await press(clusters(root)[0]);

      expect(mapInstance.fitToCoordinates.mock.calls[0][1]).toEqual({ edgePadding, duration: 750 });
    });

    it("does not zoom when preserveClusterPressBehavior is true", async () => {
      const onClusterPress = jest.fn();
      const root = await render(
        <MapView
          initialRegion={INITIAL_REGION}
          preserveClusterPressBehavior
          onClusterPress={onClusterPress}
        >
          {groupMarkers}
        </MapView>
      );

      await press(clusters(root)[0]);

      expect(mapInstance.fitToCoordinates).not.toHaveBeenCalled();
      expect(onClusterPress).toHaveBeenCalledWith(
        expect.objectContaining({ id: expect.any(Number) }),
        expect.any(Array)
      );
    });
  });

  describe("region change", () => {
    it("calls onRegionChangeComplete and onMarkersChange with the new markers", async () => {
      const onRegionChangeComplete = jest.fn();
      const onMarkersChange = jest.fn();
      const root = await render(
        <MapView
          initialRegion={INITIAL_REGION}
          onRegionChangeComplete={onRegionChangeComplete}
          onMarkersChange={onMarkersChange}
        >
          {groupMarkers}
        </MapView>
      );

      await changeRegion(root, CLOSE_REGION);

      const markers = onMarkersChange.mock.calls[0][0];
      expect(markers).toHaveLength(3);
      expect(onRegionChangeComplete).toHaveBeenCalledWith(CLOSE_REGION, details, markers);
    });

    it("calls onRegionChangeComplete without markers when clustering is off", async () => {
      const onRegionChangeComplete = jest.fn();
      const onMarkersChange = jest.fn();
      const root = await render(
        <MapView
          initialRegion={INITIAL_REGION}
          clusteringEnabled={false}
          onRegionChangeComplete={onRegionChangeComplete}
          onMarkersChange={onMarkersChange}
        >
          {groupMarkers}
        </MapView>
      );

      await changeRegion(root, CLOSE_REGION);

      expect(onRegionChangeComplete).toHaveBeenCalledWith(CLOSE_REGION, details);
      expect(onMarkersChange).not.toHaveBeenCalled();
    });

    it("works when onRegionChangeComplete is null", async () => {
      const root = await render(
        <MapView initialRegion={INITIAL_REGION} onRegionChangeComplete={null}>
          {groupMarkers}
        </MapView>
      );

      await changeRegion(root, CLOSE_REGION);
      await rerender(
        root,
        <MapView initialRegion={INITIAL_REGION} onRegionChangeComplete={null} clusteringEnabled={false}>
          {groupMarkers}
        </MapView>
      );
      await changeRegion(root, CLOSE_REGION);

      expect(userMarkerIds(root)).toEqual(["a1", "a2", "a3", "b"]);
    });

    describe("animation", () => {
      const originalOS = Platform.OS;
      afterEach(() => {
        Platform.OS = originalOS;
      });

      it("animates on iOS with layoutAnimationConf", async () => {
        const layoutAnimationConf = { duration: 100 };
        const root = await render(
          <MapView initialRegion={INITIAL_REGION} layoutAnimationConf={layoutAnimationConf}>
            {groupMarkers}
          </MapView>
        );

        await changeRegion(root, CLOSE_REGION);

        expect(LayoutAnimation.configureNext).toHaveBeenCalledWith(layoutAnimationConf);
      });

      it("uses the spring preset by default", async () => {
        const root = await render(
          <MapView initialRegion={INITIAL_REGION}>{groupMarkers}</MapView>
        );

        await changeRegion(root, CLOSE_REGION);

        expect(LayoutAnimation.configureNext).toHaveBeenCalledWith(LayoutAnimation.Presets.spring);
      });

      it("does not animate on Android", async () => {
        Platform.OS = "android";
        const root = await render(
          <MapView initialRegion={INITIAL_REGION}>{groupMarkers}</MapView>
        );

        await changeRegion(root, CLOSE_REGION);

        expect(LayoutAnimation.configureNext).not.toHaveBeenCalled();
      });

      it("does not animate when animationEnabled is false", async () => {
        const root = await render(
          <MapView initialRegion={INITIAL_REGION} animationEnabled={false}>
            {groupMarkers}
          </MapView>
        );

        await changeRegion(root, CLOSE_REGION);

        expect(LayoutAnimation.configureNext).not.toHaveBeenCalled();
      });
    });
  });

  describe("spiral", () => {
    it("shows the markers of a stacked cluster in a spiral at zoom 18+", async () => {
      const root = await openSpiral({ spiderLineColor: "#00ff00" });

      expect(clusters(root)).toHaveLength(0);
      expect(userMarkerIds(root)).toEqual(["s1", "s2", "s3"]);

      const lines = byType(root, "Polyline");
      expect(lines).toHaveLength(3);
      expect(lines[0].props.strokeColor).toBe("#00ff00");
      const [center] = lines[0].props.coordinates;
      expect(center.latitude).toBeCloseTo(52.4, 4);
      expect(center.longitude).toBeCloseTo(18.7, 4);
    });

    it("moves each spiral marker to its own position", async () => {
      const root = await openSpiral();
      const positions = byType(root, "Marker").map((node) => node.props.coordinate);

      expect(new Set(positions.map((p) => `${p.latitude},${p.longitude}`)).size).toBe(3);
    });

    it("uses red spider lines by default", async () => {
      const root = await openSpiral();

      expect(byType(root, "Polyline")[0].props.strokeColor).toBe("#FF0000");
    });

    it("closes the spiral when the map zooms out", async () => {
      const root = await openSpiral();

      await changeRegion(root, INITIAL_REGION);

      expect(byType(root, "Polyline")).toHaveLength(0);
      expect(clusters(root)).toHaveLength(1);
    });

    it("closes the spiral when there are no markers in view", async () => {
      const root = await openSpiral();

      await changeRegion(root, EMPTY_STREET_REGION);

      expect(byType(root, "Polyline")).toHaveLength(0);
    });

    it("keeps single markers in spiral mode", async () => {
      const root = await openSpiral({}, [
        ...stackMarkers("s", 52.4, 18.7),
        <Marker key="near" testID="near" coordinate={{ latitude: 52.4001, longitude: 18.7001 }} />,
      ]);

      expect(userMarkerIds(root)).toEqual(["near", "s1", "s2", "s3"]);
      expect(byType(root, "Polyline")).toHaveLength(3);
    });

    it("drops a spiral marker when its child is removed", async () => {
      const root = await openSpiral();

      await rerender(
        root,
        <MapView initialRegion={INITIAL_REGION}>{stackMarkers("s", 52.4, 18.7).slice(0, 2)}</MapView>
      );

      expect(userMarkerIds(root)).toEqual(["s1", "s2"]);
      expect(byType(root, "Polyline")).toHaveLength(2);
    });

    it("does not open a spiral when spiralEnabled is false", async () => {
      const root = await openSpiral({ spiralEnabled: false });

      expect(byType(root, "Polyline")).toHaveLength(0);
      expect(clusters(root)).toHaveLength(1);

      await changeRegion(root, INITIAL_REGION);

      expect(clusters(root)).toHaveLength(1);
    });

    it("does not open a spiral before a cluster is pressed", async () => {
      const root = await render(
        <MapView initialRegion={INITIAL_REGION}>{stackMarkers("s", 52.4, 18.7)}</MapView>
      );

      await changeRegion(root, STREET_REGION);

      expect(byType(root, "Polyline")).toHaveLength(0);
    });

    test.failing("shows the markers of every stacked cluster in view (#1)", async () => {
      const root = await openSpiral({}, [
        ...stackMarkers("s", 52.4, 18.7),
        ...stackMarkers("t", 52.4002, 18.7002),
      ]);

      expect(userMarkerIds(root)).toEqual(["s1", "s2", "s3", "t1", "t2", "t3"]);
    });
  });

  describe("refs", () => {
    it("sets ref to the map instance", async () => {
      const ref = createRef();
      await render(<MapView ref={ref} initialRegion={INITIAL_REGION} />);

      expect(ref.current).toBe(mapInstance);
    });

    it("calls mapRef with the map instance", async () => {
      const mapRef = jest.fn();
      await render(<MapView mapRef={mapRef} initialRegion={INITIAL_REGION} />);

      expect(mapRef).toHaveBeenCalledWith(mapInstance);
    });

    it("works when mapRef and superClusterRef are null", async () => {
      const root = await render(
        <MapView mapRef={null} superClusterRef={null} initialRegion={INITIAL_REGION}>
          {groupMarkers}
        </MapView>
      );

      expect(clusters(root)).toHaveLength(1);
    });

    test.failing("calls a function ref with the map instance (#1)", async () => {
      const ref = jest.fn();
      await render(<MapView ref={ref} initialRegion={INITIAL_REGION} />);

      expect(ref).toHaveBeenCalledWith(mapInstance);
    });
  });
});
