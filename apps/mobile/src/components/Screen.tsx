import { PropsWithChildren, useMemo } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";

import { tokens } from "@/design/tokens";

const gameBackgroundVideos = [
  require("../../assets/background/game-background_1.mp4"),
  require("../../assets/background/game-background_2.mp4"),
  require("../../assets/background/game-background_3.mp4"),
  require("../../assets/background/game-background_4.mp4")
];

type ScreenProps = PropsWithChildren<{
  videoBackground?: boolean;
}>;

export function Screen({ children, videoBackground = false }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      {videoBackground ? <BackgroundVideo /> : null}
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

function BackgroundVideo() {
  const source = useMemo(
    () => gameBackgroundVideos[Math.floor(Math.random() * gameBackgroundVideos.length)],
    []
  );
  const player = useVideoPlayer(source, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return <VideoView contentFit="cover" nativeControls={false} player={player} style={StyleSheet.absoluteFill} />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.color.paper,
    overflow: "hidden"
  },
  content: {
    flex: 1,
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.lg,
    gap: tokens.space.lg
  }
});
