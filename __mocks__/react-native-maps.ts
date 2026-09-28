import { createElement, useImperativeHandle, type Ref } from "react";

export const mapInstance = {
  fitToCoordinates: jest.fn(),
  animateToRegion: jest.fn(),
};

type MockMapViewProps = { ref?: Ref<typeof mapInstance> } & Record<string, unknown>;

const MapView = ({ ref, ...props }: MockMapViewProps) => {
  useImperativeHandle(ref, () => mapInstance);
  return createElement("MapView", props);
};

export const Marker = "Marker";
export const Polyline = "Polyline";

export default MapView;
