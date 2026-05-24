import type { NoteSegment } from "./content";

export interface GenerateRequest {
  note_segment: NoteSegment;
  spu: string;
  content_type: string;
  topic: string;
  organization_info?: string;
  extra_requirements?: string;
}

export interface CoverText {
  main_title: string;
  subtitle: string;
  layout_suggestion: string;
}

export interface GenerateResponse {
  titles: string[];
  body: string;
  cover_texts: CoverText[];
  video_opening_scripts?: string[];
  comment_cta: string;
  private_message_cta: string;
  usage_note: string;
}
