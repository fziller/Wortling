/**
 * Board rows have to fit into the space a game screen actually got. The header, safe area,
 * action row and keyboard all eat into it, and they differ per device — so guessing from
 * `useWindowDimensions` is wrong. Screens measure their content area via
 * `GameScreenFrame`'s `onContentLayout` and feed the result in here.
 */

/** Top inset `GrowingGuessBoard` adds; part of the height the board reserves. Mirrors `tokens.space.xs`. */
export const BOARD_PADDING_TOP = 6;

/** Below this a letter tile stops being readable, so we stop shrinking and let the screen scroll. */
export const MIN_BOARD_ROW_HEIGHT = 36;

/** The feedback line a game renders under its board: `uiBody` lineHeight 24 plus the gap above it. */
export const BOARD_MESSAGE_RESERVE = 34;

export type BoardTileMetrics = {
  fontSize: number;
  minHeight: number;
};

export type FitBoardMetricsInput = {
  /** Height the content area was actually laid out with. `0` means "not measured yet". */
  contentHeight: number;
  maxAttempts: number;
  /** Vertical space reserved next to the board, for the feedback line. */
  reservedHeight?: number;
  rowGap: number;
  tile: BoardTileMetrics;
};

/**
 * Shrinks a board's tiles so every attempt row *plus* the input row fits the measured content
 * height. Tiles never grow past their designed size, and never shrink below
 * {@link MIN_BOARD_ROW_HEIGHT} — when the floor is hit the caller should provide a scroll view.
 */
export function fitBoardMetrics({
  contentHeight,
  maxAttempts,
  reservedHeight = BOARD_MESSAGE_RESERVE,
  rowGap,
  tile,
}: FitBoardMetricsInput): BoardTileMetrics {
  if (contentHeight <= 0) return tile;

  // The input row sits below the last attempt, so it needs room of its own.
  const rows = Math.max(maxAttempts + 1, 1);
  const available = contentHeight - reservedHeight - BOARD_PADDING_TOP - (rows - 1) * rowGap;
  const fitted = Math.floor(available / rows);

  if (fitted >= tile.minHeight) return tile;

  const minHeight = Math.max(MIN_BOARD_ROW_HEIGHT, fitted);

  return {
    minHeight,
    fontSize: Math.round((tile.fontSize * minHeight) / tile.minHeight),
  };
}