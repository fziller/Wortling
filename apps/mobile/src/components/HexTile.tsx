import { StyleSheet, Text, View } from "react-native";

import { tokens } from "@/design/tokens";

const SQRT3 = Math.sqrt(3);

export type HexTileVariant = "default" | "center";

type HexTileProps = {
  label: string;
  size?: number;
  variant?: HexTileVariant;
};

type HexDims = {
  halfW: number;
  rectH: number;
  triH: number;
  totalH: number;
};

function dims(width: number): HexDims {
  const rectH = width / SQRT3;
  const triH = rectH / 2;

  return { halfW: width / 2, rectH, triH, totalH: rectH + triH * 2 };
}

function triangle(halfW: number, height: number, color: string, direction: "up" | "down") {
  return {
    width: 0,
    height: 0,
    borderLeftWidth: halfW,
    borderLeftColor: "transparent",
    borderRightWidth: halfW,
    borderRightColor: "transparent",
    // 1px overlap with the middle rectangle hides hairline seams from
    // fractional pixel rounding where the shapes meet.
    ...(direction === "up"
      ? { borderBottomWidth: height, borderBottomColor: color, marginBottom: -1 }
      : { borderTopWidth: height, borderTopColor: color, marginTop: -1 }),
  };
}

// Pointy-top hexagon drawn from Views (middle rectangle + top/bottom
// triangles), so letters stay exactly centered on every platform. The border
// is a slightly larger hexagon behind the fill, matching LetterInputTiles.
export function HexTile({ label, size = 72, variant = "default" }: HexTileProps) {
  const border = Math.max(1, Math.round(size / 36));
  const fill = dims(size);
  const outer = dims(size + border * 2);
  const fillColor = variant === "center" ? "#FFE8A8" : tokens.surface.tile;
  const borderColor = variant === "center" ? "#E0AF28" : tokens.color.line;

  return (
    <View style={{ width: size + border * 2, height: outer.totalH, alignItems: "center", justifyContent: "center" }}>
      <View style={{ alignItems: "center" }}>
        <View style={triangle(outer.halfW, outer.triH, borderColor, "up")} />
        <View style={{ width: size + border * 2, height: outer.rectH, backgroundColor: borderColor }} />
        <View style={triangle(outer.halfW, outer.triH, borderColor, "down")} />
      </View>
      <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
        <View style={{ alignItems: "center" }}>
          <View style={triangle(fill.halfW, fill.triH, fillColor, "up")} />
          <View style={{ width: size, height: fill.rectH, backgroundColor: fillColor }} />
          <View style={triangle(fill.halfW, fill.triH, fillColor, "down")} />
        </View>
      </View>
      <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: tokens.color.ink, fontFamily: tokens.font.ui.semibold, fontSize: Math.round(size * 0.32), textAlign: "center" }}>
          {label}
        </Text>
      </View>
    </View>
  );
}
