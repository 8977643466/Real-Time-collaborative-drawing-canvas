const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#96CEB4'
];

const ADJECTIVES = [
  'Happy', 'Clever', 'Brave', 'Swift', 'Gentle',
  'Bright', 'Bold', 'Calm', 'Eager', 'Fancy'
];

const NOUNS = [
  'Panda', 'Tiger', 'Eagle', 'Dolphin', 'Fox',
  'Wolf', 'Bear', 'Hawk', 'Lion', 'Owl'
];

function generateUserColor() {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
}

function generateUsername() {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const number = Math.floor(Math.random() * 100);
  return `${adjective}${noun}${number}`;
}

function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = {
  generateUserColor,
  generateUsername,
  generateId
};
