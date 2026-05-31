import { Input } from "@/components/ui/input";

type Props = {
  valueDefault?: string;
  costDefault?: string;
  idPrefix?: string;
};

export function MoneyFields({ valueDefault = "", costDefault = "", idPrefix = "" }: Props) {
  const vId = `${idPrefix}coupon_value`;
  const cId = `${idPrefix}coupon_cost`;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor={vId}>
          שווי הקופון (₪)
        </label>
        <Input
          id={vId}
          name="coupon_value"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          placeholder="50"
          defaultValue={valueDefault}
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor={cId}>
          עלות (₪)
        </label>
        <Input
          id={cId}
          name="coupon_cost"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          placeholder="20"
          defaultValue={costDefault}
        />
      </div>
    </div>
  );
}
