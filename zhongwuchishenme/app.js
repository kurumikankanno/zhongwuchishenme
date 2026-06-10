(function () {
  "use strict";

  const STORAGE = {
    custom: "zwcs-custom-items-v1",
    disliked: "zwcs-disliked-items-v1",
    penalty: "zwcs-penalty-v1"
  };

  const PENALTY_ROUNDS = 8;
  const PENALTY_WEIGHT = 0.45;

  const DEFAULT_ITEMS = [
    "黄焖鸡米饭",
    "盖浇饭",
    "卤肉饭",
    "烧腊饭",
    "咖喱饭",
    "酸菜鱼",
    "水煮肉片",
    "麻婆豆腐",
    "家常炒菜",
    "兰州牛肉面",
    "重庆小面",
    "热干面",
    "炸酱面",
    "拌面",
    "炒面",
    "炒河粉",
    "桂林米粉",
    "螺蛳粉",
    "酸辣粉",
    "过桥米线",
    "麻辣烫",
    "冒菜",
    "麻辣香锅",
    "钵钵鸡",
    "串串香",
    "烤肉饭",
    "新疆炒米粉",
    "肉夹馍",
    "煎饼果子",
    "包子粥铺",
    "饺子",
    "馄饨",
    "生煎锅贴",
    "汉堡套餐",
    "炸鸡套餐",
    "鸡肉卷",
    "披萨",
    "意大利面",
    "三明治",
    "轻食沙拉",
    "健康便当",
    "寿司拼盘",
    "日式拉面",
    "日式咖喱饭",
    "韩式拌饭",
    "韩式炸鸡",
    "部队锅",
    "泰式炒河粉",
    "越南牛肉粉",
    "海南鸡饭",
    "东北盒饭"
  ];

  const state = {
    customItems: loadArray(STORAGE.custom),
    dislikedItems: loadArray(STORAGE.disliked),
    penalty: loadObject(STORAGE.penalty),
    rotation: 0,
    spinning: false,
    items: []
  };

  const elements = {
    canvas: document.querySelector("[data-wheel]"),
    spin: document.querySelector("[data-spin]"),
    result: document.querySelector("[data-result]"),
    count: document.querySelector("[data-count]"),
    customCount: document.querySelector("[data-custom-count]"),
    dislikedCount: document.querySelector("[data-disliked-count]"),
    optionList: document.querySelector("[data-option-list]"),
    dislikedList: document.querySelector("[data-disliked-list]"),
    empty: document.querySelector("[data-empty]"),
    status: document.querySelector("[data-status]"),
    addForm: document.querySelector("[data-add-form]"),
    itemInput: document.querySelector("[data-item-input]"),
    dislikeForm: document.querySelector("[data-dislike-form]"),
    dislikeInput: document.querySelector("[data-dislike-input]"),
    clearCustom: document.querySelector("[data-clear-custom]"),
    clearDisliked: document.querySelector("[data-clear-disliked]"),
    reset: document.querySelector("[data-reset]")
  };

  const ctx = elements.canvas.getContext("2d");

  function normalize(value) {
    return String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
  }

  function displayText(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
  }

  function hasItem(items, value) {
    const key = normalize(value);
    return items.some((item) => normalize(item) === key);
  }

  function unique(items) {
    const next = [];
    items.forEach((item) => {
      const text = displayText(item);
      if (text && !hasItem(next, text)) {
        next.push(text);
      }
    });
    return next;
  }

  function loadArray(key) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(parsed) ? unique(parsed) : [];
    } catch (error) {
      return [];
    }
  }

  function loadObject(key) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "{}");
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function save() {
    localStorage.setItem(STORAGE.custom, JSON.stringify(state.customItems));
    localStorage.setItem(STORAGE.disliked, JSON.stringify(state.dislikedItems));
    localStorage.setItem(STORAGE.penalty, JSON.stringify(state.penalty));
  }

  function allItems() {
    return unique(DEFAULT_ITEMS.concat(state.customItems));
  }

  function refreshItems() {
    state.items = allItems().filter((item) => !hasItem(state.dislikedItems, item));
    Object.keys(state.penalty).forEach((item) => {
      if (!hasItem(state.items, item)) {
        delete state.penalty[item];
      }
    });
  }

  function itemWeight(item) {
    return Number(state.penalty[item]) > 0 ? PENALTY_WEIGHT : 1;
  }

  function weightedIndex() {
    const weights = state.items.map(itemWeight);
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let target = Math.random() * total;

    for (let index = 0; index < weights.length; index += 1) {
      target -= weights[index];
      if (target <= 0) {
        return index;
      }
    }

    return state.items.length - 1;
  }

  function segmentColor(index) {
    const hue = (index * 137.508 + (index % 6) * 13) % 360;
    return `hsl(${hue.toFixed(1)} 68% 48%)`;
  }

  function compact(label) {
    return label.length > 7 ? `${label.slice(0, 7)}...` : label;
  }

  function drawWheel() {
    const canvas = elements.canvas;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const size = Math.max(320, Math.floor(rect.width || 640));
    canvas.width = Math.floor(size * ratio);
    canvas.height = Math.floor(size * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const center = size / 2;
    const radius = center - 12;

    if (!state.items.length) {
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fillStyle = "#e6ebf1";
      ctx.fill();
      ctx.fillStyle = "#64707f";
      ctx.font = "700 20px Microsoft YaHei, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("暂无可选项", center, center);
      return;
    }

    const sweep = Math.PI * 2 / state.items.length;
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(state.rotation);

    state.items.forEach((item, index) => {
      const start = -Math.PI / 2 + index * sweep;
      const end = start + sweep;
      const penalized = itemWeight(item) < 1;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = segmentColor(index);
      ctx.fill();

      if (penalized) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.34)";
        ctx.fill();
      }

      ctx.strokeStyle = "rgba(255, 255, 255, 0.72)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.save();
      ctx.rotate(start + sweep / 2);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      ctx.font = state.items.length > 48 ? "12px Microsoft YaHei, sans-serif" : "14px Microsoft YaHei, sans-serif";
      ctx.shadowColor = "rgba(0, 0, 0, 0.44)";
      ctx.shadowBlur = 2;
      ctx.fillText(`${compact(item)}${penalized ? " 1/2" : ""}`, radius - 16, 0);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(0, 0, 62, 0, Math.PI * 2);
    ctx.fillStyle = "#fffdf8";
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#1f252d";
    ctx.stroke();
    ctx.fillStyle = "#1f252d";
    ctx.font = "800 18px Microsoft YaHei, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "transparent";
    ctx.fillText("午餐", 0, -8);
    ctx.font = "12px Microsoft YaHei, sans-serif";
    ctx.fillText("转盘", 0, 16);
    ctx.restore();
  }

  function status(message, tone) {
    elements.status.textContent = message;
    elements.status.dataset.tone = tone || "";
  }

  function renderChips() {
    elements.optionList.innerHTML = "";
    state.items.forEach((item, index) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.style.setProperty("--chip-color", segmentColor(index));
      chip.textContent = itemWeight(item) < 1 ? `${item}，后 ${state.penalty[item]} 次降权` : item;
      elements.optionList.appendChild(chip);
    });

    elements.dislikedList.innerHTML = "";
    state.dislikedItems.forEach((item) => {
      const chip = document.createElement("span");
      const remove = document.createElement("button");
      chip.className = "chip";
      chip.style.setProperty("--chip-color", "#bd3724");
      chip.append(document.createTextNode(item));
      remove.type = "button";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `移除 ${item}`);
      remove.addEventListener("click", () => {
        state.dislikedItems = state.dislikedItems.filter((entry) => normalize(entry) !== normalize(item));
        status(`已恢复：${item}`, "success");
        render();
      });
      chip.appendChild(remove);
      elements.dislikedList.appendChild(chip);
    });
  }

  function render() {
    refreshItems();
    elements.count.textContent = String(state.items.length);
    elements.customCount.textContent = String(state.customItems.length);
    elements.dislikedCount.textContent = String(state.dislikedItems.length);
    elements.empty.hidden = state.items.length > 0;
    elements.spin.disabled = state.spinning || state.items.length === 0;
    elements.clearCustom.disabled = state.customItems.length === 0 || state.spinning;
    elements.clearDisliked.disabled = state.dislikedItems.length === 0 || state.spinning;
    renderChips();
    save();
    drawWheel();
  }

  function normalizeAngle(angle) {
    const full = Math.PI * 2;
    return ((angle % full) + full) % full;
  }

  function easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3);
  }

  function reducePenalty() {
    const next = {};
    Object.keys(state.penalty).forEach((item) => {
      const rounds = Number(state.penalty[item]) - 1;
      if (rounds > 0) {
        next[item] = rounds;
      }
    });
    state.penalty = next;
  }

  function spin() {
    if (state.spinning || !state.items.length) {
      return;
    }

    state.spinning = true;
    elements.result.textContent = "转动中...";
    status("正在决定今天的午餐。", "");
    render();

    const targetIndex = weightedIndex();
    const sweep = Math.PI * 2 / state.items.length;
    const targetCenter = targetIndex * sweep + sweep / 2;
    const targetRotation = normalizeAngle(-targetCenter);
    const currentRotation = normalizeAngle(state.rotation);
    const delta = normalizeAngle(targetRotation - currentRotation);
    const start = state.rotation;
    const end = state.rotation + (5 + Math.floor(Math.random() * 3)) * Math.PI * 2 + delta;
    const duration = 3600 + Math.random() * 700;
    const startTime = performance.now();

    function frame(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      state.rotation = start + (end - start) * easeOutCubic(progress);
      drawWheel();

      if (progress < 1) {
        requestAnimationFrame(frame);
        return;
      }

      const winner = state.items[targetIndex];
      reducePenalty();
      state.penalty[winner] = PENALTY_ROUNDS;
      elements.result.textContent = winner;
      status(`今天吃：${winner}。它会在后 ${PENALTY_ROUNDS} 次抽取中降低概率。`, "success");
      state.spinning = false;
      render();
    }

    requestAnimationFrame(frame);
  }

  function addCustom(value) {
    const item = displayText(value);
    if (!item) {
      status("请输入想加入的午餐。", "warn");
      return false;
    }
    if (hasItem(allItems(), item)) {
      status("这个选项已经在转盘里。", "warn");
      return false;
    }
    state.customItems.push(item);
    state.dislikedItems = state.dislikedItems.filter((entry) => normalize(entry) !== normalize(item));
    status(`已加入：${item}`, "success");
    return true;
  }

  function addDisliked(value) {
    const item = displayText(value);
    if (!item) {
      status("请输入要排除的午餐。", "warn");
      return false;
    }
    if (hasItem(state.dislikedItems, item)) {
      status("这个选项已经被排除了。", "warn");
      return false;
    }
    state.dislikedItems.push(item);
    delete state.penalty[item];
    status(`已排除：${item}`, "success");
    return true;
  }

  elements.spin.addEventListener("click", spin);

  elements.addForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (addCustom(elements.itemInput.value)) {
      elements.itemInput.value = "";
      render();
    } else {
      elements.itemInput.select();
    }
  });

  elements.dislikeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (addDisliked(elements.dislikeInput.value)) {
      elements.dislikeInput.value = "";
      render();
    } else {
      elements.dislikeInput.select();
    }
  });

  elements.clearCustom.addEventListener("click", () => {
    state.customItems = [];
    status("已清空自定义选项。", "success");
    render();
  });

  elements.clearDisliked.addEventListener("click", () => {
    state.dislikedItems = [];
    status("已清空排除列表。", "success");
    render();
  });

  elements.reset.addEventListener("click", () => {
    state.customItems = [];
    state.dislikedItems = [];
    state.penalty = {};
    state.rotation = 0;
    elements.result.textContent = "等转盘决定";
    status("已恢复默认设置。", "success");
    render();
  });

  window.addEventListener("resize", drawWheel);
  render();
})();
