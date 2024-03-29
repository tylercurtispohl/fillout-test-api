export type FilterClauseType = {
  id: string;
  condition: "equals" | "does_not_equal" | "greater_than" | "less_than";
  value: number | string;
};

export type FilloutResponseBodyType = {
  responses: FilloutResponseType[];
  totalResponses: number;
  pageCount: number;
};

export type FilloutResponseType = {
  submissionId: string;
  submissionTime: string;
  lastUpdatedAt: string;
  questions: FilloutQuestionType[];
  calculations: FilloutCalculationType[];
  urlParameters: FilloutUrlParametersType[];
  quiz: FilloutQuizType;
};

export type FilloutQuestionType = {
  id: string;
  name: string;
  type: string;
  value: string | number | null;
};

export type FilloutCalculationType = {
  id: string;
  name: string;
  type: string;
  value: string;
};

export type FilloutUrlParametersType = {
  id: string;
  name: string;
  value: string;
};

export type FilloutQuizType = {
  score: number;
  maxScore: 10;
};
