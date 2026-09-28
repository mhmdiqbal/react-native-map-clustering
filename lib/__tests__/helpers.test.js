import {
  isMarker,
  calculateBBox,
  returnMapZoom,
  markerToGeoJSONFeature,
  generateSpiral,
  returnMarkerStyle,
  getCenterOffsetForAnchor,
} from "../helpers";

jest.mock(
  "react-native",
  () => ({
    Dimensions: { get: () => ({ width: 375, height: 812 }) },
  }),
  { virtual: true },
);

const coordinate = { latitude: 37.75, longitude: -122.4 };

describe("isMarker", () => {
  it("returns true for a child with a coordinate", () => {
    expect(isMarker({ props: { coordinate } })).toBe(true);
  });

  it("returns true when cluster is true", () => {
    expect(isMarker({ props: { coordinate, cluster: true } })).toBe(true);
  });

  it("returns false when cluster is false", () => {
    expect(isMarker({ props: { coordinate, cluster: false } })).toBe(false);
  });

  it("returns a falsy value for a child without a coordinate", () => {
    expect(isMarker({ props: {} })).toBeFalsy();
  });

  it("returns a falsy value for a child without props", () => {
    expect(isMarker({})).toBeFalsy();
  });

  it("returns a falsy value for an empty child", () => {
    expect(isMarker(null)).toBeFalsy();
    expect(isMarker(undefined)).toBeFalsy();
  });
});

describe("calculateBBox", () => {
  it("returns [west, south, east, north] using the full deltas", () => {
    const region = {
      latitude: 10,
      longitude: 20,
      latitudeDelta: 2,
      longitudeDelta: 4,
    };

    expect(calculateBBox(region)).toEqual([16, 8, 24, 12]);
  });

  it("adds 360 to a negative longitudeDelta", () => {
    const region = {
      latitude: 10,
      longitude: 20,
      latitudeDelta: 2,
      longitudeDelta: -350,
    };

    expect(calculateBBox(region)).toEqual([10, 8, 30, 12]);
  });
});

describe("returnMapZoom", () => {
  const bBox = [-122.5, 37.7, -122.3, 37.8];

  it("returns minZoom when longitudeDelta is 40 or more", () => {
    expect(returnMapZoom({ longitudeDelta: 40 }, bBox, 3)).toBe(3);
    expect(returnMapZoom({ longitudeDelta: 120 }, bBox, 1)).toBe(1);
  });

  it("returns the geo-viewport zoom for the window size", () => {
    expect(returnMapZoom({ longitudeDelta: 0.1 }, bBox, 1)).toBe(11);
  });

  it("returns a lower zoom for a larger bBox", () => {
    expect(returnMapZoom({ longitudeDelta: 4 }, [16, 8, 24, 12], 1)).toBe(6);
  });
});

describe("markerToGeoJSONFeature", () => {
  const marker = {
    props: { coordinate, title: "Home", children: "child node" },
  };

  it("returns a GeoJSON point with [longitude, latitude]", () => {
    const feature = markerToGeoJSONFeature(marker, 2);

    expect(feature.type).toBe("Feature");
    expect(feature.geometry).toEqual({
      type: "Point",
      coordinates: [-122.4, 37.75],
    });
  });

  it("copies the props without children into properties", () => {
    expect(markerToGeoJSONFeature(marker, 2).properties).toEqual({
      point_count: 0,
      index: 2,
      coordinate,
      title: "Home",
    });
  });

  it("does not change the marker props", () => {
    markerToGeoJSONFeature(marker, 2);

    expect(marker.props.children).toBe("child node");
  });
});

