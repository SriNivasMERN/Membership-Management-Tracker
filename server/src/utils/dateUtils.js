import dayjs from 'dayjs';

export function todayStart() {
  return dayjs().startOf('day').toDate();
}

export function startOfMonth(date = new Date()) {
  return dayjs(date).startOf('month').toDate();
}

export function endOfMonth(date = new Date()) {
  return dayjs(date).endOf('month').toDate();
}

export function startOfYear(date = new Date()) {
  return dayjs(date).startOf('year').toDate();
}

export function endOfYear(date = new Date()) {
  return dayjs(date).endOf('year').toDate();
}

export function startOfQuarter(date = new Date()) {
  const d = dayjs(date);
  const quarter = d.quarter ? d.quarter() : Math.floor(d.month() / 3) + 1;
  const firstMonth = (quarter - 1) * 3;
  return d.month(firstMonth).startOf('month').toDate();
}

export function endOfQuarter(date = new Date()) {
  const d = dayjs(date);
  const quarter = d.quarter ? d.quarter() : Math.floor(d.month() / 3) + 1;
  const lastMonth = quarter * 3 - 1;
  return d.month(lastMonth).endOf('month').toDate();
}

export function addMonths(date, months) {
  return dayjs(date).add(months, 'month').toDate();
}

export function formatYearMonth(date) {
  return dayjs(date).format('YYYY-MM');
}

export function labelYearMonth(date) {
  return dayjs(date).format('MMM YYYY');
}

