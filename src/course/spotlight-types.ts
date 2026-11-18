export type SpotlightSection = {
  module: 1 | 2;
  code: string;
  title: string;
  sourcePages: number[];
  words: { en: string; ru: string }[];
};

// Transcribed from the supplied scanned Word List. Pages are PDF page numbers (1-based).
export function section(module: 1 | 2, code: string, title: string, sourcePages: number[], pairs: string): SpotlightSection {
  return {
    module, code, title, sourcePages,
    words: pairs.trim().split("\n").map((line) => {
      const [en, ru] = line.split("|").map((part) => part.trim());
      if (!en || !ru) throw new Error(`Неполная словарная пара: ${line}`);
      return { en, ru };
    }),
  };
}
