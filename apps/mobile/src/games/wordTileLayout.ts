export function getWordTileLayout(wordLength: number) {
  if (wordLength >= 8) {
    return { gap: 2, minHeight: 34, fontSize: 16, symbolFontSize: 15 };
  }

  if (wordLength >= 7) {
    return { gap: 3, minHeight: 38, fontSize: 18, symbolFontSize: 17 };
  }

  if (wordLength === 6) {
    return { gap: 4, minHeight: 42, fontSize: 20, symbolFontSize: 19 };
  }

  return { gap: 5, minHeight: 46, fontSize: 22, symbolFontSize: 21 };
}
