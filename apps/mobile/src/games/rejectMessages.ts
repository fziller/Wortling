const hiddenRejectMessages = new Set([
  "Unbekanntes Wort.",
  "Dieses deutsche Wort kenne ich noch nicht.",
]);

export function rejectMessage(reason: string): string {
  return hiddenRejectMessages.has(reason) ? "" : reason;
}