describe("generateSpiral", () => {
  const center = [-122.4, 37.75];
  const cluster = (pointCount) => ({
    properties: { point_count: pointCount },
    geometry: { coordinates: center },
  });
  const leaf = (index) => ({ properties: { index } });

  it("returns one point per cluster child", () => {
    const spiral = generateSpiral(
      cluster(3),
      [leaf(7), leaf(8), leaf(9)],
      [],
      0,
    );

    expect(spiral.map((point) => point.index)).toEqual([7, 8, 9]);
  });

  it("puts the first point on the cluster center", () => {
    const [first] = generateSpiral(cluster(2), [leaf(0), leaf(1)], [], 0);

    expect(first).toEqual({
      index: 0,
      latitude: 37.75,
      longitude: -122.4,
      centerPoint: { latitude: 37.75, longitude: -122.4 },
    });
  });

  it("moves the next points out along the spiral", () => {
    const [, second] = generateSpiral(cluster(2), [leaf(0), leaf(1)], [], 0);
    const angle = 0.125;

    expect(second.latitude).toBeCloseTo(
      37.75 + 0.0002 * angle * Math.cos(angle),
      12,
    );
    expect(second.longitude).toBeCloseTo(
      -122.4 + 0.0002 * angle * Math.sin(angle),
      12,
    );
  });

  it("skips children of the markers before index", () => {
    const markers = [cluster(2), { properties: {} }, cluster(2)];
    const children = [leaf(0), leaf(1), leaf(2), leaf(3)];

    const spiral = generateSpiral(cluster(2), children, markers, 2);

    expect(spiral.map((point) => point.index)).toEqual([2, 3]);
  });

  it("leaves out points that have no cluster child", () => {
    expect(generateSpiral(cluster(3), [leaf(0)], [], 0)).toHaveLength(1);
  });
});

describe("returnMarkerStyle", () => {
  it("returns the smallest style below 4 points", () => {
    const style = { width: 48, height: 48, size: 36, fontSize: 15 };

    expect(returnMarkerStyle(0)).toEqual(style);
    expect(returnMarkerStyle(3)).toEqual(style);
  });

  it("returns the 4 to 7 points style", () => {
    const style = { width: 54, height: 54, size: 40, fontSize: 16 };

    expect(returnMarkerStyle(4)).toEqual(style);
    expect(returnMarkerStyle(7)).toEqual(style);
  });

  it("returns the 8 to 9 points style", () => {
    const style = { width: 60, height: 60, size: 46, fontSize: 17 };

    expect(returnMarkerStyle(8)).toEqual(style);
    expect(returnMarkerStyle(9)).toEqual(style);
  });

  it("returns the 10 to 14 points style", () => {
    const style = { width: 66, height: 66, size: 50, fontSize: 17 };

    expect(returnMarkerStyle(10)).toEqual(style);
    expect(returnMarkerStyle(14)).toEqual(style);
  });

  it("returns the 15 to 24 points style", () => {
    const style = { width: 72, height: 72, size: 54, fontSize: 18 };

    expect(returnMarkerStyle(15)).toEqual(style);
    expect(returnMarkerStyle(24)).toEqual(style);
  });

  it("returns the 25 to 49 points style", () => {
    const style = { width: 78, height: 78, size: 58, fontSize: 19 };

    expect(returnMarkerStyle(25)).toEqual(style);
    expect(returnMarkerStyle(49)).toEqual(style);
  });

  it("returns the largest style from 50 points", () => {
    const style = { width: 84, height: 84, size: 64, fontSize: 20 };

    expect(returnMarkerStyle(50)).toEqual(style);
    expect(returnMarkerStyle(1000)).toEqual(style);
  });
});

describe("getCenterOffsetForAnchor", () => {
  it("returns no offset for a centered anchor", () => {
    expect(getCenterOffsetForAnchor({ x: 0.5, y: 0.5 }, 48, 48)).toEqual({ x: 0, y: 0 });
  });

  it("returns half the size for a top left anchor", () => {
    expect(getCenterOffsetForAnchor({ x: 0, y: 0 }, 60, 40)).toEqual({ x: 30, y: 20 });
  });

  it("returns minus half the size for a bottom right anchor", () => {
    expect(getCenterOffsetForAnchor({ x: 1, y: 1 }, 60, 40)).toEqual({ x: -30, y: -20 });
  });
});
