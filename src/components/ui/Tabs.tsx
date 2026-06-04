import { cn } from "../../lib/utils";

export function Tabs<T extends string>({ items, value, onChange }: { items: readonly T[]; value: T; onChange: (value: T) => void }) {
  return (
    <div className="segmented">
      {items.map((item) => (
        <button
          key={item}
          className={cn(value === item && "is-active")}
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
