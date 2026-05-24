export type Priority = "P0" | "P1" | "P2" | "P3";
export type NoteSegment = "kos" | "non_kos";

export interface SegmentItem {
  note_segment: NoteSegment;
  label: string;
  note_count: number;
  description: string;
}

export interface SpuItem {
  note_segment: NoteSegment;
  spu: string;
  priority: Priority;
  recommendation_score?: number;
  recommendation_reason: string;
}

export interface ContentTypeItem {
  note_segment: NoteSegment;
  spu: string;
  content_type: string;
  priority: Priority;
  recommendation_score?: number;
  recommendation_reason: string;
}

export interface TopicItem {
  note_segment: NoteSegment;
  spu: string;
  content_type: string;
  topic: string;
  priority: Priority;
  recommendation_score?: number;
  recommendation_reason: string;
}

export interface Formula {
  note_segment: NoteSegment;
  spu: string;
  content_type: string;
  topic: string;
  title_formula: string;
  title_examples: string[];
  body_formula: string;
  key_points: string[];
  avoid_points: string[];
  cover_formula: string;
  generation_instruction: string;
}

export interface FormulaLibrary {
  segment_list: SegmentItem[];
  spu_list: SpuItem[];
  content_type_list: ContentTypeItem[];
  topic_list: TopicItem[];
  formulas: Formula[];
}

export interface GoodCase {
  note_id: string;
  note_url?: string;
  cover_url: string;
  desensitized_title: string;
  desensitized_body_summary: string;
  desensitized_body?: string;
  content_reusable_points: string[];
  cover_reusable_points: string[];
  why_reference: string;
}

export interface GoodCaseGroup {
  note_segment: NoteSegment;
  spu: string;
  content_type: string;
  topic: string;
  cases: GoodCase[];
}

export interface VideoStrategyRow {
  [key: string]: string | number;
}

export interface VideoStrategy {
  spu: string;
  source_scope: string;
  cover_title_patterns: VideoStrategyRow[];
  cover_visual: {
    scene_elements: VideoStrategyRow[];
    styles: VideoStrategyRow[];
    composition: VideoStrategyRow[];
    colors: VideoStrategyRow[];
  };
  embossed_text: {
    top_words: VideoStrategyRow[];
    length_ranges: VideoStrategyRow[];
  };
  first_5_seconds: {
    scene_elements: VideoStrategyRow[];
    script_steps: {
      step_1: VideoStrategyRow[];
      step_2: VideoStrategyRow[];
      step_3: VideoStrategyRow[];
    };
  };
  overall_video: {
    person_count: VideoStrategyRow[];
    age_ranges: VideoStrategyRow[];
    roles: VideoStrategyRow[];
    duration: {
      coarse: VideoStrategyRow[];
      fine: VideoStrategyRow[];
    };
    language: VideoStrategyRow[];
    emotions: VideoStrategyRow[];
    video_format: VideoStrategyRow[];
    topic_directions: VideoStrategyRow[];
  };
  script_copy: {
    hot_words: VideoStrategyRow[];
    selling_points: VideoStrategyRow[];
    persuasion_methods: VideoStrategyRow[];
    audience_groups: VideoStrategyRow[];
    communication_scenarios: VideoStrategyRow[];
  };
  generation_guidance: string[];
}

export interface VideoStrategyLibrary {
  source_note: string;
  strategies: VideoStrategy[];
}
