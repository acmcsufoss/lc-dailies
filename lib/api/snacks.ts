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

const HALLOWEEN_SNACKS = [
  "🍬",
  "🍭",
  "🍫",
  "🍪",
  "🧁",
  "🎃",
];

const WINTER_SNACKS = [
  "🍪",
  "🧁",
  "🍫",
  "🍬",
  "🍭",
  "🍩",
  "🍧",
  "❄",
];

/**
 * pickRandom picks a random snack from the list of snacks.
 */
export function pickRandom(date: Date): string {
  const snacks = getSnacksByMonth(date.getMonth());
  const randomIndex = Math.floor(date.getTime() % snacks.length);
  return snacks[randomIndex];
}

function getSnacksByMonth(month: number) {
  if (month === 9) {
    return HALLOWEEN_SNACKS;
  }

  if (month === 11) {
    return WINTER_SNACKS;
  }

  return SNACKS;
}
