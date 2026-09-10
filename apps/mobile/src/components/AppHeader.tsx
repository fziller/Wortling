import { Feather } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { tokens } from "@/design/tokens";

export const APP_HEADER_BACKGROUND = "#FDFBF7";
export const GAME_HEADER_BACKGROUND = "rgba(253, 251, 247, 0.72)";

const HEADER_MIN_HEIGHT = 64;
const HEADER_PADDING_HORIZONTAL = tokens.space.md;
const HEADER_PADDING_VERTICAL = tokens.space.sm;

type HeaderActionButtonProps = {
  accessibilityLabel: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
};

export function HeaderActionButton({ accessibilityLabel, icon, onPress }: HeaderActionButtonProps) {
  return (
    <Pressable accessibilityLabel={accessibilityLabel} accessibilityRole="button" onPress={onPress} style={styles.actionButton}>
      <Feather color={tokens.color.ink} name={icon} size={22} />
    </Pressable>
  );
}

type PageHeaderProps = {
  leftAction?: ReactNode;
  onBack?: () => void;
  onTitlePress?: () => void;
  rightAction?: ReactNode;
  title: string;
  titleAccessibilityLabel?: string;
  titleVariant?: "brand" | "page";
};

export function PageHeader({ leftAction, onBack, onTitlePress, rightAction, title, titleAccessibilityLabel, titleVariant = "page" }: PageHeaderProps) {
  const titleContent = (
    <Text adjustsFontSizeToFit minimumFontScale={0.82} numberOfLines={1} style={titleVariant === "brand" ? styles.brandTitle : styles.pageTitle}>
      {title}
    </Text>
  );

  return (
    <View style={styles.pageHeader}>
      <View style={styles.sideSlot}>{leftAction ?? (onBack ? <HeaderActionButton accessibilityLabel="Zurück" icon="arrow-left" onPress={onBack} /> : null)}</View>
      {onTitlePress ? (
        <Pressable accessibilityLabel={titleAccessibilityLabel ?? title} accessibilityRole="button" onPress={onTitlePress} style={styles.titleButton}>
          {titleContent}
        </Pressable>
      ) : (
        <View style={styles.titleButton}>{titleContent}</View>
      )}
      <View style={styles.sideSlot}>{rightAction}</View>
    </View>
  );
}

type GameHeaderProps = {
  onBack: () => void;
  onHelp: () => void;
  progressLabel?: string;
  subtitle?: string;
  title: string;
};

export function GameHeader({ onBack, onHelp, progressLabel, subtitle, title }: GameHeaderProps) {
  return (
    <View style={styles.gameHeader}>
      <HeaderActionButton accessibilityLabel="Zurück" icon="arrow-left" onPress={onBack} />
      <View style={styles.gameTitleBlock}>
        {subtitle ? <Text numberOfLines={1} style={styles.metaLabel}>{subtitle}</Text> : null}
        <Text adjustsFontSizeToFit numberOfLines={1} style={styles.gameTitle}>{title}</Text>
        {progressLabel ? <Text numberOfLines={1} style={styles.metaLabel}>{progressLabel}</Text> : null}
      </View>
      <HeaderActionButton accessibilityLabel="Hilfe öffnen" icon="help-circle" onPress={onHelp} />
    </View>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: "center",
    backgroundColor: tokens.surface.control,
    borderColor: tokens.border.hairline,
    borderRadius: tokens.radius.icon,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  brandTitle: {
    color: tokens.color.primaryDark,
    fontFamily: tokens.font.brand,
    fontSize: 27,
    letterSpacing: -0.8,
    lineHeight: 34,
    paddingTop: 2,
  },
  gameHeader: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderBottomColor: "rgba(238, 231, 221, 0.72)",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: tokens.space.sm,
    justifyContent: "space-between",
    minHeight: HEADER_MIN_HEIGHT,
    paddingHorizontal: HEADER_PADDING_HORIZONTAL,
    paddingVertical: HEADER_PADDING_VERTICAL,
  },
  gameTitle: {
    color: tokens.color.ink,
    fontFamily: tokens.font.brand,
    fontSize: tokens.type.h2,
    lineHeight: 30,
    paddingTop: 2,
  },
  gameTitleBlock: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    maxWidth: 240,
    minWidth: 0,
  },
  metaLabel: {
    color: tokens.color.primaryDark,
    ...tokens.typography.uiLabel,
  },
  pageHeader: {
    alignItems: "center",
    backgroundColor: APP_HEADER_BACKGROUND,
    borderBottomColor: "rgba(238, 231, 221, 0.72)",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: tokens.space.sm,
    justifyContent: "space-between",
    minHeight: HEADER_MIN_HEIGHT,
    paddingHorizontal: HEADER_PADDING_HORIZONTAL,
    paddingVertical: HEADER_PADDING_VERTICAL,
  },
  pageTitle: {
    color: tokens.color.ink,
    fontFamily: tokens.font.ui.semibold,
    fontSize: tokens.type.h2,
    letterSpacing: -0.4,
  },
  sideSlot: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 44,
  },
  titleButton: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: tokens.space.xs,
    justifyContent: "center",
    minWidth: 0,
  },
});
