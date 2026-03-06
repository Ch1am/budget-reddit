function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 0) return "just now";

    const MINUTE = 60;
    const HOUR = 3600;
    const DAY = 86400;
    const MONTH = 2592000;
    const YEAR = 31536000; 

    if (seconds < 30) {
        return "a few seconds ago";
    } else if (seconds < MINUTE) {
        return `${seconds} seconds ago`;
    } else if (seconds < HOUR) {
        const mins = Math.floor(seconds / MINUTE);
        return `${mins} min${mins !== 1 ? 's' : ''} ago`;
    } else if (seconds < DAY) {
        const hours = Math.floor(seconds / HOUR);
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (seconds < MONTH) {
        const days = Math.floor(seconds / DAY);
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else if (seconds < YEAR) {
        const months = Math.floor(seconds / MONTH);
        return `${months} month${months !== 1 ? 's' : ''} ago`;
    } else {
        const years = Math.floor(seconds / YEAR);
        return `${years} year${years !== 1 ? 's' : ''} ago`;
    }
}

module.exports = timeAgo;