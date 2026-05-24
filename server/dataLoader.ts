import fs from "node:fs";
import path from "node:path";
import type { FormulaLibrary, GoodCaseGroup, NoteSegment, VideoStrategyLibrary } from "../src/types/content";

const root = process.cwd();

export function loadFormulaLibrary(): FormulaLibrary {
  const file = path.join(root, "src", "data", "formula_library.json");
  return JSON.parse(fs.readFileSync(file, "utf-8")) as FormulaLibrary;
}

export function loadGoodCases(): GoodCaseGroup[] {
  const file = path.join(root, "src", "data", "good_cases.json");
  return JSON.parse(fs.readFileSync(file, "utf-8")) as GoodCaseGroup[];
}

export function loadVideoStrategyLibrary(): VideoStrategyLibrary | null {
  const file = path.join(root, "src", "data", "video_strategy_library.json");
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf-8")) as VideoStrategyLibrary;
}

export function findFormula(noteSegment: NoteSegment, spu: string, contentType: string, topic: string) {
  return loadFormulaLibrary().formulas.find((item) => item.note_segment === noteSegment && item.spu === spu && item.content_type === contentType && item.topic === topic);
}

export function findCases(noteSegment: NoteSegment, spu: string, contentType: string, topic: string) {
  return loadGoodCases().find((item) => item.note_segment === noteSegment && item.spu === spu && item.content_type === contentType && item.topic === topic);
}

export function findVideoStrategy(spu: string) {
  const library = loadVideoStrategyLibrary();
  if (!library) return undefined;
  return library.strategies.find((item) => item.spu === spu);
}
