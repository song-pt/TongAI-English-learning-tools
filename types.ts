
export interface WordPair {
  id: string;
  en: string;
  cn: string;
}

export interface ContextQuestion {
  sentence: string;
  answer: string;
}

export interface GrammarExplanation {
  title: string;
  usage: string;
  examples: string[];
  comparisons: string;
}

export interface GrammarFillQuestion {
  sentence: string;
  hint: string;
  answer: string;
}

export interface GrammarChoiceQuestion {
  sentence: string;
  options: string[];
  answer: string;
}

export interface GrammarPracticeData {
  explanation: GrammarExplanation;
  fillQuestions: GrammarFillQuestion[];
  choiceQuestions: GrammarChoiceQuestion[];
}

export type GrammarSubMode = 'explanation' | 'fill' | 'choice';

export type AppMode = 'input' | 'matching' | 'context' | 'settings' | 'grammar_input' | 'grammar_practice';
export type AppTheme = 'duolingo' | 'aero';

export interface AppSettings {
  baseUrl: string;
  customApiKey: string;
  modelName: string;
  allowInflection: boolean;
  theme: AppTheme;
  aeroOpacity: number;
  wordPracticeCount: number;
  grammarPracticeCount: number;
}
