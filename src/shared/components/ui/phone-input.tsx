import React, { useState, useEffect } from 'react';
import { Input } from './input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { AsYouType, parsePhoneNumberFromString } from 'libphonenumber-js';

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
}

const COUNTRIES = [
  { code: '+20', iso: 'eg', name: 'Egypt' },
  { code: '+966', iso: 'sa', name: 'Saudi Arabia' },
  { code: '+971', iso: 'ae', name: 'UAE' },
  { code: '+1', iso: 'us', name: 'USA/Canada' },
  { code: '+44', iso: 'gb', name: 'UK' },
  { code: '+965', iso: 'kw', name: 'Kuwait' },
  { code: '+974', iso: 'qa', name: 'Qatar' },
  { code: '+968', iso: 'om', name: 'Oman' },
  { code: '+973', iso: 'bh', name: 'Bahrain' },
  { code: '+49', iso: 'de', name: 'Germany' },
  { code: '+33', iso: 'fr', name: 'France' },
];

export function PhoneInput({ value = '', onChange, className, ...props }: PhoneInputProps) {
  const [countryCode, setCountryCode] = useState('+20');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Initialize state based on value
  useEffect(() => {
    if (value) {
      // Find longest matching country code (e.g. +966 vs +9)
      const sortedCountries = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);
      const match = sortedCountries.find(c => value.startsWith(c.code));
      if (match) {
        setCountryCode(match.code);
        
        // Format the initial number using AsYouType
        const rawNum = value.slice(match.code.length).trim();
        const formatter = new AsYouType(match.iso.toUpperCase() as any);
        setPhoneNumber(formatter.input(rawNum));
      } else {
        setPhoneNumber(value);
      }
    }
  }, []); // Only on mount

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawNumber = e.target.value.replace(/[^\d]/g, '');
    const currentIso = COUNTRIES.find(c => c.code === countryCode)?.iso.toUpperCase() as any;
    
    const formatter = new AsYouType(currentIso);
    const formatted = formatter.input(rawNumber);
    
    setPhoneNumber(formatted);
    onChange?.(`${countryCode}${rawNumber}`);
  };

  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    const rawNumber = phoneNumber.replace(/[^\d]/g, '');
    onChange?.(`${code}${rawNumber}`);
    
    // Reformat based on new country code
    const newIso = COUNTRIES.find(c => c.code === code)?.iso.toUpperCase() as any;
    const formatter = new AsYouType(newIso);
    setPhoneNumber(formatter.input(rawNumber));
  };

  const currentCountry = COUNTRIES.find(c => c.code === countryCode);

  return (
    <div className={`flex gap-2 ${className || ''}`}>
      <Select value={countryCode} onValueChange={handleCountryChange}>
        <SelectTrigger className="w-[130px] px-3 h-14 bg-app border border-panel-hover rounded-xl text-content shadow-inner flex items-center gap-2">
          <SelectValue placeholder="Code" />
        </SelectTrigger>
        <SelectContent className="bg-panel border-panel-hover z-50">
          {COUNTRIES.map((country) => (
            <SelectItem key={country.code} value={country.code} className="hover:bg-panel-hover focus:bg-panel-hover cursor-pointer text-content flex items-center gap-2">
              <div className="flex items-center gap-2">
                <img src={`https://flagcdn.com/w20/${country.iso}.png`} alt={country.iso} className="w-5 shrink-0 h-auto rounded-sm object-cover" />
                <span className="font-medium">{country.code}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        {...props}
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneChange}
        className="flex-1 h-14 bg-app border border-panel-hover rounded-xl text-content px-4 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-base shadow-inner"
        placeholder="Phone number"
      />
    </div>
  );
}
