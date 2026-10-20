// Generated storage contracts; business relationships use stable semantic keys.
import type { LibraryMetadata } from "../../domain/provenance";
export interface QuestionSets extends LibraryMetadata {
  id: string;
  key: string;
  name: string;
  questionType: string;
  version: string | null;
  description: string | null;
}
export interface QuestionDefinitions extends LibraryMetadata {
  id: string;
  key: string;
  text: string;
  responseType: string | null;
  status: string;
}
export interface QuestionSetQuestions extends LibraryMetadata {
  id: string;
  key: string;
  questionSetKey: string;
  questionKey: string;
  position: number;
  conditionKey: string | null;
}
export interface QuestionSetFields extends LibraryMetadata {
  id: string;
  key: string;
  questionSetKey: string;
  fieldKey: string;
  position: number;
  conditionKey: string | null;
}
export interface PageSectionFields extends LibraryMetadata {
  id: string;
  key: string;
  sectionKey: string;
  fieldKey: string;
  position: number;
}
export interface ProductQuestionSets extends LibraryMetadata {
  id: string;
  key: string;
  productKey: string;
  questionSetKey: string;
  applicantTypeKey: string | null;
}
