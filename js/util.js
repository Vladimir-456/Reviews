function getRelativeTime(timestamp) {
    const now = new Date();
    const diff = now - timestamp; // разница в миллисекундах
  
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
    if (seconds < 60) {
      return 'Только что';
    } else if (minutes < 60) {
      return `${minutes} мин. назад`;
    } else if (hours < 24) {
      return `${hours} ч. назад`;
    } else {
      return `${days} дн. назад`;
    }
  }

module.exports = { getRelativeTime };