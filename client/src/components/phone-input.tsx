import { useState, forwardRef } from 'react';
import { Input } from '@/components/ui/input';

interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value = '', onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState(value);

    const formatPhoneNumber = (input: string): string => {
      // Remove all non-digit characters
      const cleaned = input.replace(/\D/g, '');
      
      // Don't format if empty
      if (!cleaned) return '';
      
      // Format based on length
      if (cleaned.length <= 3) {
        return `(${cleaned}`;
      } else if (cleaned.length <= 6) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
      } else if (cleaned.length <= 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
      } else {
        // Handle 11 digit numbers (with country code)
        return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 11)}`;
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const formatted = formatPhoneNumber(inputValue);
      
      setDisplayValue(formatted);
      
      // Pass the formatted value to the parent
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: formatted,
          },
        };
        onChange(syntheticEvent);
      }
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="tel"
        value={displayValue}
        onChange={handleChange}
        placeholder="(555) 123-4567"
        maxLength={14} // Maximum length for formatted US phone number
      />
    );
  }
);

PhoneInput.displayName = 'PhoneInput';