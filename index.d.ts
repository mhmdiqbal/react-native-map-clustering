declare module "@mhmdiqbal/react-native-map-clustering" {
  import * as React from "react";
  import { LayoutAnimationConfig } from "react-native";
  import Map, { Details, MapViewProps, Marker, Region } from "react-native-maps";

  export type Cluster = {};

  interface MapClusteringProps {
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
    edgePadding?: { top: number; left: number; right: number; bottom: number };
    clusterColor?: string;
    clusterTextColor?: string;
    clusterFontFamily?: string;
    selectedClusterId?: string;
    selectedClusterColor?: string;
    spiderLineColor?: string;
    superClusterRef?: React.MutableRefObject<any>;
    mapRef?: (ref: React.Ref<Map>) => void;
    onClusterPress?: (cluster: Marker, markers?: Marker[]) => void;
    onRegionChangeComplete?: (
      region: Region,
      details?: Details,
      markers?: Marker[]
    ) => void;
    onMarkersChange?: (markers?: Marker[]) => void;
    renderCluster?: (cluster: any) => React.ReactNode;
  }

  export default class MapView extends React.Component<
    Omit<MapViewProps, "onRegionChangeComplete"> & MapClusteringProps,
    any
  > {}
}
