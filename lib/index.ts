import {
  FilloutResponseType,
  FilterClauseType,
  FilloutResponseBodyType,
} from "../types";
import { filter } from "lodash";
import { Request } from "express";

/**
 * converts the question value and the filter value to the same type
 * @param questionValue
 * @param filterValue
 * @returns both values as strings or both values as numbers
 */
const makeBothNumbersOrStrings = (
  questionValue: string | number,
  filterValue: string | number
):
  | { finalQuestionValue: string; finalFilterValue: string }
  | { finalQuestionValue: number; finalFilterValue: number } => {
  if (typeof questionValue === "number" || typeof filterValue === "number") {
    // if either is a number, then attempt to convert them both to numbers
    return {
      finalQuestionValue: Number(questionValue),
      finalFilterValue: Number(filterValue),
    };
  }

  // if neither is a number, then they are strings and can stay in their original form
  return { finalQuestionValue: questionValue, finalFilterValue: filterValue };
};

/**
 * Filters the responses according to the filter clause input
 * @param responses
 * @param filterClauses
 * @returns filtered list of responses
 */
const filterResponses = (
  responses: FilloutResponseType[],
  filterClauses: FilterClauseType[]
) =>
  filter(responses, (response: FilloutResponseType) => {
    let valid = true;

    for (const filterClause of filterClauses) {
      const question = response.questions.find((q) => q.id === filterClause.id);

      if (!question) {
        valid = false;
        break;
      }

      if (question.value === null) {
        // the filter value cannot be null so assume this question does not
        // meet the criteria
        valid = false;
        break;
      }

      const { finalQuestionValue, finalFilterValue } = makeBothNumbersOrStrings(
        question.value,
        filterClause.value
      );

      switch (filterClause.condition) {
        case "equals":
          valid = finalQuestionValue === finalFilterValue;
          break;
        case "does_not_equal":
          valid = finalQuestionValue !== finalFilterValue;
          break;
        case "greater_than":
          valid = finalQuestionValue > finalFilterValue;
          break;
        case "less_than":
          valid = finalQuestionValue < finalFilterValue;
          break;
        default:
          throw new Error(
            "condition is not one of ['equals', 'does_not_equal', 'greater_than', 'less_than']"
          );
      }
    }

    return valid;
  });

const getFilloutUrlSearchParamsFromRequest = (request: Request) => {
  const {
    limit,
    afterDate,
    beforeDate,
    offset,
    status,
    includeEditLink,
    sort,
  } = request.query;

  const queryParams = new URLSearchParams();

  const limitParam = limit?.toString() || "150";
  const parsedLimit = Number(limitParam);
  const limitNumber = isNaN(parsedLimit) ? 150 : parsedLimit;

  // regardless what the passed in limit is, we want to fetch the default number
  // from the Fillout API and use the passed in limit later
  limit && queryParams.append("limit", "150");

  const offsetParam = offset?.toString() || "0";
  const parsedOffset = Number(offsetParam);
  const offsetNumber = isNaN(parsedOffset) ? 0 : parsedOffset;

  // regardless what the passed in offset is, we want to fetch ALL the data and
  // then consider the offset later after filtering the responses
  offset && queryParams.append("offset", "0");

  afterDate && queryParams.append("afterDate", afterDate.toString());
  beforeDate && queryParams.append("beforeDate", beforeDate.toString());
  status && queryParams.append("status", status.toString());
  includeEditLink &&
    queryParams.append("includeEditLink", includeEditLink.toString());
  sort && queryParams.append("sort", sort.toString());

  return { queryParams, limit: limitNumber, offset: offsetNumber };
};

/**
 * Gets the full list of responses from the FIllout API by looping through
 * all the pages of responses
 * @param formId
 * @param queryParams
 * @returns all of the responses from the Fillout API
 */
const getAllResponses = async (
  formId: string,
  queryParams: URLSearchParams
) => {
  const filloutApiKey = process.env.FILLOUT_API_KEY || "";

  let currentPage = 0;
  let pageCount = 1;

  const allResponses: FilloutResponseType[] = [];

  // loop through all the pages to make sure we don't miss any responses
  while (currentPage < pageCount) {
    // using the default limit of 150, get the current offset
    const currentOffset = currentPage * 150;
    queryParams.set("offset", currentOffset.toString());

    const response = await fetch(
      `https://api.fillout.com/v1/api/forms/${formId}/submissions?${queryParams}`,
      {
        headers: { Authorization: `Bearer ${filloutApiKey}` },
      }
    );

    const responseBody = (await response.json()) as FilloutResponseBodyType;

    const { responses } = responseBody;

    allResponses.push(...responses);

    pageCount = responseBody.pageCount;

    currentPage++;
  }

  return allResponses;
};

/**
 * Gets the responses from the Fillout API and then filters them
 * according to the filter clause input
 * @param req
 * @returns The response body including the filtered list of responses,
 * the total number of filtered responses, and the page count
 */
export const getFilteredResponseBody = async (req: Request) => {
  const filterParam = req.query.filter;

  if (typeof filterParam !== "string") {
    throw new Error("filter must be stringified JSON");
  }

  const formId = req.params.formId;

  // Assume that the filterParam is in the format of FilterClauseType[]
  // In the future, I would validate this better
  const filterClauses = JSON.parse(filterParam) as FilterClauseType[];

  const { queryParams, limit, offset } =
    getFilloutUrlSearchParamsFromRequest(req);

  const allResponses: FilloutResponseType[] = await getAllResponses(
    formId,
    queryParams
  );

  const filteredResponses = filterResponses(allResponses, filterClauses);

  const limitedResponses = filteredResponses.slice(offset, offset + limit);

  const hasRemainder = filteredResponses.length % limit > 0;
  const filteredPageCount =
    Math.floor(filteredResponses.length / limit) + (hasRemainder ? 1 : 0);

  return {
    responses: limitedResponses,
    totalResponses: filteredResponses.length,
    pageCount: filteredPageCount,
  };
};
