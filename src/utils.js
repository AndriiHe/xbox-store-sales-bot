const chunks = (arr, size) => {
  const chunks = [];
  const items = [...arr];

  while (items.length) {
    chunks.push(items.splice(0, size));
  }

  return chunks;
};

const tryParse = (data) => {
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
};

module.exports = {
  chunks,
  tryParse,
};
