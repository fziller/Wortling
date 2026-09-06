import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";

import { tokens } from "@/design/tokens";

type OnboardingModalProps = {
  onClose: () => void;
  onStart: () => void;
  visible: boolean;
};

export function OnboardingModal({ onClose, onStart, visible }: OnboardingModalProps) {
  return (
    <Modal animationType="none" transparent visible={visible}>
      <Animated.View entering={FadeIn.duration(tokens.motion.quick)} exiting={FadeOut.duration(tokens.motion.quick)} style={styles.backdrop}>
        <Animated.View entering={ZoomIn.springify().damping(18).stiffness(220)} style={styles.card}>
          <Text style={styles.kicker}>Tageskniffe</Text>
          <Text style={styles.title}>Jeden Tag 3 kurze Worträtsel.</Text>
          <Text style={styles.body}>Spiel eins an, löse alle drei und halte deine Serie am Leben. Kein Account, kein Stress.</Text>
          <View style={styles.steps}>
            <Text style={styles.step}>1 · Tageskniff auswählen</Text>
            <Text style={styles.step}>2 · Rätsel lösen</Text>
            <Text style={styles.step}>3 · Nächsten offenen Kniff spielen</Text>
          </View>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.secondary}>
              <Text style={styles.secondaryText}>Später</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onStart} style={styles.primary}>
              <Text style={styles.primaryText}>Loslegen</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: tokens.space.lg,
    backgroundColor: "rgba(23, 19, 13, 0.56)",
  },
  card: {
    gap: tokens.space.md,
    padding: tokens.space.lg,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.62)",
    backgroundColor: tokens.color.card,
  },
  kicker: {
    alignSelf: "flex-start",
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 5,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.primaryLight,
    color: tokens.color.primaryDark,
    fontSize: tokens.type.small,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: tokens.color.ink,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1.4,
    lineHeight: 38,
  },
  body: {
    color: tokens.color.muted,
    fontSize: tokens.type.body,
    fontWeight: "700",
    lineHeight: 24,
  },
  steps: {
    gap: tokens.space.xs,
    padding: tokens.space.md,
    borderRadius: tokens.radius.md,
    backgroundColor: "rgba(255, 255, 255, 0.62)",
  },
  step: {
    color: tokens.color.ink,
    fontSize: tokens.type.body,
    fontWeight: "900",
  },
  actions: {
    flexDirection: "row",
    gap: tokens.space.sm,
  },
  primary: {
    flex: 1,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.primary,
  },
  secondary: {
    flex: 1,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.color.line,
    backgroundColor: "white",
  },
  primaryText: {
    color: "white",
    fontSize: tokens.type.body,
    fontWeight: "900",
  },
  secondaryText: {
    color: tokens.color.ink,
    fontSize: tokens.type.body,
    fontWeight: "900",
  },
});
