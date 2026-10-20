import { useState } from 'react';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// `bookedRanges` dates come from the server as UTC-midnight ISO strings
// (a calendar day, not a moment in time). Reading the Y-M-D straight off
// the string and building a LOCAL midnight Date from it — rather than
// letting `new Date(iso)` convert that UTC instant into the browser's own
// timezone — is what keeps a booked day lined up with the matching grid
// cell (also local midnight) no matter where the browser is.
function toDateOnly(input) {
  if (typeof input === 'string') {
    const [y, m, d] = input.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const copy = new Date(input);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isWithin(date, start, end) {
  return date >= start && date <= end;
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart <= bEnd && bStart <= aEnd;
}

// A minimal month-view calendar for picking a rental date range (both ends
// inclusive — the item is out for the whole of each selected day). Days
// already covered by another renter's booking are shown greyed out and
// can't be clicked; a range that would touch one of those days is rejected
// so the same days can never be double-booked.
function RentalCalendar({ bookedRanges, range, onChange }) {
  const today = toDateOnly(new Date());
  const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const booked = bookedRanges.map((r) => ({
    start: toDateOnly(r.startDate),
    end: toDateOnly(r.endDate)
  }));

  const isBooked = (date) => booked.some((r) => isWithin(date, r.start, r.end));
  const isPast = (date) => date < today;

  const handleDayClick = (date) => {
    if (isPast(date) || isBooked(date)) return;

    if (!range.start || range.end) {
      onChange({ start: date, end: null, error: null });
      return;
    }

    const start = date < range.start ? date : range.start;
    const end = date < range.start ? range.start : date;

    const touchesBooked = booked.some((r) => rangesOverlap(start, end, r.start, r.end));
    if (touchesBooked) {
      // Keep the original start selected so the buyer can just try a
      // different end date instead of starting the whole pick over.
      onChange({ start: range.start, end: null, error: 'That range crosses days already booked — pick a different end date.' });
      return;
    }

    onChange({ start, end, error: null });
  };

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  return (
    <div className="rental-calendar">
      <div className="rental-calendar-header">
        <button type="button" onClick={() => setViewMonth(new Date(year, month - 1, 1))} aria-label="Previous month">
          ‹
        </button>
        <strong>{viewMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</strong>
        <button type="button" onClick={() => setViewMonth(new Date(year, month + 1, 1))} aria-label="Next month">
          ›
        </button>
      </div>

      <div className="rental-calendar-grid rental-calendar-weekdays">
        {WEEKDAY_LABELS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className="rental-calendar-grid">
        {cells.map((date, i) => {
          if (!date) return <span key={`blank-${i}`} />;

          const past = isPast(date);
          const dayBooked = isBooked(date);
          const selected = range.start && (
            (range.end && isWithin(date, range.start, range.end)) || (!range.end && isSameDay(date, range.start))
          );

          const classNames = ['rental-day'];
          if (past || dayBooked) classNames.push('rental-day-disabled');
          if (dayBooked) classNames.push('rental-day-booked');
          if (selected) classNames.push('rental-day-selected');

          return (
            <button
              type="button"
              key={date.toISOString()}
              className={classNames.join(' ')}
              disabled={past || dayBooked}
              onClick={() => handleDayClick(date)}
              title={dayBooked ? 'Already booked' : undefined}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <div className="rental-legend">
        <span className="rental-legend-dot rental-legend-dot-booked" /> Booked
        <span className="rental-legend-dot rental-legend-dot-selected" /> Selected
      </div>
    </div>
  );
}

export default RentalCalendar;
