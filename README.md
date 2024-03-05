This repository was created to fulfill the requirements of the Software Engineering Screening for consideration of employment with Fillout.com.

In [src/index.ts](https://github.com/tylercurtispohl/fillout-test-api/blob/5335b39fa6c733270b1163cf9ce98ab162449389/src/index.ts), I create an API endpoint using Express with the URI `/:formId/filteredResponses`. This API endpoint allows all of the query parameters of the [Fillout API Get Submissions request](https://github.com/tylercurtispohl/fillout-test-api/blob/5335b39fa6c733270b1163cf9ce98ab162449389/src/index.ts](https://www.fillout.com/help/fillout-rest-api#a981e824966448029aeb091e0706d070)https://www.fillout.com/help/fillout-rest-api#a981e824966448029aeb091e0706d070). It also accepts stringified JSON in a query parameter called `filter`. This input should match the format of this TypeScript type:

```typescript
export type FilterClauseType = {
  id: string;
  condition: "equals" | "does_not_equal" | "greater_than" | "less_than";
  value: number | string;
};
```

You'll find all of the types in [src/types/index.ts](https://github.com/tylercurtispohl/fillout-test-api/blob/7aec729ad2c02183813f69459450afa052f2b681/src/types/index.ts) and the logic in [src/lib/index.ts](https://github.com/tylercurtispohl/fillout-test-api/blob/7aec729ad2c02183813f69459450afa052f2b681/src/lib/index.ts).

The logic goes as follows:

1. `getFilteredResponseBody` is called.
1. Get the `formId` and `filter` from the request query parameters.
2. Format the other query parameters so that they can be used in a `fetch` call.
   - Always set the limit and offset to the default values for the Fillout API endpoint so that we get all of the data from Fillout. The data will be filtered and paginated appropriately at the end.
4. Get the responses data from the Fillout API, looping through all pages of responses to get all of the data. This happens in the `getAllResponses` function.
5. Filter the responses according to the clauses in the `filter` query parameter. This happens in the `filterResponses` function.
7. Limit the responses to the number specified in the original `limit` query parameter and start at the offset according to the original `offset` parameter.
8. Return the filtered responses.
