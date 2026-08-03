/** Format seconds as "M:SS" countdown string. */
export function formatCountdown(secondsLeft: number): string {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}
