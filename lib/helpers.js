import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

// Same math as @mapbox/geo-viewport viewport() with its defaults: 256px tiles, zoom 0 to 20.
const MAX_VIEWPORT_ZOOM = 20;
const WORLD_SIZE = 256 * Math.pow(2, MAX_VIEWPORT_ZOOM);

const toWorldPixel = ([lng, lat]) => {
  const sinLat = Math.min(Math.max(Math.sin((Math.PI / 180) * lat), -0.9999), 0.9999);
  const x = Math.round(WORLD_SIZE / 2 + lng * (WORLD_SIZE / 360));
  const y = Math.round(
    WORLD_SIZE / 2 -
      0.5 * Math.log((1 + sinLat) / (1 - sinLat)) * (WORLD_SIZE / (2 * Math.PI))
  );
  return [Math.min(x, WORLD_SIZE), Math.min(y, WORLD_SIZE)];
};

const viewportZoom = (bBox, [viewWidth, viewHeight]) => {
  const [westX, southY] = toWorldPixel([bBox[0], bBox[1]]);
  const [eastX, northY] = toWorldPixel([bBox[2], bBox[3]]);
  const zoom = Math.floor(
    Math.min(
      MAX_VIEWPORT_ZOOM - Math.log((eastX - westX) / viewWidth) / Math.log(2),
      MAX_VIEWPORT_ZOOM - Math.log((southY - northY) / viewHeight) / Math.log(2)
    )
  );
  return Math.max(0, Math.min(MAX_VIEWPORT_ZOOM, zoom));
};

export const isMarker = (child) =>
  child &&
  child.props &&
  child.props.coordinate &&
  child.props.cluster !== false;

export const calculateBBox = (region) => {
  let lngD;
  if (region.longitudeDelta < 0) lngD = region.longitudeDelta + 360;
  else lngD = region.longitudeDelta;

  return [
    region.longitude - lngD, // westLng - min lng
    region.latitude - region.latitudeDelta, // southLat - min lat
    region.longitude + lngD, // eastLng - max lng
    region.latitude + region.latitudeDelta, // northLat - max lat
  ];
};

export const returnMapZoom = (region, bBox, minZoom) =>
  region.longitudeDelta >= 40 ? minZoom : viewportZoom(bBox, [width, height]);

export const markerToGeoJSONFeature = (marker, index) => {
  return {
    type: "Feature",
    geometry: {
      coordinates: [
        marker.props.coordinate.longitude,
        marker.props.coordinate.latitude,
      ],
      type: "Point",
    },
    properties: {
      point_count: 0,
      index,
      ...removeChildrenFromProps(marker.props),
    },
  };
};

export const generateSpiral = (marker, clusterLeaves) => {
  const { properties, geometry } = marker;
  const [centerLongitude, centerLatitude] = geometry.coordinates;

  return clusterLeaves.slice(0, properties.point_count).map((leaf, i) => {
    const angle = 0.25 * (i * 0.5);
    return {
      index: leaf.properties.index,
      longitude: centerLongitude + 0.0002 * angle * Math.sin(angle),
      latitude: centerLatitude + 0.0002 * angle * Math.cos(angle),
      centerPoint: {
        latitude: centerLatitude,
        longitude: centerLongitude,
      },
    };
  });
};

export const returnMarkerStyle = (points) => {
  if (points >= 50) {
    return {
      width: 84,
      height: 84,
      size: 64,
      fontSize: 20,
    };
  }

  if (points >= 25) {
    return {
      width: 78,
      height: 78,
      size: 58,
      fontSize: 19,
    };
  }

  if (points >= 15) {
    return {
      width: 72,
      height: 72,
      size: 54,
      fontSize: 18,
    };
  }

  if (points >= 10) {
    return {
      width: 66,
      height: 66,
      size: 50,
      fontSize: 17,
    };
  }

  if (points >= 8) {
    return {
      width: 60,
      height: 60,
      size: 46,
      fontSize: 17,
    };
  }

  if (points >= 4) {
    return {
      width: 54,
      height: 54,
      size: 40,
      fontSize: 16,
    };
  }

  return {
    width: 48,
    height: 48,
    size: 36,
    fontSize: 15,
  };
};

const removeChildrenFromProps = (props) => {
  const newProps = {};
  Object.keys(props).forEach((key) => {
    if (key !== "children") {
      newProps[key] = props[key];
    }
  });
  return newProps;
};

export const getCenterOffsetForAnchor = (anchor, markerWidth, markerHeight) => ({
  x: markerWidth * 0.5 - markerWidth * anchor.x,
  y: markerHeight * 0.5 - markerHeight * anchor.y,
});
