import { useImperativeHandle } from "react";

export const mapInstance = {
  fitToCoordinates: jest.fn(),
  animateToRegion: jest.fn(),
};

const MapView = ({ ref, ...props }) => {
  useImperativeHandle(ref, () => mapInstance);
  return <MapView.Host {...props} />;
};
MapView.Host = "MapView";

export const Marker = "Marker";
export const Polyline = "Polyline";

export default MapView;
