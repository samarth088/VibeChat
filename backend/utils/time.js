const formatTime = (date) => {
  const d = new Date(date);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
};

const getTimestamp = () => {
  return new Date();
};

module.exports = {
  formatTime,
  getTimestamp
};
