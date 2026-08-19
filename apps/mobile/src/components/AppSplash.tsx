import { LinearGradient } from "expo-linear-gradient";
import { Image, StyleSheet, Text, View } from "react-native";
import Animated, { FadeOut } from "react-native-reanimated";

import { tokens } from "@/design/tokens";

const mascot = require("../../assets/adaptive-icon.png");
const glow = require("../../assets/splash-glow.png");

export function AppSplash() {
  return (
    <Animated.View exiting={FadeOut.duration(tokens.motion.normal)} style={styles.wrap}>
      <Image source={glow} style={styles.glow} />
      <LinearGradient colors={["#FFFDF8", "#FFF1DF"]} style={styles.circle}>
        <Image source={mascot} style={styles.mascot} />
      </LinearGradient>
      <View style={styles.copy}>
        <Text style={styles.title}>Wortling</Text>
        <Text style={styles.subtitle}>Kurz. Clever. Deutsch.</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF6B2C",
  },
  glow: {
    position: "absolute",
    width: 390,
    height: 390,
    resizeMode: "contain",
  },
  circle: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 110,
    shadowColor: tokens.color.shadow,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 12,
  },
  mascot: {
    width: 168,
    height: 168,
    resizeMode: "contain",
  },
  copy: {
    position: "absolute",
    bottom: 82,
    alignItems: "center",
    gap: tokens.space.xs,
  },
  title: {
    color: "white",
    fontSize: 46,
    fontWeight: "900",
    letterSpacing: -1.4,
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: tokens.type.body,
    fontWeight: "800",
  },
});
