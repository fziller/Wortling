import { tokens } from "@/design/tokens";
import { VideoView, useVideoPlayer } from "expo-video";
import { PropsWithChildren, ReactNode, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const gameBackgroundVideos = [
  require("../../assets/background/game-background_1.mp4"),
  require("../../assets/background/game-background_2.mp4"),
  require("../../assets/background/game-background_3.mp4"),
  require("../../assets/background/game-background_4.mp4"),
];

type ScreenProps = PropsWithChildren<{
  header?: ReactNode;
  videoBackground?: boolean;
}>;

export function Screen({ children, header, videoBackground = false }: ScreenProps) {
  if (!header) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {videoBackground ? <BackgroundVideo /> : null}
        <View style={styles.content}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.safeArea}>
      {videoBackground ? <BackgroundVideo /> : null}
      <SafeAreaView edges={["top", "left", "right"]} style={[styles.headerSafeArea, videoBackground && styles.videoHeaderSafeArea]}>
        {header}
      </SafeAreaView>
      <SafeAreaView edges={["left", "right", "bottom"]} style={styles.contentSafeArea}>
        <View style={styles.content}>{children}</View>
      </SafeAreaView>
    </View>
  );
}

function BackgroundVideo() {
  const source = useMemo(
    () =>
      gameBackgroundVideos[
        Math.floor(Math.random() * gameBackgroundVideos.length)
      ],
    [],
  );
  const player = useVideoPlayer(source, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <VideoView
      contentFit="cover"
      nativeControls={false}
      player={player}
      style={StyleSheet.absoluteFill}
    />
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.color.paper,
    overflow: "hidden",
  },
  headerSafeArea: {
    zIndex: 1,
    backgroundColor: tokens.color.paper,
  },
  videoHeaderSafeArea: {
    backgroundColor: "rgba(253, 251, 247, 0.72)",
  },
  contentSafeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: tokens.space.md,
    paddingBottom: 8,
    gap: tokens.space.lg,
  },
});
