// TeX-pattern runner for vendored hyph-de-1996 data. Build-time only.
export function createGermanHyphenator(patternSource) {
  const patterns = patternSource
    .split(/\s+/u)
    .filter(Boolean)
    .filter((value) => !value.startsWith("%"))
    .map(parsePattern);

  return (rawWord) => {
    const word = rawWord.normalize("NFC").toLocaleLowerCase("de-DE");
    const extended = `.${word}.`;
    const points = Array.from({ length: extended.length + 1 }, () => 0);

    for (const pattern of patterns) {
      let start = extended.indexOf(pattern.letters);
      while (start !== -1) {
        for (let index = 0; index < pattern.weights.length; index += 1) {
          points[start + index] = Math.max(points[start + index] ?? 0, pattern.weights[index] ?? 0);
        }
        start = extended.indexOf(pattern.letters, start + 1);
      }
    }

    const breaks = [];
    for (let index = 2; index <= word.length - 2; index += 1) {
      if ((points[index + 1] ?? 0) % 2 === 1) breaks.push(index);
    }
    const syllables = [];
    let start = 0;
    for (const end of breaks) {
      syllables.push(word.slice(start, end));
      start = end;
    }
    syllables.push(word.slice(start));
    return syllables;
  };
}

function parsePattern(raw) {
  const letters = raw.replace(/\d/g, "");
  const weights = Array.from({ length: letters.length + 1 }, () => 0);
  let position = 0;
  for (const char of raw) {
    if (/\d/.test(char)) weights[position] = Number(char);
    else position += 1;
  }
  return { letters, weights };
}
