'use client';

import * as React from 'react';
import { Controller, FormProvider } from 'react-hook-form';
import type { ControllerProps, FieldPath, FieldValues } from 'react-hook-form';

export const Form = FormProvider;

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: ControllerProps<TFieldValues, TName>) {
  return <Controller {...props} />;
}
