// Save to localStorage
export function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Load from localStorage
export function load(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

// Remove item
export function remove(key) {
  localStorage.removeItem(key);
}
