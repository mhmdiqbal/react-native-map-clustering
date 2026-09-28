import { Dimensions } from "react-native";
import type { Region } from "react-native-maps";
import type {
  BBox,
  MapFeature,
  MarkerLike,
  MarkerProps,
  PointFeature,
  SpiderMarker,
} from "./types";

const { width, height } = Dimensions.get("window");

// Same math as @mapbox/geo-viewport viewport() with its defaults: 256px tiles, zoom 0 to 20.
const MAX_VIEWPORT_ZOOM = 20;
const WORLD_SIZE = 256 * Math.pow(2, MAX_VIEWPORT_ZOOM);

const toWorldPixel = ([lng, lat]: [number, number]): [number, number] => {
  const sinLat = Math.min(Math.max(Math.sin((Math.PI / 180) * lat), -0.9999), 0.9999);
  const x = Math.round(WORLD_SIZE / 2 + lng * (WORLD_SIZE / 360));
  const y = Math.round(
    WORLD_SIZE / 2 -
      0.5 * Math.log((1 + sinLat) / (1 - sinLat)) * (WORLD_SIZE / (2 * Math.PI))
  );
  return [Math.min(x, WORLD_SIZE), Math.min(y, WORLD_SIZE)];
};

const viewportZoom = (bBox: BBox, [viewWidth, viewHeight]: [number, number]) => {
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

const hasProps = (child: unknown): child is { props: Record<string, unknown> } =>
  typeof child === "object" &&
  child !== null &&
  "props" in child &&
  typeof child.props === "object" &&
  child.props !== null;

export const isMarker = (child: unknown): child is MarkerLike =>
  hasProps(child) && Boolean(child.props.coordinate) && child.props.cluster !== false;

export const isPointFeature = (feature: MapFeature): feature is PointFeature =>
  feature.properties.point_count === 0;

export const calculateBBox = (region: Region): BBox => {
  let lngD: number;
  if (region.longitudeDelta < 0) lngD = region.longitudeDelta + 360;
  else lngD = region.longitudeDelta;

  return [
    region.longitude - lngD, // westLng - min lng
    region.latitude - region.latitudeDelta, // southLat - min lat
    region.longitude + lngD, // eastLng - max lng
    region.latitude + region.latitudeDelta, // northLat - max lat
  ];
};

export const returnMapZoom = (
  region: Pick<Region, "longitudeDelta">,
  bBox: BBox,
  minZoom: number
): number =>
  region.longitudeDelta >= 40 ? minZoom : viewportZoom(bBox, [width, height]);

export const markerToGeoJSONFeature = (marker: MarkerLike, index: number): PointFeature => {
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

type SpiralCenter = {
  properties: { point_count: number };
  geometry: { coordinates: number[] };
};
type SpiralLeaf = { properties: { index: number } };

export const generateSpiral = (
  marker: SpiralCenter,
  clusterLeaves: SpiralLeaf[]
): SpiderMarker[] => {
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

type MarkerStyle = { width: number; height: number; size: number; fontSize: number };

export const returnMarkerStyle = (points: number): MarkerStyle => {
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

const removeChildrenFromProps = ({ children: _children, ...props }: MarkerProps): Omit<MarkerProps, "children"> =>
  props;

type Point = { x: number; y: number };

export const getCenterOffsetForAnchor = (
  anchor: Point,
  markerWidth: number,
  markerHeight: number
): Point => ({
  x: markerWidth * 0.5 - markerWidth * anchor.x,
  y: markerHeight * 0.5 - markerHeight * anchor.y,
});
