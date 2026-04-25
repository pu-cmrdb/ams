import { configure, type as arktype } from 'arktype';

configure({
  exactOptionalPropertyTypes: false,
});

export const type = arktype;
