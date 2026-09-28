import React, {
  memo,
  useState,
  useEffect,
  useMemo,
  useRef,
  forwardRef,
} from "react";
import { Dimensions, LayoutAnimation, Platform } from "react-native";
import MapView, { Polyline } from "react-native-maps";
import SuperCluster from "supercluster";
import ClusterMarker from "./ClusteredMarker";
import {
  isMarker,
  markerToGeoJSONFeature,
  calculateBBox,
  returnMapZoom,
  generateSpiral,
} from "./helpers";

const emptyArray = [];
const noop = () => {};
const defaultEdgePadding = { top: 50, left: 50, right: 50, bottom: 50 };

const ClusteredMapView = forwardRef(
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
    const [markers, updateMarkers] = useState(emptyArray);
    const [spiderMarkers, updateSpiderMarker] = useState(emptyArray);
    const [otherChildren, updateChildren] = useState(emptyArray);
    const [superCluster, setSuperCluster] = useState(null);
    const [currentRegion, updateRegion] = useState(
      restProps.region || restProps.initialRegion
    );

    const [isSpiderfier, updateSpiderfier] = useState(false);
    const [clusterChildren, updateClusterChildren] = useState(null);
    const mapRef = useRef();

    const propsChildren = useMemo(
      () => React.Children.toArray(children),
      [children]
    );

    useEffect(() => {
      const rawData = [];
      const nextOtherChildren = [];

      if (!clusteringEnabled) {
        updateSpiderMarker(emptyArray);
        updateMarkers(emptyArray);
        updateChildren(propsChildren);
        setSuperCluster(null);
        return;
      }

      propsChildren.forEach((child, index) => {
        if (isMarker(child)) {
          rawData.push(markerToGeoJSONFeature(child, index));
        } else {
          nextOtherChildren.push(child);
        }
      });

      const nextSuperCluster = new SuperCluster({
        radius,
        maxZoom,
        minZoom,
        minPoints,
        extent,
        nodeSize,
      });

      nextSuperCluster.load(rawData);

      const bBox = calculateBBox(currentRegion);
      const zoom = returnMapZoom(currentRegion, bBox, minZoom);
      const nextMarkers = nextSuperCluster.getClusters(bBox, zoom);

      updateMarkers(nextMarkers);
      updateChildren(nextOtherChildren);
      setSuperCluster(nextSuperCluster);

      if (superClusterRef) superClusterRef.current = nextSuperCluster;
    }, [propsChildren, clusteringEnabled]);

    useEffect(() => {
      if (!spiralEnabled) return;

      if (isSpiderfier && markers.length > 0) {
        let allSpiderMarkers = [];
        let spiralChildren = [];
        markers.map((marker, i) => {
          if (marker.properties.cluster) {
            spiralChildren = superCluster.getLeaves(
              marker.properties.cluster_id,
              Infinity
            );
          }
          let positions = generateSpiral(marker, spiralChildren, markers, i);
          allSpiderMarkers.push(...positions);
        });

        updateSpiderMarker(allSpiderMarkers);
      } else {
        updateSpiderMarker(emptyArray);
      }
    }, [isSpiderfier, markers]);

    const handleRegionChangeComplete = (region, details) => {
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
        updateMarkers(nextMarkers);
        onMarkersChange(nextMarkers);
        onRegionChangeComplete?.(region, details, nextMarkers);
        updateRegion(region);
      } else {
        onRegionChangeComplete?.(region, details);
      }
    };

    const handleClusterPress = (cluster) => () => {
      const clusterLeaves = superCluster.getLeaves(cluster.id, Infinity);
      updateClusterChildren(clusterLeaves);

      if (preserveClusterPressBehavior) {
        onClusterPress(cluster, clusterLeaves);
        return;
      }

      const coordinates = clusterLeaves.map(({ geometry }) => ({
        latitude: geometry.coordinates[1],
        longitude: geometry.coordinates[0],
      }));

      mapRef.current.fitToCoordinates(coordinates, { edgePadding, duration: 750 });

      onClusterPress(cluster, clusterLeaves);
    };

    return (
      <MapView
        {...restProps}
        ref={(map) => {
          mapRef.current = map;
          if (ref) ref.current = map;
          mapRefProp?.(map);
        }}
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {markers.map((marker) =>
          marker.properties.point_count === 0 ? (
            propsChildren[marker.properties.index]
          ) : !isSpiderfier ? (
            renderCluster ? (
              renderCluster({
                onPress: handleClusterPress(marker),
                clusterColor,
                clusterTextColor,
                clusterFontFamily,
                ...marker,
              })
            ) : (
              <ClusterMarker
                key={`cluster-${marker.id}`}
                {...marker}
                onPress={handleClusterPress(marker)}
                clusterColor={
                  restProps.selectedClusterId === marker.id
                    ? restProps.selectedClusterColor
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
        {spiderMarkers.map((marker) => {
          return propsChildren[marker.index]
            ? React.cloneElement(propsChildren[marker.index], {
                coordinate: { ...marker },
              })
            : null;
        })}
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

export default memo(ClusteredMapView);
