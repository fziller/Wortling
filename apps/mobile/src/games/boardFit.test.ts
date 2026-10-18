import { describe, expect, it } from "vitest";

import {
  BOARD_MESSAGE_RESERVE,
  BOARD_PADDING_TOP,
  fitBoardMetrics,
  MIN_BOARD_ROW_HEIGHT,
} from "./boardFit";

const tile = { minHeight: 52, fontSize: 24 };

function heightFor(rowMinHeight: number, maxAttempts: number, rowGap: number) {
  return (
    BOARD_PADDING_TOP +
    (maxAttempts + 1) * rowMinHeight +
    maxAttempts * rowGap +
    BOARD_MESSAGE_RESERVE
  );
}

describe("fitBoardMetrics", () => {
  it("keeps the designed metrics before the content area is measured", () => {
    expect(fitBoardMetrics({ contentHeight: 0, maxAttempts: 6, rowGap: 6, tile })).toEqual(tile);
  });

  it("keeps the designed metrics when there is room to spare", () => {
    const contentHeight = heightFor(tile.minHeight, 6, 6) + 120;

    expect(fitBoardMetrics({ contentHeight, maxAttempts: 6, rowGap: 6, tile })).toEqual(tile);
  });

  it("shrinks so the input row next to a full board still fits", () => {
    const contentHeight = 364;
    const result = fitBoardMetrics({ contentHeight, maxAttempts: 6, rowGap: 6, tile });

    expect(result.minHeight).toBeLessThan(tile.minHeight);
    expect(heightFor(result.minHeight, 6, 6)).toBeLessThanOrEqual(contentHeight);
  });

  it("scales the font size with the row height", () => {
    const result = fitBoardMetrics({ contentHeight: 364, maxAttempts: 6, rowGap: 6, tile });

    expect(result.fontSize).toBe(Math.round((24 * result.minHeight) / 52));
    expect(result.fontSize).toBeLessThan(tile.fontSize);
  });

  it("stops at the readability floor instead of collapsing", () => {
    const result = fitBoardMetrics({ contentHeight: 120, maxAttempts: 6, rowGap: 6, tile });

    expect(result.minHeight).toBe(MIN_BOARD_ROW_HEIGHT);
  });

  it("always accounts for the input row on top of the attempts", () => {
    const contentHeight = heightFor(tile.minHeight, 6, 6) - 1;
    const result = fitBoardMetrics({ contentHeight, maxAttempts: 6, rowGap: 6, tile });
    const withoutInputRow = fitBoardMetrics({ contentHeight: contentHeight + 60, maxAttempts: 6, rowGap: 6, tile });

    expect(result.minHeight).toBeLessThan(withoutInputRow.minHeight);
  });
});