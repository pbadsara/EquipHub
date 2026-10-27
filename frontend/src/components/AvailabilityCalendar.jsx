import { useMemo } from 'react';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Turns a list of { startDate, endDate } ranges into a Set of 'YYYY-MM-DD'
// strings, so checking "is this day booked?" is an O(1) lookup per cell.
function buildBookedSet(bookedRanges) {
  const set = new Set();
  bookedRanges.forEach(({ startDate, endDate }) => {
    const start = new Date(startDate);
    const end = new Date(endDate || startDate);
    const cursor = new Date(start);
    while (cursor <= end) {
      set.add(cursor.toISOString().slice(0, 10));
      cursor.setDate(cursor.getDate() + 1);
    }
  });
  return set;
}

function buildMonthGrid(year, month) {
  // month is 0-indexed (0 = January)
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  return cells;
}

// Shows the current month and next month side by side, greying out any
// date that's already booked (from bookedRanges) or already in the past.
export function AvailabilityCalendar({ bookedRanges = [] }) {
  const bookedSet = useMemo(() => buildBookedSet(bookedRanges), [bookedRanges]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const months = [0, 1].map((offset) => {
    const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  return (
    <div className="availability-calendar">
      {months.map(({ year, month }) => {
        const cells = buildMonthGrid(year, month);
        const label = new Date(year, month, 1).toLocaleDateString('en-AU', {
          month: 'long',
          year: 'numeric',
        });

        return (
          <div className="availability-calendar__month" key={`${year}-${month}`}>
            <h4>{label}</h4>
            <div className="availability-calendar__grid">
              {DAY_LABELS.map((d) => (
                <div key={d} className="availability-calendar__day-label">
                  {d}
                </div>
              ))}
              {cells.map((day, idx) => {
                if (day === null) return <div key={`empty-${idx}`} />;

                const cellDate = new Date(year, month, day);
                const iso = cellDate.toISOString().slice(0, 10);
                const isPast = cellDate < today;
                const isBooked = bookedSet.has(iso);

                const classes = ['availability-calendar__cell'];
                if (isPast) classes.push('availability-calendar__cell--past');
                else if (isBooked) classes.push('availability-calendar__cell--booked');
                else classes.push('availability-calendar__cell--free');

                return (
                  <div key={iso} className={classes.join(' ')}>
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="availability-calendar__legend">
        <span><i className="availability-calendar__swatch availability-calendar__swatch--free" /> Available</span>
        <span><i className="availability-calendar__swatch availability-calendar__swatch--booked" /> Booked</span>
      </div>
    </div>
  );
}