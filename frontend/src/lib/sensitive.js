/*
  Warns when text looks like a door, gate, or lockbox code. Guides are public to
  anyone with the link, so codes should be sent to guests privately.
  This is a heuristic: it only warns, it never blocks.
*/

const KEYWORD = /\b(code|pin|passcode|pass code|lockbox|lock box|keypad|combination|combo|door code|gate code)\b/i;
const DIGITS = /\b\d{3,8}\b/;

export function looksLikeCode(text) {
  if (!text) return false;
  const sentences = String(text).split(/(?<=[.!?\n])/);
  return sentences.some((s) => KEYWORD.test(s) && DIGITS.test(s));
}

/** Replaces the digits in any sentence that looks like a code. */
export function stripCodes(text) {
  return String(text)
    .split(/(?<=[.!?\n])/)
    .map((s) => (KEYWORD.test(s) && DIGITS.test(s) ? s.replace(/\b\d{3,8}\b/g, "[sent privately]") : s))
    .join("");
}
