import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { tokens } from "@/design/tokens";

type ConfirmModalProps = {
  confirmLabel: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  visible: boolean;
};

export function ConfirmModal({ confirmLabel, message, onCancel, onConfirm, title, visible }: ConfirmModalProps) {
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={onCancel} style={[styles.button, styles.secondary]}>
              <Text style={styles.secondaryText}>Weiterspielen</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onConfirm} style={[styles.button, styles.primary]}>
              <Text style={styles.primaryText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: tokens.space.lg,
    backgroundColor: "rgba(23, 19, 13, 0.48)"
  },
  card: {
    gap: tokens.space.md,
    padding: tokens.space.lg,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.surface.raised
  },
  title: {
    color: tokens.color.ink,
    fontSize: tokens.type.h2,
    ...tokens.typography.display,
  },
  message: {
    color: tokens.color.muted,
    ...tokens.typography.uiBody,
  },
  actions: {
    flexDirection: "row",
    gap: tokens.space.sm,
    marginTop: tokens.space.sm
  },
  button: {
    flex: 1,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.md
  },
  secondary: {
    borderWidth: 1,
    borderColor: tokens.color.line,
    backgroundColor: "white"
  },
  primary: {
    backgroundColor: tokens.color.primary
  },
  secondaryText: {
    color: tokens.color.ink,
    fontFamily: tokens.font.ui.semibold,
  },
  primaryText: {
    color: "white",
    fontFamily: tokens.font.ui.bold,
  }
});
