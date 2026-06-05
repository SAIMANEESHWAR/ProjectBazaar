import React, { useRef } from 'react';

type VerificationCodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  idPrefix?: string;
};

const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  value,
  onChange,
  disabled = false,
  idPrefix = 'verify-code',
}) => {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: 6 }, (_, index) => value[index] ?? '');

  const updateAtIndex = (index: number, nextChar: string) => {
    const clean = nextChar.replace(/\D/g, '').slice(-1);
    const chars = digits.slice();
    chars[index] = clean;
    const nextValue = chars.join('').slice(0, 6);
    onChange(nextValue);
    if (clean && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, 5);
    inputsRef.current[focusIndex]?.focus();
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {digits.map((digit, index) => (
        <input
          key={`${idPrefix}-${index}`}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          id={`${idPrefix}-${index}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(event) => updateAtIndex(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          aria-label={`Verification digit ${index + 1}`}
          className="h-12 w-10 sm:h-14 sm:w-12 rounded-xl border border-orange-200 bg-white text-center text-lg sm:text-xl font-bold text-gray-900 shadow-sm transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:opacity-60"
        />
      ))}
    </div>
  );
};

export default VerificationCodeInput;
