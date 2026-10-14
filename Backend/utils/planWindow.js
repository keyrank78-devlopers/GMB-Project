const DAY_MS = 24 * 60 * 60 * 1000;
const EXPIRING_DAYS = 7;

const durationDaysOf = (plan) => {
    const days = Number(plan?.durationDays);
    return Number.isInteger(days) && days > 0 ? days : 30;
};

const planWindow = (plan, startsAt = new Date()) => {
    const start = new Date(startsAt);
    return {
        startsAt: start,
        endsAt: new Date(start.getTime() + durationDaysOf(plan) * DAY_MS),
    };
};

const dayStamp = (date) => Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

const planTiming = (endsAt, now = new Date()) => {
    if (!endsAt) return { expired: false, expiring: false };
    const daysLeft = (dayStamp(new Date(endsAt)) - dayStamp(now)) / DAY_MS;
    return {
        expired: daysLeft < 0,
        expiring: daysLeft >= 0 && daysLeft <= EXPIRING_DAYS,
    };
};

const parsePlanDate = (value, endOfDay) => {
    if (!value) return null;
    const text = String(value).trim();
    const date = /^\d{4}-\d{2}-\d{2}$/.test(text)
        ? new Date(`${text}T00:00:00.000Z`)
        : new Date(text);
    if (Number.isNaN(date.getTime())) return null;
    if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(text)) {
        date.setUTCHours(23, 59, 59, 999);
    }
    return date;
};

module.exports = { EXPIRING_DAYS, DAY_MS, durationDaysOf, planWindow, parsePlanDate, planTiming };
