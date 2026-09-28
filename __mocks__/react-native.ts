export const View = "View";
export const Text = "Text";
export const TouchableOpacity = "TouchableOpacity";

export const StyleSheet = {
  create<T>(styles: T): T {
    return styles;
  },
};

export const Dimensions = { get: () => ({ width: 375, height: 812 }) };

export const LayoutAnimation = {
  Presets: { spring: { type: "spring" } },
  configureNext: jest.fn(),
};

export const Platform = { OS: "ios" };
