import React from 'react';

export default function FilterDropdown({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1 w-full sm:w-48">
      {label && <label className="text-xs font-medium text-surface-500">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field py-2"
      >
        {options.map((opt, i) => (
          <option key={i} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
