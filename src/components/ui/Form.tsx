import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';

const baseInputClasses = 'w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-500 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 focus:border-indigo-500/50';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, className = '', id: externalId, ...props }, ref) => {
    const generatedId = useId();
    const id = externalId ?? generatedId;
    const hintId = hint ? `${id}-hint` : undefined;

    return (
      <div>
        {label && (
          <label htmlFor={id} className="block text-xs text-gray-400 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          aria-describedby={hintId}
          className={`${baseInputClasses} ${className}`}
          {...props}
        />
        {hint && (
          <p id={hintId} className="mt-1 text-xs text-gray-500">{hint}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, className = '', id: externalId, children, ...props }, ref) => {
    const generatedId = useId();
    const id = externalId ?? generatedId;

    return (
      <div>
        {label && (
          <label htmlFor={id} className="block text-xs text-gray-400 mb-1">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={`${baseInputClasses} ${className}`}
          {...props}
        >
          {children}
        </select>
      </div>
    );
  }
);
Select.displayName = 'Select';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, className = '', id: externalId, ...props }, ref) => {
    const generatedId = useId();
    const id = externalId ?? generatedId;
    const hintId = hint ? `${id}-hint` : undefined;

    return (
      <div>
        {label && (
          <label htmlFor={id} className="block text-xs text-gray-400 mb-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          aria-describedby={hintId}
          className={`${baseInputClasses} resize-none ${className}`}
          {...props}
        />
        {hint && (
          <p id={hintId} className="mt-1 text-xs text-gray-500">{hint}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
