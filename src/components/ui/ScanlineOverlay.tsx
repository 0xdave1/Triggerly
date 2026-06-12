import { StyleSheet, View } from "react-native";

export function ScanlineOverlay() {
  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]}>
      {dots.map((dot, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              left: `${dot.x}%`,
              top: `${dot.y}%`,
              opacity: dot.opacity
            }
          ]}
        />
      ))}
    </View>
  );
}

const dots = Array.from({ length: 48 }, (_, index) => ({
  x: (index * 37 + 9) % 100,
  y: (index * 61 + 7) % 100,
  opacity: 0.05 + (index % 4) * 0.025
}));

const styles = StyleSheet.create({
  overlay: {
    overflow: "hidden",
    pointerEvents: "none"
  },
  dot: {
    backgroundColor: "#C1E7D6",
    height: 2,
    position: "absolute",
    width: 2
  }
});
