export async function checkWinner(_gameId: string) {
  // Automatic winner detection is intentionally disabled.
  // The Host decides when the game is actually over, because Constantine
  // may revive an eliminated player before the final result is declared.
  return null;
}
