/*
// TODO(@EthanThatOneKid): Delete HALLOWEEN_SNACKS November 1st, 2023.
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
*/

const HALLOWEEN_SNACKS = [
  "🍬",
  "🍭",
  "🍫",
  "🍪",
  "🧁",
  "🎃",
  "🍧",
];

/**
 * pickRandom picks a random snack from the list of snacks.
 */
export function pickRandom(): string {
  const randomIndex = Math.floor(Math.random() * HALLOWEEN_SNACKS.length);
  const randomSnack = HALLOWEEN_SNACKS[randomIndex];
  return randomSnack;
}
