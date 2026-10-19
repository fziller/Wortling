import type { SilbenmixPuzzle, SilbenmixState, SilbenmixSubmitResult, SilbenmixTarget } from "./types";

function normalize(value: string): string {
  return value.normalize("NFC").trim().toLocaleLowerCase("de-DE");
}

function isFinished(state: SilbenmixState): boolean {
  return state.status !== "playing";
}

function targetForDraft(puzzle: SilbenmixPuzzle, state: SilbenmixState): SilbenmixTarget | null {
  const draft = getSilbenmixDraft(puzzle, state);
  return puzzle.targets.find((target) => normalize(target.word) === draft) ?? null;
}

function finishStatus(puzzle: SilbenmixPuzzle, state: SilbenmixState): SilbenmixState["status"] {
  if (state.solvedTargetIds.length + state.revealedTargetIds.length < puzzle.targets.length) return "playing";
  return state.revealedTargetIds.length ? "revealed" : "won";
}

function firstAvailableTileId(puzzle: SilbenmixPuzzle, state: SilbenmixState, syllable: string, excluded = new Set<string>()): string | null {
  const unavailable = new Set([...state.usedTileIds, ...excluded]);
  return puzzle.tiles.find((tile) => tile.syllable === syllable && !unavailable.has(tile.id))?.id ?? null;
}

function allocateTargetTiles(puzzle: SilbenmixPuzzle, state: SilbenmixState, target: SilbenmixTarget): string[] | null {
  const allocated: string[] = [];
  for (const syllable of target.syllables) {
    const tileId = firstAvailableTileId(puzzle, state, syllable, new Set(allocated));
    if (!tileId) return null;
    allocated.push(tileId);
  }
  return allocated;
}

function nextHintTarget(puzzle: SilbenmixPuzzle, state: SilbenmixState): SilbenmixTarget | null {
  const complete = new Set([...state.solvedTargetIds, ...state.revealedTargetIds]);
  return puzzle.targets.find((target) => !complete.has(target.id) && allocateTargetTiles(puzzle, state, target)) ?? null;
}

export function createSilbenmixState(puzzle: SilbenmixPuzzle): SilbenmixState {
  return {
    puzzleId: puzzle.id,
    selectedTileIds: [],
    usedTileIds: [],
    solvedTargetIds: [],
    revealedTargetIds: [],
    hintedTileIds: [],
    status: "playing",
  };
}

export function getSilbenmixDraft(puzzle: SilbenmixPuzzle, state: SilbenmixState): string {
  const byId = new Map(puzzle.tiles.map((tile) => [tile.id, tile.syllable]));
  return state.selectedTileIds.map((tileId) => byId.get(tileId) ?? "").join("");
}

export function selectSilbenmixTile(puzzle: SilbenmixPuzzle, state: SilbenmixState, tileId: string, insertIndex = state.selectedTileIds.length): SilbenmixState {
  if (isFinished(state) || state.usedTileIds.includes(tileId) || state.selectedTileIds.includes(tileId) || !puzzle.tiles.some((tile) => tile.id === tileId)) return state;
  const selectedTileIds = [...state.selectedTileIds];
  selectedTileIds.splice(Math.max(0, Math.min(insertIndex, selectedTileIds.length)), 0, tileId);
  return { ...state, selectedTileIds };
}

export function removeSilbenmixTile(state: SilbenmixState, tileId: string): SilbenmixState {
  if (isFinished(state) || !state.selectedTileIds.includes(tileId)) return state;
  return { ...state, selectedTileIds: state.selectedTileIds.filter((id) => id !== tileId) };
}

export function moveSilbenmixTile(state: SilbenmixState, tileId: string, insertIndex: number): SilbenmixState {
  if (isFinished(state)) return state;
  const fromIndex = state.selectedTileIds.indexOf(tileId);
  if (fromIndex === -1) return state;
  const selectedTileIds = state.selectedTileIds.filter((id) => id !== tileId);
  const targetIndex = Math.max(0, Math.min(insertIndex, selectedTileIds.length));
  selectedTileIds.splice(targetIndex, 0, tileId);
  if (selectedTileIds.every((id, index) => id === state.selectedTileIds[index])) return state;
  return { ...state, selectedTileIds };
}

