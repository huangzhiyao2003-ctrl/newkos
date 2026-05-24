import formulaLibrary from "../data/formula_library.json";
import goodCases from "../data/good_cases.json";
import type { ContentTypeItem, Formula, FormulaLibrary, GoodCaseGroup, NoteSegment, SegmentItem, SpuItem, TopicItem } from "../types/content";

export const library = formulaLibrary as FormulaLibrary;
export const caseGroups = goodCases as GoodCaseGroup[];

const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };

export function sortByPriority<T extends { priority: keyof typeof priorityOrder; recommendation_score?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || (b.recommendation_score ?? 0) - (a.recommendation_score ?? 0));
}

export function getSegments(): SegmentItem[] {
  return library.segment_list;
}

export function getSpus(noteSegment: NoteSegment): SpuItem[] {
  return sortByPriority(library.spu_list.filter((item) => item.note_segment === noteSegment));
}

export function getContentTypes(noteSegment: NoteSegment, spu: string): ContentTypeItem[] {
  return sortByPriority(library.content_type_list.filter((item) => item.note_segment === noteSegment && item.spu === spu));
}

export function getTopics(noteSegment: NoteSegment, spu: string, contentType: string): TopicItem[] {
  return sortByPriority(library.topic_list.filter((item) => item.note_segment === noteSegment && item.spu === spu && item.content_type === contentType));
}

export function getFormula(noteSegment: NoteSegment, spu: string, contentType: string, topic: string): Formula | undefined {
  return library.formulas.find((item) => item.note_segment === noteSegment && item.spu === spu && item.content_type === contentType && item.topic === topic);
}

export function getCases(noteSegment: NoteSegment, spu: string, contentType: string, topic: string): GoodCaseGroup | undefined {
  return caseGroups.find((item) => item.note_segment === noteSegment && item.spu === spu && item.content_type === contentType && item.topic === topic);
}
