const SNACKS = [
  "🍕",
  "🍫",
  "🍬",
  "🍩",
  "🍟",
  "🥐",
  "🥨",
  "🥪",
  "🥠",
  "🥡",
  "🍦",
  "🍧",
  "🍪",
  "🧁",
  "🧃",
  "🍌",
  "🥜",
  "🥕",
  "🥔",
  "🍉",
  "🍊",
  "🍇",
  "🍎",
  "🥭",
  "☕",
  "🍭",
  "🍙",
  "🧇",
];

/**
 * pickRandom picks a random snack from the list of snacks.
 */
export function pickRandom(): string {
  const randomIndex = Math.floor(Math.random() * SNACKS.length);
  const randomSnack = SNACKS[randomIndex];
  return randomSnack;
}
