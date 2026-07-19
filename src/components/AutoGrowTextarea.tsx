'use client';

import { useRef, useEffect } from 'react';

interface BaseProps {
  name?: string;
  placeholder?: string;
  minRows?: number;
  required?: boolean;
  className?: string;
}

interface UncontrolledProps extends BaseProps {
  defaultValue?: string;
  value?: undefined;
  onChange?: undefined;
}

interface ControlledProps extends BaseProps {
  value: string;
  onChange: (v: string) => void;
  defaultValue?: undefined;
}

type Props = UncontrolledProps | ControlledProps;

export default function AutoGrowTextarea(props: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const isControlled = 'value' in props && props.value !== undefined;

  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  };

  useEffect(() => {
    resize();
  });

  const baseClass =
    'w-full px-3 py-2 border border-stone-300 rounded-md bg-white font-serif text-base leading-relaxed resize-none overflow-hidden';
  const className = props.className ?? baseClass;

  if (isControlled) {
    const p = props as ControlledProps;
    return (
      <textarea
        ref={ref}
        name={p.name}
        value={p.value}
        onChange={(e) => {
          p.onChange(e.target.value);
          resize();
        }}
        rows={p.minRows ?? 3}
        required={p.required}
        placeholder={p.placeholder}
        className={className}
      />
    );
  }

  const p = props as UncontrolledProps;
  return (
    <textarea
      ref={ref}
      name={p.name}
      defaultValue={p.defaultValue}
      onInput={resize}
      rows={p.minRows ?? 3}
      required={p.required}
      placeholder={p.placeholder}
      className={className}
    />
  );
}
