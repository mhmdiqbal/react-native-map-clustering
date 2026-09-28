import type { ReactNode, RefObject } from "react";
import type { LayoutAnimationConfig } from "react-native";
import type NativeMapView from "react-native-maps";
import type {
  Details,
  EdgePadding,
  LatLng,
  MapMarkerProps,
  MapViewProps,
  Region,
} from "react-native-maps";
import type Supercluster from "supercluster";

export type MarkerProps = MapMarkerProps & { cluster?: boolean };

export type MarkerLike = { props: MarkerProps };

export type PointProperties = Omit<MarkerProps, "children"> & {
  point_count: 0;
  index: number;
};

export type PointFeature = Supercluster.PointFeature<PointProperties>;

export type Cluster = Supercluster.ClusterFeature<Supercluster.AnyProps>;

export type MapFeature = Cluster | PointFeature;

export type BBox = [number, number, number, number];

export type SpiderMarker = LatLng & { index: number; centerPoint: LatLng };

export type RenderClusterProps = Cluster & {
  onPress: () => void;
  clusterColor: string;
  clusterTextColor: string;
  clusterFontFamily?: string;
};

export type ClusteredMapViewProps = Omit<
  MapViewProps,
  "onRegionChangeComplete" | "region"
> & {
  children?: ReactNode;
  region?: Region;
  clusteringEnabled?: boolean;
  spiralEnabled?: boolean;
  animationEnabled?: boolean;
  preserveClusterPressBehavior?: boolean;
  tracksViewChanges?: boolean;
  layoutAnimationConf?: LayoutAnimationConfig;
  radius?: number;
  maxZoom?: number;
  minZoom?: number;
  extent?: number;
  nodeSize?: number;
  minPoints?: number;
  edgePadding?: EdgePadding;
  clusterColor?: string;
  clusterTextColor?: string;
  clusterFontFamily?: string;
  selectedClusterId?: number;
  selectedClusterColor?: string;
  spiderLineColor?: string;
  superClusterRef?: RefObject<Supercluster<PointProperties> | null> | null;
  mapRef?: ((map: NativeMapView | null) => void) | null;
  onClusterPress?: (cluster: Cluster, markers: PointFeature[]) => void;
  onRegionChangeComplete?:
    | ((region: Region, details?: Details, markers?: MapFeature[]) => void)
    | null;
  onMarkersChange?: (markers: MapFeature[]) => void;
  renderCluster?: (cluster: RenderClusterProps) => ReactNode;
};
