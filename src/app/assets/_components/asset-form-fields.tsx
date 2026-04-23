'use client';

import { AlertCircleIcon, ChevronDownIcon, LoaderCircleIcon } from 'lucide-react';

import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AssetStatus, BorrowRule, OwnershipType } from '@/lib/enums';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormField } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { statusOptions } from './asset-form-utils';

import type React from 'react';
import type { UseFormReturn } from 'react-hook-form';

import type { AssetFormValues } from './asset-form-utils';

interface AssetFormFieldsProps {
  categories: { id: string; name: string }[];
  categoriesLoading: boolean;
  form: UseFormReturn<AssetFormValues>;
  isSubmitting: boolean;
  mode: 'create' | 'edit';
  onCancel: () => void;
  onSubmit: NonNullable<React.ComponentProps<'form'>['onSubmit']>;
  submitError: null | string;
  users: { displayUsername: null | string; id: string; username: string }[];
  usersLoading: boolean;
}

export function AssetFormFields({
  categories,
  categoriesLoading,
  form,
  isSubmitting,
  mode,
  onCancel,
  onSubmit,
  submitError,
  users,
  usersLoading,
}: AssetFormFieldsProps) {
  const ownershipType = form.watch('ownershipType');
  const borrowRule = form.watch('borrowRule');
  const authorizedLenderIds = form.watch('authorizedLenderIds');

  const pageTitle = mode === 'create' ? '新增財產' : '編輯財產';
  const actionText = mode === 'create' ? '登記財產' : '儲存修改';
  const selectedLenderLabels = authorizedLenderIds.map((id) => {
    const user = users.find((item) => item.id === id);
    return user?.displayUsername ?? user?.username ?? id;
  });

  return (
    <Form {...form}>
      <form className="grid gap-4" onSubmit={onSubmit}>
        {submitError && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>{mode === 'create' ? '登記財產失敗' : '修改財產失敗'}</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-2">
          <h1 className="text-lg font-semibold">{pageTitle}</h1>
          <p className="text-sm text-muted-foreground">填寫完整資料後即可送出。</p>
        </div>

        <FieldGroup>
          <FormField
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="name">名稱</FieldLabel>
                <FieldContent>
                  <Input id="name" placeholder="例如：投影機" {...field} />
                  <FieldError errors={[fieldState.error]} />
                </FieldContent>
              </Field>
            )}
            rules={{ required: '請輸入財產名稱' }}
          />

          <div className="
            grid gap-2
            sm:grid-cols-2
          "
          >
            <FormField
              control={form.control}
              name="quantity"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="quantity">數量</FieldLabel>
                  <FieldContent>
                    <Input
                      id="quantity"
                      min={1}
                      onBlur={field.onBlur}
                      onChange={(event) => {
                        field.onChange(Number(event.target.value));
                      }}
                      type="number"
                      value={field.value}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </FieldContent>
                </Field>
              )}
              rules={{ required: '請輸入數量' }}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>狀態</FieldLabel>
                  <FieldContent>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value as AssetStatus);
                      }}
                      value={field.value}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="請選擇狀態" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </FieldContent>
                </Field>
              )}
            />
          </div>

          <div className="
            grid gap-2
            sm:grid-cols-2
          "
          >
            <FormField
              control={form.control}
              name="location"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="location">位置</FieldLabel>
                  <FieldContent>
                    <Input id="location" placeholder="例如：鐵櫃" {...field} />
                    <FieldError errors={[fieldState.error]} />
                  </FieldContent>
                </Field>
              )}
              rules={{ required: '請輸入存放位置' }}
            />

            <FormField
              control={form.control}
              name="custodian"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="custodian">保管單位</FieldLabel>
                  <FieldContent>
                    <Input id="custodian" placeholder="例如：主機組" {...field} />
                    <FieldError errors={[fieldState.error]} />
                  </FieldContent>
                </Field>
              )}
              rules={{ required: '請輸入保管單位' }}
            />
          </div>

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>類別</FieldLabel>
                <FieldContent>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={categoriesLoading ? '載入類別中...' : '請選擇類別'} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[fieldState.error]} />
                </FieldContent>
              </Field>
            )}
          />

          <div className="
            grid gap-2
            sm:grid-cols-2
          "
          >
            <FormField
              control={form.control}
              name="ownershipType"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>歸屬單位</FieldLabel>
                  <FieldContent>
                    <Select
                      onValueChange={(value) => {
                        const nextOwnershipType = value as OwnershipType;

                        if (field.value === OwnershipType.School && nextOwnershipType !== OwnershipType.School) {
                          form.setValue('schoolAssetNumber', '');
                          form.clearErrors('schoolAssetNumber');
                        }

                        field.onChange(nextOwnershipType);
                      }}
                      value={field.value}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="請選擇歸屬單位" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={OwnershipType.Cmrdb}>社團自購</SelectItem>
                        <SelectItem value={OwnershipType.School}>學校列管</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </FieldContent>
                </Field>
              )}
            />

            {ownershipType === OwnershipType.School && (
              <FormField
                control={form.control}
                name="schoolAssetNumber"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="schoolAssetNumber">學校產編</FieldLabel>
                    <FieldContent>
                      <Input id="schoolAssetNumber" placeholder="例如：31404032010D0132" {...field} />
                      <FieldError errors={[fieldState.error]} />
                    </FieldContent>
                  </Field>
                )}
                rules={{
                  validate: (value) => {
                    return Boolean(value.trim()) || '學校列管財產必填學校產編';
                  },
                }}
              />
            )}
          </div>

          <FormField
            control={form.control}
            name="borrowRule"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>借用權限</FieldLabel>
                <FieldContent>
                  <Select
                    onValueChange={(value) => {
                      const nextBorrowRule = value as BorrowRule;

                      if (field.value === BorrowRule.Restricted && nextBorrowRule !== BorrowRule.Restricted) {
                        form.setValue('authorizedLenderIds', []);
                        form.clearErrors('authorizedLenderIds');
                      }

                      field.onChange(nextBorrowRule);
                    }}
                    value={field.value}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="請選擇借用權限" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={BorrowRule.Public}>公開借用</SelectItem>
                      <SelectItem value={BorrowRule.Restricted}>限制借用</SelectItem>
                      <SelectItem value={BorrowRule.None}>不可借用</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError errors={[fieldState.error]} />
                </FieldContent>
              </Field>
            )}
          />

          {borrowRule === BorrowRule.Restricted && (
            <FormField
              control={form.control}
              name="authorizedLenderIds"
              render={({ fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>授權名單</FieldLabel>
                  <FieldContent>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button className="w-full justify-between" type="button" variant="outline">
                          {selectedLenderLabels.length > 0
                            ? `已選擇 ${selectedLenderLabels.length} 位人員`
                            : '請選擇授權人員'}
                          <ChevronDownIcon className="size-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-80">
                        <div className="max-h-60 space-y-2 overflow-y-auto">
                          {usersLoading && (
                            <p className="text-sm text-muted-foreground">
                              載入人員中...
                            </p>
                          )}
                          {users.map((user) => {
                            const checked = authorizedLenderIds.includes(user.id);
                            const displayName = user.displayUsername ?? user.username;

                            return (
                              <label className="flex items-center gap-2 text-sm" key={user.id}>
                                <Checkbox
                                  aria-label={`授權 ${displayName}`}
                                  checked={checked}
                                  onCheckedChange={() => {
                                    const current = form.getValues('authorizedLenderIds');
                                    const next = current.includes(user.id)
                                      ? current.filter((currentId) => currentId !== user.id)
                                      : [...current, user.id];

                                    form.setValue('authorizedLenderIds', next, {
                                      shouldValidate: true,
                                    });
                                  }}
                                />
                                <span>{displayName}</span>
                              </label>
                            );
                          })}
                          {!usersLoading && users.length === 0 && (
                            <p className="text-sm text-muted-foreground">目前沒有可選的使用者</p>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                    {selectedLenderLabels.length > 0 && (
                      <p className="text-xs text-muted-foreground">{selectedLenderLabels.join('、')}</p>
                    )}
                    <FieldError errors={[fieldState.error]} />
                  </FieldContent>
                </Field>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="purchaseDate"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="purchaseDate">購置日期</FieldLabel>
                <FieldContent>
                  <Input id="purchaseDate" type="date" {...field} />
                  <FieldError errors={[fieldState.error]} />
                </FieldContent>
              </Field>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="description">補充說明</FieldLabel>
                <FieldContent>
                  <Textarea id="description" placeholder="可填寫資產來源、備註等資訊" {...field} />
                  <FieldError errors={[fieldState.error]} />
                </FieldContent>
              </Field>
            )}
          />
        </FieldGroup>

        <div className="flex justify-end gap-2">
          <Button onClick={onCancel} type="button" variant="outline">取消</Button>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting
              ? (
                  <>
                    <LoaderCircleIcon className="size-4 animate-spin" />
                    處理中...
                  </>
                )
              : actionText}
          </Button>
        </div>
      </form>
    </Form>
  );
}
