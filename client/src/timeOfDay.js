// Classifies a 24-hour "HH:MM" time string into a time-of-day period.

export const PERIODS = [
  { key: 'morning', labelKey: 'morningMeds', defaultLabel: 'Morning', start: 5, end: 11, icon: '🌅' },
  { key: 'afternoon', labelKey: 'afternoonMeds', defaultLabel: 'Afternoon', start: 12, end: 16, icon: '☀️' },
  { key: 'evening', labelKey: 'eveningMeds', defaultLabel: 'Evening', start: 17, end: 20, icon: '🌇' },
  { key: 'night', labelKey: 'nightMeds', defaultLabel: 'Night', start: 21, end: 4, icon: '🌙' },
];

export function getPeriod(time) {
  if (!time) return PERIODS[0];
  const hour = parseInt(time.split(':')[0], 10);
  return (
    PERIODS.find((p) =>
      p.start <= p.end ? hour >= p.start && hour <= p.end : hour >= p.start || hour <= p.end
    ) || PERIODS[0]
  );
}

export function formatTime(time) {
  if (!time) return '';
  const [hStr, m] = time.split(':');
  let h = parseInt(hStr, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${suffix}`;
}
