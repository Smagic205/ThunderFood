import React from 'react';
import { Calendar, X } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onClear?: () => void;
  ariaLabel?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear,
  ariaLabel = 'Lọc theo khoảng thời gian',
}) => {
  const hasValue = Boolean(startDate || endDate);
  const isInvalid = Boolean(startDate && endDate && startDate > endDate);

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onStartDateChange('');
      onEndDateChange('');
    }
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px' }}>
      <div
        role="group"
        aria-label={ariaLabel}
        style={{
          display: 'inline-flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '8px',
          minHeight: '44px',
          padding: '4px 14px',
          borderRadius: '999px',
          background: 'var(--surface-2)',
          border: `1.5px solid ${isInvalid ? 'var(--c-red)' : 'var(--line)'}`,
        }}
      >
        <Calendar size={15} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--ink-2)', fontWeight: 500 }}>
          <span>Từ</span>
          <input
            type="date"
            aria-label="Từ ngày"
            value={startDate}
            max={endDate || undefined}
            onChange={(e) => onStartDateChange(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--ink)',
              font: 'inherit',
              fontSize: '13.5px',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer',
            }}
          />
        </label>
        <span style={{ color: 'var(--ink-3)', fontSize: '13px' }}>–</span>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--ink-2)', fontWeight: 500 }}>
          <span>Đến</span>
          <input
            type="date"
            aria-label="Đến ngày"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => onEndDateChange(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--ink)',
              font: 'inherit',
              fontSize: '13.5px',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer',
            }}
          />
        </label>
        {hasValue && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Xóa lọc ngày"
            title="Xóa lọc ngày"
            style={{
              display: 'inline-grid',
              placeItems: 'center',
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: 'var(--surface)',
              color: 'var(--ink-2)',
              border: '1px solid var(--line)',
              cursor: 'pointer',
            }}
          >
            <X size={13} />
          </button>
        )}
      </div>
      {isInvalid && (
        <span role="alert" style={{ fontSize: '12px', color: 'var(--c-red)', paddingLeft: '10px' }}>
          Ngày bắt đầu không được lớn hơn ngày kết thúc.
        </span>
      )}
    </div>
  );
};
