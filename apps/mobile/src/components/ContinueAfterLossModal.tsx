import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { tokens } from "@/design/tokens";

type ContinueAfterLossModalProps = {
  onContinue: () => void;
  onGiveUp: () => void;
  visible: boolean;
};

export function ContinueAfterLossModal({ onContinue, onGiveUp, visible }: ContinueAfterLossModalProps) {
  const progress = useSharedValue(visible ? 1 : 0);
  progress.value = withSpring(visible ? 1 : 0, { damping: 18, stiffness: 220 });
  const style = useAnimatedStyle(() => ({ opacity: progress.value, transform: [{ scale: 0.94 + progress.value * 0.06 }] }));
  return (
    <Modal animationType="none" transparent visible={visible}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, style]}>
          <Text style={styles.title}>Noch nicht geknackt!</Text>
          <Text style={styles.message}>Die Runde zählt bereits als verloren. Du kannst trotzdem ohne Versuchslimit weiterknobeln.</Text>
          <Pressable accessibilityRole="button" onPress={onContinue} style={[styles.button, styles.primary]}>
            <Text style={styles.primaryText}>Weiterknobeln</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onGiveUp} style={[styles.button, styles.secondary]}>
            <Text style={styles.secondaryText}>Aufgeben & Lösung ansehen</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "center", padding: tokens.space.lg, backgroundColor: "rgba(23, 19, 13, 0.48)" },
  card: { gap: tokens.space.md, padding: tokens.space.lg, borderRadius: tokens.radius.surface, backgroundColor: tokens.surface.raised },
  title: { color: tokens.color.ink, fontSize: tokens.type.h2, fontFamily: tokens.font.ui.semibold },
  message: { color: tokens.color.muted, ...tokens.typography.uiBody },
  button: { minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: tokens.radius.control },
  primary: { backgroundColor: tokens.color.primary },
  secondary: { borderWidth: 1, borderColor: "rgba(199, 62, 58, 0.28)" },
  primaryText: { color: "white", fontFamily: tokens.font.ui.semibold },
  secondaryText: { color: tokens.color.danger, fontFamily: tokens.font.ui.semibold },
});
