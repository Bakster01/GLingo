import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { englishUnits, buildLessonChallenges } from "../src/course/english-course";
import { module1Sections } from "../src/course/spotlight-module1";
import { module2Sections } from "../src/course/spotlight-module2";

test("Both Spotlight modules cover every supplied glossary pair and retain page references", () => {
  assert.equal(englishUnits.length, 2);
  for (const [i, sections] of [module1Sections, module2Sections].entries()) {
    assert.match(englishUnits[i].title, new RegExp(`Spotlight 8.*${i + 1}`));
    const words = englishUnits[i].lessons.flatMap((lesson) => lesson.words);
    for (const section of sections) {
      assert(section.sourcePages.every((page) => [11, 26].includes(page) || (page >= 185 && page <= 191)));
      for (const word of section.words) {
        assert(words.some((entry) => entry.en === word.en && entry.ru === word.ru), `${section.code}: ${word.en}`);
      }
    }
  }
});

test("Every Spotlight task has distinct options and exactly one answer in either direction", () => {
  for (const unit of englishUnits) {
    const pool = unit.lessons.flatMap((lesson) => lesson.words);
    for (const lesson of unit.lessons) {
      assert(lesson.words.length >= 3 && lesson.words.length <= 8);
      const tasks = buildLessonChallenges(lesson.words, pool);
      assert.equal(tasks.length, lesson.words.length * 2);
      for (const task of tasks) {
        assert.equal(task.options.length, 3);
        assert.equal(task.options.filter((option) => option.correct).length, 1);
        assert.equal(new Set(task.options.map((option) => option.text)).size, 3);
        for (const option of task.options) {
          if (option.imageSrc) assert(existsSync(`public${option.imageSrc}`));
        }
      }
      for (const word of lesson.words) {
        assert(tasks.some((task) => task.type === "SELECT" && task.question.includes(word.ru) && task.options.some((option) => option.correct && option.text === word.en)));
        assert(tasks.some((task) => task.type === "ASSIST" && task.question === word.en && task.options.some((option) => option.correct && option.text === word.ru)));
      }
    }
  }
});

test("Equivalent translations are not presented as competing English answers", () => {
  const words = [
    { en: "appealing", ru: "привлекательный" },
    { en: "attractive", ru: "привлекательный" },
    { en: "boiled", ru: "варёный" },
    { en: "raw", ru: "сырой" },
    { en: "fried", ru: "жареный" },
  ];
  const tasks = buildLessonChallenges(words);
  const task = tasks.find((task) => task.type === "SELECT" && task.options.some((option) => option.text === "appealing" && option.correct))!;
  assert(!task.options.some((option) => option.text === "attractive"));
});
