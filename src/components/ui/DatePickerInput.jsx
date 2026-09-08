import DatePicker from 'react-datepicker'
import { Calendar } from 'lucide-react'
import 'react-datepicker/dist/react-datepicker.css'
import './DatePickerInput.css'

function DatePickerInput({
  value,
  onChange,
  label,
  required = false,
  placeholder = 'Pilih tanggal',
  errorMessage,
  minDate,
  maxDate,
  ...props
}) {
  return (
    <fieldset className="fieldset p-0">
      {label && (
        <legend className="fieldset-legend py-1 text-sm font-medium text-base-content">
          {label}
          {required && <span className="text-error"> *</span>}
        </legend>
      )}
      <div className="relative">
        <DatePicker
          selected={value}
          onChange={onChange}
          dateFormat="dd/MM/yyyy"
          placeholderText={placeholder}
          className="input w-full pl-10"
          wrapperClassName="w-full"
          popperPlacement="bottom-start"
          showPopperArrow={false}
          required={required}
          minDate={minDate}
          maxDate={maxDate}
          {...props}
        />
        <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/50" />
      </div>
      {errorMessage && <p className="mt-1 text-xs text-error">{errorMessage}</p>}
    </fieldset>
  )
}

export default DatePickerInput
