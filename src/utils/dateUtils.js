/**
 * Formats a date object into a human-readable string
 * @param {Date} date - The date to format
 * @param {boolean} includeDay - Whether to include the day of week
 * @returns {string} Formatted date string
 */
export const formatDate = (date, includeDay = true) => {
  if (!date) return '';
  
  const options = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  };
  
  if (includeDay) {
    options.weekday = 'short';
  }
  
  return new Intl.DateTimeFormat('en-US', options).format(date);
};

/**
 * Formats a date specifically for display in the dashboard header
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string for display
 */
export const formatDisplayDate = (date) => {
  if (!date) return '';
  
  if (isToday(date)) {
    return 'Today';
  }
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()) {
    return 'Yesterday';
  }
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear()) {
    return 'Tomorrow';
  }
  
  // For other dates, use a more detailed format
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  }).format(date);
};

/**
 * Checks if a date is today
 * @param {Date} date - The date to check
 * @returns {boolean} True if the date is today
 */
export const isToday = (date) => {
  if (!date) return false;
  
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

/**
 * Returns ISO date string (YYYY-MM-DD) from a Date object
 * @param {Date} date - The date to convert
 * @returns {string} ISO date string
 */
export const toISODateString = (date) => {
  if (!date) return '';
  return date.toISOString().split('T')[0];
};

/**
 * Returns a date object for the previous day
 * @param {Date} date - The reference date
 * @returns {Date} The previous day
 */
export const getPreviousDay = (date) => {
  const newDate = new Date(date);
  newDate.setDate(date.getDate() - 1);
  return newDate;
};

/**
 * Returns a date object for the next day
 * @param {Date} date - The reference date
 * @returns {Date} The next day
 */
export const getNextDay = (date) => {
  const newDate = new Date(date);
  newDate.setDate(date.getDate() + 1);
  return newDate;
};

/**
 * Formats the date for display in the diary
 * @param {Date} date - The date to format
 * @returns {string} Formatted date for diary display
 */
export const formatDiaryDate = (date) => {
  if (isToday(date)) {
    return 'Today';
  }
  
  return formatDate(date);
};

/**
 * Returns a new Date object set to today at midnight (00:00:00)
 * @returns {Date} Today at midnight
 */
export const getTodayAtMidnight = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}; 