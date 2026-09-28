import { forwardRef } from "react";
import { Marker as NativeMarker, type MapMarker } from "react-native-maps";
import type { MarkerProps } from "./types";

const Marker = forwardRef<MapMarker, MarkerProps>(({ cluster: _cluster, ...props }, ref) => (
  <NativeMarker ref={ref} {...props} />
));

export default Marker;
