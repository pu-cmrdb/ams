/** biome-ignore-all lint/suspicious/noArrayIndexKey: there is no reorder and no id can be used for key */
import { PlusIcon, XIcon } from 'lucide-react';

import {
  Item,
  ItemActions,
  ItemContent,
  ItemFooter,
  ItemGroup,
} from '@/components/ui/item';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { AssetStatus } from '@/lib/enums';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type AssetRecord = {
  note: string;
  quantity: number;
  status: AssetStatus;
}[];

type AssetRecordEditorProps = Readonly<{
  value: AssetRecord;
  onChange: (value: AssetRecord) => void;
  disabled?: boolean;
}>;

export function AssetRecordEditor({
  value,
  onChange,
  disabled,
}: AssetRecordEditorProps) {
  const addRecord = () => {
    const newValue = Array.from(value);
    newValue.push({ note: '', quantity: 0, status: AssetStatus.Normal });
    onChange(newValue);
  };

  const removeRecord = (index: number) => {
    const newValue = Array.from(value);
    newValue.splice(index, 1);
    onChange(newValue);
  };

  const onStatusChange = (index: number, status: string) => {
    const newValue = Array.from(value);

    const item = newValue[index];
    if (!item) {
      return;
    }

    item.status = status as AssetStatus;
    onChange(newValue);
  };

  const onQuantityChange = (index: number, quantity: string) => {
    const newValue = Array.from(value);

    const item = newValue[index];
    if (!item) {
      return;
    }

    item.quantity = Number(quantity);
    onChange(newValue);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button onClick={addRecord}>
          <PlusIcon data-icon="inline-start" />
          <span>新增</span>
        </Button>
      </div>

      <ItemGroup>
        {value.map((record, index) => (
          <Item key={`asset-record-${index}`} variant="outline">
            <ItemContent className="space-y-4">
              <FieldGroup className="flex-row">
                <Field>
                  <FieldLabel htmlFor={`asset-record-${index}-status`}>
                    狀態
                  </FieldLabel>

                  <NativeSelect
                    onChange={(e) => onStatusChange(index, e.target.value)}
                    value={record.status}
                  >
                    <NativeSelectOption value={AssetStatus.Normal}>
                      正常
                    </NativeSelectOption>

                    <NativeSelectOption value={AssetStatus.Lost}>
                      遺失
                    </NativeSelectOption>

                    <NativeSelectOption value={AssetStatus.Repairing}>
                      維修中
                    </NativeSelectOption>

                    <NativeSelectOption value={AssetStatus.Scrapped}>
                      已報廢
                    </NativeSelectOption>
                  </NativeSelect>
                </Field>

                <Field>
                  <FieldLabel htmlFor={`asset-record-${index}-quantity`}>
                    數量
                  </FieldLabel>

                  <Input
                    id={`asset-record-${index}-quantity`}
                    min="1"
                    onChange={(e) => onQuantityChange(index, e.target.value)}
                    step="1"
                    type="number"
                    value={record.quantity}
                  />
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor={`asset-record-${index}-note`}>
                    備註
                  </FieldLabel>

                  <Textarea id={`asset-record-${index}-note`} />
                </Field>
              </FieldGroup>
            </ItemContent>

            <ItemFooter>
              <Button onClick={() => removeRecord(index)} variant="destructive">
                <XIcon />

                <span>移除</span>
              </Button>
            </ItemFooter>
          </Item>
        ))}
      </ItemGroup>
    </div>
  );
}
