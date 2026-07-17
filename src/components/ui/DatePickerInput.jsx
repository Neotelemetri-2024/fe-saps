import React from 'react'
import DatePicker from 'react-datepicker'
import { Calendar } from 'lucide-react'
import 'react-datepicker/dist/react-datepicker.css'
import './DatePickerInput.css'

function DatePickerInput({ value, onChange, label, required = false, placeholder = 'Pilih tanggal', errorMessage }) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-black">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative mt-1">
        <DatePicker
          selected={value}
          onChange={onChange}
          dateFormat="dd/MM/yyyy"
          placeholderText={placeholder}
          className="block w-full rounded-md border border-[#e9ebf8] p-3 pl-10 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
          wrapperClassName="w-full"
          popperPlacement="bottom-start"
          showPopperArrow={false}
          required={required}
        />
        <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#616161]" />
      </div>
      {errorMessage && <p className="mt-1 text-xs text-red-500">{errorMessage}</p>}
    </div>
  )
}

export default DatePickerInput
