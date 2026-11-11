"use strict";

window.loadDefenseData = (() => {
  const published = new URL("https://boiarchukserhii-svg.github.io/nubip-defenses/data.json");
  const latest = "https://raw.githubusercontent.com/boiarchukserhii-svg/nubip-defenses/main/data.json";

  async function read(url,signal) {
    const response = await fetch(url,{cache:"no-cache",signal});
    if (!response.ok) throw Error("Не вдалося отримати дані захистів.");
    const data = await response.json();
    if (!Array.isArray(data?.items)) throw Error("Некоректний формат даних захистів.");
    return data;
  }

  return async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(),4500);
    try {
      return await read(latest,controller.signal);
    } catch {
      return await read(published);
    } finally {
      clearTimeout(timeout);
    }
  };
})();
