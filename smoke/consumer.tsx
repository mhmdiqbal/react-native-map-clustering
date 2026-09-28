import { useRef } from "react";
import MapView, {
  Marker,
  type Cluster,
  type ClusteredMapViewProps,
} from "@mhmdiqbal/react-native-map-clustering";

const onClusterPress: ClusteredMapViewProps["onClusterPress"] = (cluster: Cluster, markers) => {
  console.log(cluster.properties.point_count, markers.length);
};

export const App = () => {
  const mapRef = useRef<MapView>(null);

  return (
    <MapView
      ref={mapRef}
      initialRegion={{ latitude: 52.5, longitude: 19.2, latitudeDelta: 8.5, longitudeDelta: 8.5 }}
      onClusterPress={onClusterPress}
      onRegionChangeComplete={(region, details, markers) =>
        console.log(region.latitude, details?.isGesture, markers?.length)
      }
    >
      <Marker coordinate={{ latitude: 52.4, longitude: 18.7 }} cluster={false} />
    </MapView>
  );
};

export const animate = (map: MapView) => map.animateToRegion({ latitude: 1, longitude: 2, latitudeDelta: 3, longitudeDelta: 4 });
