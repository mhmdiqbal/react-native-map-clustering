import {
  Children,
  cloneElement,
  forwardRef,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { Dimensions, LayoutAnimation, Platform } from "react-native";
import MapView, { Polyline, type Details, type Region } from "react-native-maps";
import SuperCluster from "supercluster";
import ClusterMarker from "./ClusteredMarker";
import {
  isMarker,
  isPointFeature,
  markerToGeoJSONFeature,
  calculateBBox,
  returnMapZoom,
  generateSpiral,
} from "./helpers";
import type {
  Cluster,
  ClusteredMapViewProps,
  MapFeature,
  MarkerProps,
  PointFeature,
  PointProperties,
  RenderClusterProps,
} from "./types";

const emptyArray: never[] = [];
const noop = () => {};
const defaultEdgePadding = { top: 50, left: 50, right: 50, bottom: 50 };

type CustomClusterProps = RenderClusterProps & {
  renderCluster: (cluster: RenderClusterProps) => ReactNode;
};

const CustomCluster = ({ renderCluster, ...cluster }: CustomClusterProps) =>
  renderCluster(cluster);

const ClusteredMapViewBase = forwardRef<MapView, ClusteredMapViewProps>(
  (
    {
      radius = Dimensions.get("window").width * 0.06,
      maxZoom = 20,
      minZoom = 1,
      minPoints = 2,
      extent = 512,
      nodeSize = 64,
      edgePadding = defaultEdgePadding,
      children,
      onClusterPress = noop,
      onRegionChangeComplete = noop,
      onMarkersChange = noop,
      preserveClusterPressBehavior = false,
      clusteringEnabled = true,
      clusterColor = "#00B386",
      clusterTextColor = "#FFFFFF",
      clusterFontFamily,
      selectedClusterId,
      selectedClusterColor,
      spiderLineColor = "#FF0000",
      layoutAnimationConf = LayoutAnimation.Presets.spring,
      animationEnabled = true,
      renderCluster,
      tracksViewChanges = false,
      spiralEnabled = true,
      superClusterRef,
      mapRef: mapRefProp,
      ...restProps
    },
    ref
  ) => {
    const [currentRegion, updateRegion] = useState<Region | undefined>(
      restProps.region || restProps.initialRegion
    );

    const [isSpiderfier, updateSpiderfier] = useState(false);
    const [clusterChildren, updateClusterChildren] = useState<PointFeature[] | null>(null);
    const mapRef = useRef<MapView | null>(null);

    const propsChildren = useMemo(() => Children.toArray(children), [children]);

    const { superCluster, otherChildren } = useMemo(() => {
      if (!clusteringEnabled) {
        return { superCluster: null, otherChildren: propsChildren };
      }

      const rawData: PointFeature[] = [];
      const nextOtherChildren: ReactNode[] = [];

      propsChildren.forEach((child, index) => {
        if (isMarker(child)) {
          rawData.push(markerToGeoJSONFeature(child, index));
        } else {
          nextOtherChildren.push(child);
        }
      });

      const nextSuperCluster = new SuperCluster<PointProperties>({
        radius,
        maxZoom,
        minZoom,
        minPoints,
        extent,
        nodeSize,
      });
      nextSuperCluster.load(rawData);

      return { superCluster: nextSuperCluster, otherChildren: nextOtherChildren };
    }, [
      propsChildren,
      clusteringEnabled,
      radius,
      maxZoom,
      minZoom,
      minPoints,
      extent,
      nodeSize,
    ]);

    const markers = useMemo((): MapFeature[] => {
      if (!superCluster || !currentRegion) return emptyArray;

      const bBox = calculateBBox(currentRegion);
      const zoom = returnMapZoom(currentRegion, bBox, minZoom);
      return superCluster.getClusters(bBox, zoom);
    }, [superCluster, currentRegion, minZoom]);

    const spiderMarkers = useMemo(() => {
      if (!superCluster || !spiralEnabled || !isSpiderfier || markers.length === 0) {
        return emptyArray;
      }

      return markers.flatMap((marker) =>
        isPointFeature(marker)
          ? []
          : generateSpiral(
              marker,
              superCluster.getLeaves(marker.properties.cluster_id, Infinity)
            )
      );
    }, [spiralEnabled, isSpiderfier, markers, superCluster]);

    useEffect(() => {
      if (superClusterRef) superClusterRef.current = superCluster;
    }, [superClusterRef, superCluster]);

    const handleRegionChangeComplete = (region: Region, details: Details) => {
      if (superCluster && region) {
        const bBox = calculateBBox(region);
        const zoom = returnMapZoom(region, bBox, minZoom);
        const nextMarkers = superCluster.getClusters(bBox, zoom);
        if (animationEnabled && Platform.OS === "ios") {
          LayoutAnimation.configureNext(layoutAnimationConf);
        }
        if (zoom >= 18 && nextMarkers.length > 0 && clusterChildren) {
          if (spiralEnabled) updateSpiderfier(true);
        } else {
          if (spiralEnabled) updateSpiderfier(false);
        }
        onMarkersChange(nextMarkers);
        onRegionChangeComplete?.(region, details, nextMarkers);
        updateRegion(region);
      } else {
        onRegionChangeComplete?.(region, details);
      }
    };

    const handleClusterPress = (cluster: Cluster) => () => {
      if (!superCluster) return;
      const clusterLeaves = superCluster.getLeaves(cluster.properties.cluster_id, Infinity);
      updateClusterChildren(clusterLeaves);

      if (preserveClusterPressBehavior) {
        onClusterPress(cluster, clusterLeaves);
        return;
      }

      const coordinates = clusterLeaves.map(({ geometry }) => ({
        latitude: geometry.coordinates[1],
        longitude: geometry.coordinates[0],
      }));

      mapRef.current?.fitToCoordinates(coordinates, { edgePadding });

      onClusterPress(cluster, clusterLeaves);
    };

    return (
      <MapView
        {...restProps}
        ref={(map) => {
          mapRef.current = map;
          if (typeof ref === "function") ref(map);
          else if (ref) ref.current = map;
          mapRefProp?.(map);
        }}
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {markers.map((marker) =>
          isPointFeature(marker) ? (
            propsChildren[marker.properties.index]
          ) : !isSpiderfier ? (
            renderCluster ? (
              <CustomCluster
                key={`cluster-${marker.id}`}
                renderCluster={renderCluster}
                onPress={handleClusterPress(marker)}
                clusterColor={clusterColor}
                clusterTextColor={clusterTextColor}
                clusterFontFamily={clusterFontFamily}
                {...marker}
              />
            ) : (
              <ClusterMarker
                key={`cluster-${marker.id}`}
                {...marker}
                onPress={handleClusterPress(marker)}
                clusterColor={
                  selectedClusterId === marker.id && selectedClusterColor
                    ? selectedClusterColor
                    : clusterColor
                }
                clusterTextColor={clusterTextColor}
                clusterFontFamily={clusterFontFamily}
                tracksViewChanges={tracksViewChanges}
              />
            )
          ) : null
        )}
        {otherChildren}
        {spiderMarkers.map((marker) =>
          cloneElement(propsChildren[marker.index] as ReactElement<MarkerProps>, {
            coordinate: { ...marker },
          })
        )}
        {spiderMarkers.map((marker) => (
          <Polyline
            key={`spider-line-${marker.index}`}
            coordinates={[marker.centerPoint, marker, marker.centerPoint]}
            strokeColor={spiderLineColor}
            strokeWidth={1}
          />
        ))}
      </MapView>
    );
  }
);

const ClusteredMapView = memo(ClusteredMapViewBase);
type ClusteredMapView = MapView;

export default ClusteredMapView;
