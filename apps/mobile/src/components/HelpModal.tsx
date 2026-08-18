import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { tokens } from "@/design/tokens";

type HelpModalProps = {
  title: string;
  paragraphs: readonly string[];
  visible: boolean;
  onClose: () => void;
};

export function HelpButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityLabel="Hilfe öffnen" accessibilityRole="button" onPress={onPress} style={styles.helpButton}>
      <Text style={styles.helpButtonText}>?</Text>
    </Pressable>
  );
}

export function HelpModal({ title, paragraphs, visible, onClose }: HelpModalProps) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {paragraphs.map((paragraph) => (
            <Text key={paragraph} style={styles.body}>{paragraph}</Text>
          ))}
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Alles klar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  helpButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.card,
    borderWidth: 1,
    borderColor: tokens.color.line
  },
  helpButtonText: {
    color: tokens.color.primaryDark,
    fontSize: 22,
    fontWeight: "900"
  },
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: tokens.space.lg,
    backgroundColor: "rgba(23, 19, 13, 0.42)"
  },
  card: {
    gap: tokens.space.md,
    padding: tokens.space.lg,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.color.card,
    borderWidth: 1,
    borderColor: tokens.color.line
  },
  title: {
    color: tokens.color.ink,
    fontSize: tokens.type.h1,
    fontWeight: "900"
  },
  body: {
    color: tokens.color.muted,
    fontSize: tokens.type.body,
    lineHeight: 24
  },
  closeButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: tokens.space.sm,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.primary
  },
  closeText: {
    color: "white",
    fontSize: 17,
    fontWeight: "900"
  }
});
