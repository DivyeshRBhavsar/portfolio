'use client';

import { contactCharCount, contactOptional, contactSelectPlaceholder } from '@/components/character/luffyLines';
import { fill } from '@/components/character/speech';
import { domId, errorId, type FieldType, type Option, type OptionGroup } from './rules';

export const inputClass =
  'w-full rounded-lg border-2 border-ink-muted bg-surface px-4 py-2.5 text-ink placeholder:text-ink-muted focus-visible:border-ink aria-[invalid=true]:border-red-deep';
const labelClass = 'mb-1.5 block font-mono text-sm text-ink';
const chipClass =
  'min-h-11 rounded-full border-2 border-ink px-4 py-2 text-sm font-medium transition-colors hover:bg-sun hover:text-on-sun';

export type ControlProps = {
  /** The error key ("name", "fields.company"…): sets the control's id and its error's id. */
  errorKey: string;
  label: string;
  type: FieldType | 'email';
  value: string;
  onChange: (value: string) => void;
  required: boolean;
  error?: string;
  placeholder?: string;
  maxLength?: number;
  /** Shows "12 / 2000" under textareas when given. */
  showCount?: boolean;
  options?: Option[];
  groups?: OptionGroup[];
  /** Chips: called after a chip is picked (the chat moves on). */
  onPick?: (value: string) => void;
  /** Text inputs: Enter (the chat's "Next"). */
  onEnter?: () => void;
  autoComplete?: string;
  /** Hide the visible label (the chat asks the question in Luffy's bubble instead). */
  labelHidden?: boolean;
};

/**
 * One labelled control of any type: text, email, url, textarea, select (optionally
 * grouped) or chips (a fieldset of toggle buttons; only an optional one can be cleared).
 * Its error sits right under it, linked with aria-describedby and aria-invalid.
 */
export default function FieldControl(props: ControlProps) {
  const { errorKey, label, type, value, onChange, required, error, placeholder, maxLength, options = [], groups } = props;
  const id = domId(errorKey);
  const errId = errorId(errorKey);
  const described = error ? errId : undefined;
  const labelText = (
    <>
      {label}
      {!required && <span className="text-ink-muted"> {contactOptional}</span>}
    </>
  );
  const errorLine = error && (
    <p id={errId} className="mt-1.5 text-sm font-medium text-red-deep">
      {error}
    </p>
  );

  if (type === 'chips') {
    return (
      <fieldset id={id} aria-describedby={described} aria-invalid={!!error || undefined}>
        <legend className={props.labelHidden ? 'sr-only' : labelClass}>{labelText}</legend>
        <div className="flex flex-wrap gap-2">
          {options.map((o, i) => {
            const on = value === o.value;
            return (
              <button
                key={o.value}
                type="button"
                aria-pressed={on}
                tabIndex={on || (!value && i === 0) ? 0 : undefined}
                onClick={() => {
                  const next = on && !required ? '' : o.value;
                  onChange(next);
                  if (next) props.onPick?.(next);
                }}
                className={`${chipClass} ${on ? 'bg-sun text-on-sun shadow-sticker' : 'bg-surface text-ink'}`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
        {errorLine}
      </fieldset>
    );
  }

  const common = {
    id,
    value,
    required,
    'aria-invalid': !!error || undefined,
    'aria-describedby': described,
    className: inputClass,
  };

  let control: React.ReactNode;
  if (type === 'select') {
    control = (
      <select {...common} onChange={(e) => onChange(e.target.value)}>
        <option value="">{contactSelectPlaceholder}</option>
        {groups
          ? groups.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
            ))
          : options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
      </select>
    );
  } else if (type === 'textarea') {
    control = (
      <textarea
        {...common}
        rows={5}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  } else {
    control = (
      <input
        {...common}
        type={type === 'url' ? 'url' : type === 'email' ? 'email' : 'text'}
        inputMode={type === 'url' ? 'url' : type === 'email' ? 'email' : undefined}
        autoComplete={props.autoComplete}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && props.onEnter) {
            e.preventDefault();
            props.onEnter();
          }
        }}
      />
    );
  }

  return (
    <div>
      <label htmlFor={id} className={props.labelHidden ? 'sr-only' : labelClass}>
        {labelText}
      </label>
      {control}
      {props.showCount && maxLength && (
        <p aria-hidden="true" className="mt-1 text-right font-mono text-xs text-ink-muted">
          {fill(contactCharCount, { n: String(value.length), total: String(maxLength) })}
        </p>
      )}
      {errorLine}
    </div>
  );
}
