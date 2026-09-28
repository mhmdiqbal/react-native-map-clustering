import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Marker as NativeMarker, type Region } from "react-native-maps";
import { StatusBar } from "expo-status-bar";
import MapView, {
  Marker,
  type ClusteredMapViewProps,
  type RenderClusterProps,
} from "@mhmdiqbal/react-native-map-clustering";

const INITIAL_REGION: Region = {
  latitude: 52.1,
  longitude: 19.4,
  latitudeDelta: 6,
  longitudeDelta: 6,
};

const STACK = { latitude: 52.2297, longitude: 21.0122 };

const STACK_REGION: Region = {
  ...STACK,
  latitudeDelta: 0.0008,
  longitudeDelta: 0.0008,
};

const CITIES = [
  { id: "poznan-1", latitude: 52.4064, longitude: 16.9252 },
  { id: "poznan-2", latitude: 52.41, longitude: 16.95 },
  { id: "poznan-3", latitude: 52.39, longitude: 16.9 },
  { id: "lodz-1", latitude: 51.7592, longitude: 19.456 },
  { id: "lodz-2", latitude: 51.77, longitude: 19.48 },
  { id: "krakow", latitude: 50.0647, longitude: 19.945 },
  { id: "gdansk", latitude: 54.352, longitude: 18.6466 },
];

const renderCustomCluster = ({ id, geometry, onPress, properties }: RenderClusterProps) => (
  <NativeMarker
    key={`custom-${id}`}
    coordinate={{ longitude: geometry.coordinates[0], latitude: geometry.coordinates[1] }}
    onPress={onPress}
  >
    <View style={styles.customCluster} accessible accessibilityLabel={`#${properties.point_count}`}>
      <Text style={styles.customClusterText}>{`#${properties.point_count}`}</Text>
    </View>
  </NativeMarker>
);

export default function App() {
  const mapRef = useRef<MapView>(null);
  const [clusteringEnabled, setClusteringEnabled] = useState(true);
  const [radius, setRadius] = useState(40);
  const [customCluster, setCustomCluster] = useState(false);
  const [markerCount, setMarkerCount] = useState(0);
  const [pressedCluster, setPressedCluster] = useState("none");

  const onClusterPress: ClusteredMapViewProps["onClusterPress"] = (cluster, markers) => {
    setPressedCluster(`${cluster.properties.point_count}/${markers.length}`);
  };

  const buttons = [
    { id: "go-stack", label: "Go to stack", onPress: () => mapRef.current?.animateToRegion(STACK_REGION, 500) },
    { id: "go-home", label: "Reset view", onPress: () => mapRef.current?.animateToRegion(INITIAL_REGION, 500) },
    {
      id: "toggle-clustering",
      label: `Clustering ${clusteringEnabled ? "on" : "off"}`,
      onPress: () => setClusteringEnabled((value) => !value),
    },
    {
      id: "toggle-radius",
      label: `Radius ${radius}`,
      onPress: () => setRadius((value) => (value === 40 ? 120 : 40)),
    },
    {
      id: "toggle-custom",
      label: `Custom ${customCluster ? "on" : "off"}`,
      onPress: () => setCustomCluster((value) => !value),
    },
  ];

  return (
    <View style={styles.screen}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        clusteringEnabled={clusteringEnabled}
        radius={radius}
        renderCluster={customCluster ? renderCustomCluster : undefined}
        onClusterPress={onClusterPress}
        onMarkersChange={(markers) => setMarkerCount(markers.length)}
        spiderLineColor="#1f6feb"
      >
        {CITIES.map((city) => (
          <NativeMarker key={city.id} coordinate={city} title={city.id} />
        ))}
        {[1, 2, 3, 4].map((n) => (
          <NativeMarker key={`stack-${n}`} coordinate={STACK} title={`stack-${n}`} pinColor="purple" />
        ))}
        <Marker
          coordinate={{ latitude: 50.0647, longitude: 20.45 }}
          cluster={false}
          title="solo"
          pinColor="green"
        />
      </MapView>

      <View style={styles.panel}>
        <Text testID="status" style={styles.status}>
          {`markers ${markerCount} | pressed ${pressedCluster}`}
        </Text>
        <View style={styles.buttons}>
          {buttons.map((button) => (
            <Pressable key={button.id} testID={button.id} onPress={button.onPress} style={styles.button}>
              <Text style={styles.buttonText}>{button.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  map: { flex: 1 },
  panel: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 32,
    backgroundColor: "#ffffff",
  },
  status: { fontSize: 14, marginBottom: 8, color: "#111111" },
  buttons: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#1f6feb",
  },
  buttonText: { color: "#ffffff", fontSize: 13 },
  customCluster: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#8250df",
  },
  customClusterText: { color: "#ffffff", fontWeight: "bold" },
});
