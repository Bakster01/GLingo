import { module1Sections } from "./spotlight-module1";
import { module2Sections } from "./spotlight-module2";

export type VocabularyWord = { en: string; ru: string; image?: string };
export type VocabularyLesson = {
  title: string; words: VocabularyWord[]; sectionCode: string;
  sectionTitle: string; source: string;
};
export type VocabularyUnit = {
  title: string; description: string; module: 1 | 2;
  image: string; lessons: VocabularyLesson[];
};

const images: Record<string, string> = {
  "palms sweat": "palms-sweat", "scratch one's head": "scratch-head",
  "tap one's foot": "tap-foot", "bite one's lip": "bite-lip",
  "raise one's eyebrows": "raise-eyebrows", "clench one's teeth/fists": "clench-fists",
  "shrug one's shoulders": "shrug-shoulders", "cross one's arms": "cross-arms",
  eggs: "eggs", potatoes: "potatoes", vegetables: "vegetables",
  chicken: "chicken", rice: "rice", fish: "fish",
};

export const englishUnits: VocabularyUnit[] = [module1Sections, module2Sections].map((sections, index) => {
  const seen = new Set<string>();
  const lessons = sections.flatMap((section) => {
    const words = section.words.filter((word) => {
      const key = `${word.en.toLowerCase()}|${word.ru}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map((word) => ({ ...word, image: images[word.en] ? `/spotlight/${images[word.en]}.png` : undefined }));
    const count = Math.ceil(words.length / 6);
    const source = section.sourcePages.map((page) => page >= 185 ? `WL${page - 184}` : `стр. ${page}`).join(", ");
    return Array.from({ length: count }, (_, part) => {
      const start = Math.round(part * words.length / count);
      const end = Math.round((part + 1) * words.length / count);
      return {
        title: `${section.code} · Слова ${start + 1}–${end}`,
        sectionCode: section.code,
        sectionTitle: section.title,
        source,
        words: words.slice(start, end),
      };
    });
  });
  return {
    title: `Spotlight 8 · Модуль ${index + 1}`,
    description: index === 0 ? "Socialising · Общение и характер" : "Food & Shopping · Еда и покупки",
    module: (index + 1) as 1 | 2,
    image: `/spotlight/${index === 0 ? "socialising" : "food-shopping"}.png`,
    lessons,
  };
});

export const courseStats = {
  words: englishUnits.reduce((sum, unit) => sum + unit.lessons.reduce((n, lesson) => n + lesson.words.length, 0), 0),
  lessons: englishUnits.reduce((sum, unit) => sum + unit.lessons.length, 0),
};

const meanings = (text: string) => text.toLowerCase().replace(/ё/g, "е")
  .replace(/\([^)]*\)/g, "").split(/[,;]/).map((part) => part.trim()).filter(Boolean);

const compatible = (a: VocabularyWord, b: VocabularyWord) =>
  a.en.toLowerCase() !== b.en.toLowerCase()
  && !meanings(a.ru).some((meaning) => meanings(b.ru).includes(meaning));

export function buildLessonChallenges(words: VocabularyWord[], pool: VocabularyWord[] = words) {
  return (["SELECT", "ASSIST"] as const).flatMap((type, direction) => words.map((word, index) => {
    const candidates = [word];
    const available = [...words.slice(index + 1), ...words.slice(0, index), ...pool];
    for (const candidate of available) {
      if (candidates.every((selected) => compatible(selected, candidate))) candidates.push(candidate);
      if (candidates.length === 3) break;
    }
    if (candidates.length !== 3) throw new Error(`Недостаточно однозначных вариантов для ${word.en}`);
    const rotation = (index + direction) % candidates.length;
    const ordered = [...candidates.slice(rotation), ...candidates.slice(0, rotation)];
    return {
      type,
      question: type === "SELECT" ? `Как по-английски «${word.ru}»?` : word.en,
      options: ordered.map((candidate) => ({
        text: type === "SELECT" ? candidate.en : candidate.ru,
        correct: candidate === word,
        imageSrc: type === "SELECT" && candidates.every((item) => item.image) ? candidate.image! : null,
      })),
    };
  }));
}
