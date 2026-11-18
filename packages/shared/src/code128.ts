// Code 128 (set B, printable ASCII) for the sample labels (Batch_Build_Design.md section 9): the barcode carries the Sample ID.
// No dependency: the 107 symbol patterns are listed as bar and space widths in modules (each symbol is 11 modules, the stop 13).
const PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", "221312", "231212", "112232", "122132", "122231", "113222",
  "123122", "123221", "223211", "221132", "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", "212123", "212321",
  "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121",
  "313121", "211331", "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", "314111", "221411", "431111", "111224",
  "111422", "121124", "121421", "141122", "141221", "112214", "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", "214121", "412121", "111143", "111341", "131141", "114113",
  "114311", "411113", "411311", "113141", "114131", "311141", "411131", "211412", "211214", "211232", "2331112",
] as const;
const START_B = 104, STOP = 106;

export const code128Patterns = PATTERNS;

/** The symbol values of `text`: start B, one per character, the check symbol, the stop. Throws on a character outside ASCII 32 to 126. */
export function code128Values(text: string): number[] {
  const vals = [START_B];
  let sum = START_B;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c < 32 || c > 126) throw new Error(`Code 128 B has no symbol for "${text[i]}".`);
    vals.push(c - 32);
    sum += (c - 32) * (i + 1);
  }
  vals.push(sum % 103, STOP);
  return vals;
}

/** Bars of the barcode as [x, width] in modules, plus the total width (quiet zones not included). */
export function code128Bars(text: string): { bars: Array<[number, number]>; width: number } {
  const bars: Array<[number, number]> = [];
  let x = 0;
  for (const v of code128Values(text)) {
    const p = PATTERNS[v]!;
    for (let i = 0; i < p.length; i++) {
      const w = Number(p[i]);
      if (i % 2 === 0) bars.push([x, w]);
      x += w;
    }
  }
  return { bars, width: x };
}