export function submitSilbenmixWord(puzzle: SilbenmixPuzzle, state: SilbenmixState): SilbenmixSubmitResult {
  if (isFinished(state)) return { ok: false, state, reason: "Diese Runde ist schon beendet." };
  if (!state.selectedTileIds.length) return { ok: false, state, reason: "Setze zuerst Silben zusammen." };
  const target = targetForDraft(puzzle, state);
  if (!target) return { ok: false, state, reason: "Das ist kein gesuchtes Wort." };
  if (state.solvedTargetIds.includes(target.id) || state.revealedTargetIds.includes(target.id)) return { ok: false, state, reason: "Dieses Wort ist schon gelöst." };

  const next: SilbenmixState = {
    ...state,
    selectedTileIds: [],
    usedTileIds: [...state.usedTileIds, ...state.selectedTileIds],
    solvedTargetIds: [...state.solvedTargetIds, target.id],
    hintedTileIds: state.hintedTileIds.filter((tileId) => !state.selectedTileIds.includes(tileId)),
  };
  return { ok: true, word: target.word, state: { ...next, status: finishStatus(puzzle, next) } };
}

export function applySilbenmixStartHint(puzzle: SilbenmixPuzzle, state: SilbenmixState): SilbenmixState {
  if (isFinished(state)) return state;
  const target = nextHintTarget(puzzle, state);
  const tileId = target ? firstAvailableTileId(puzzle, state, target.syllables[0] ?? "") : null;
  if (!tileId) return state;
  return { ...state, hintedTileIds: [...new Set([...state.hintedTileIds, tileId])] };
}

export function applySilbenmixPairHint(puzzle: SilbenmixPuzzle, state: SilbenmixState): SilbenmixState {
  if (isFinished(state)) return state;
  const target = puzzle.targets.find((item) => item.syllables.length >= 2 && !state.solvedTargetIds.includes(item.id) && !state.revealedTargetIds.includes(item.id) && allocateTargetTiles(puzzle, state, item));
  if (!target) return state;
  const first = firstAvailableTileId(puzzle, state, target.syllables[0] ?? "");
  const second = first ? firstAvailableTileId(puzzle, state, target.syllables[1] ?? "", new Set([first])) : null;
  if (!first || !second) return state;
  return { ...state, hintedTileIds: [...new Set([...state.hintedTileIds, first, second])] };
}

export function revealSilbenmixWord(puzzle: SilbenmixPuzzle, state: SilbenmixState): SilbenmixState {
  if (isFinished(state)) return state;
  const target = nextHintTarget(puzzle, state);
  if (!target) return state;
  const tileIds = allocateTargetTiles(puzzle, state, target);
  if (!tileIds) return state;
  const next: SilbenmixState = {
    ...state,
    selectedTileIds: state.selectedTileIds.filter((tileId) => !tileIds.includes(tileId)),
    usedTileIds: [...state.usedTileIds, ...tileIds],
    revealedTargetIds: [...state.revealedTargetIds, target.id],
    hintedTileIds: state.hintedTileIds.filter((tileId) => !tileIds.includes(tileId)),
  };
  return { ...next, status: finishStatus(puzzle, next) };
}

export function revealSilbenmixSolution(puzzle: SilbenmixPuzzle, state: SilbenmixState): SilbenmixState {
  const allTileIds = puzzle.tiles.map((tile) => tile.id);
  return {
    ...state,
    selectedTileIds: [],
    usedTileIds: allTileIds,
    revealedTargetIds: puzzle.targets.filter((target) => !state.solvedTargetIds.includes(target.id)).map((target) => target.id),
    hintedTileIds: [],
    status: "revealed",
  };
}

export function getSilbenmixTarget(puzzle: SilbenmixPuzzle, targetId: string): SilbenmixTarget | null {
  return puzzle.targets.find((target) => target.id === targetId) ?? null;
}
