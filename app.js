(function () {
  "use strict";

  const STORAGE = {
    custom: "zwcs-custom-items-v1",
    disliked: "zwcs-disliked-items-v1",
    penalty: "zwcs-penalty-v1",
    ownerToken: "zwcs-owner-token-v1",
    ownedPosts: "zwcs-owned-posts-v1",
    editCooldowns: "zwcs-edit-cooldowns-v1"
  };

  const PENALTY_ROUNDS = 8;
  const PENALTY_WEIGHT = 0.45;
  const DISCUSSION_CONFIG = {
    url: "https://psnfspriisabtbrjzfia.supabase.co",
    key: "sb_publishable_S0ol3rfghyJXjnP_4co5lg_Jbvx30qp",
    table: "takeout_posts"
  };

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
    lastWinner: "",
    discussionPosts: [],
    discussionFilter: "all",
    discussionSubmitting: false,
    ownerToken: getOwnerToken(),
    ownedPostIds: loadArray(STORAGE.ownedPosts),
    editingPostId: "",
    editCooldowns: loadObject(STORAGE.editCooldowns),
    items: []
  };

  const elements = {
    canvas: document.querySelector("[data-wheel]"),
    spin: document.querySelector("[data-spin]"),
    resultCard: document.querySelector("[data-result-card]"),
    result: document.querySelector("[data-result]"),
    resultQuestion: document.querySelector("[data-result-question]"),
    dislikeResult: document.querySelector("[data-dislike-result]"),
    keepResult: document.querySelector("[data-keep-result]"),
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
    reset: document.querySelector("[data-reset]"),
    discussionForm: document.querySelector("[data-discussion-form]"),
    discussionSchool: document.querySelector("[data-discussion-school]"),
    discussionShop: document.querySelector("[data-discussion-shop]"),
    discussionType: document.querySelector("[data-discussion-type]"),
    discussionReason: document.querySelector("[data-discussion-reason]"),
    discussionSubmit: document.querySelector("[data-discussion-submit]"),
    discussionStatus: document.querySelector("[data-discussion-status]"),
    discussionList: document.querySelector("[data-discussion-list]"),
    discussionFilter: document.querySelector("[data-discussion-filter]"),
    discussionEmpty: document.querySelector("[data-discussion-empty]")
  };

  const ctx = elements.canvas.getContext("2d");

  function normalize(value) {
    return String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
  }

  function displayText(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
  }

  function clampText(value, maxLength) {
    return displayText(value).slice(0, maxLength);
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

  function randomToken() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return `owner-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }

  function getOwnerToken() {
    const existing = localStorage.getItem(STORAGE.ownerToken);
    if (existing) {
      return existing;
    }

    const token = randomToken();
    localStorage.setItem(STORAGE.ownerToken, token);
    return token;
  }

  function saveOwnedPosts() {
    localStorage.setItem(STORAGE.ownedPosts, JSON.stringify(state.ownedPostIds));
  }

  function saveEditCooldowns() {
    localStorage.setItem(STORAGE.editCooldowns, JSON.stringify(state.editCooldowns));
  }

  function rememberOwnedPost(id) {
    if (id && !hasItem(state.ownedPostIds, id)) {
      state.ownedPostIds.push(id);
      saveOwnedPosts();
    }
  }

  function forgetOwnedPost(id) {
    state.ownedPostIds = state.ownedPostIds.filter((entry) => entry !== id);
    saveOwnedPosts();
  }

  function discussionEndpoint(query) {
    return `${DISCUSSION_CONFIG.url}/rest/v1/${DISCUSSION_CONFIG.table}${query || ""}`;
  }

  function discussionHeaders(extra) {
    return Object.assign({
      apikey: DISCUSSION_CONFIG.key,
      Authorization: `Bearer ${DISCUSSION_CONFIG.key}`,
      "x-owner-token": state.ownerToken,
      "Content-Type": "application/json"
    }, extra || {});
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
    if (!state.spinning) {
      ctx.fillStyle = "#1f252d";
      ctx.font = "800 18px Microsoft YaHei, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "transparent";
      ctx.fillText("午餐", 0, -8);
      ctx.font = "12px Microsoft YaHei, sans-serif";
      ctx.fillText("转盘", 0, 16);
    }
    ctx.restore();
  }

  function status(message, tone) {
    elements.status.textContent = message;
    elements.status.dataset.tone = tone || "";
  }

  function discussionStatus(message, tone) {
    elements.discussionStatus.textContent = message;
    elements.discussionStatus.dataset.tone = tone || "";
  }

  function isOwnPost(post) {
    return post && hasItem(state.ownedPostIds, post.id);
  }

  function canEditPost(post) {
    const until = Number(state.editCooldowns[post.id] || 0);
    return Date.now() >= until;
  }

  function hideResultQuestion() {
    elements.resultQuestion.hidden = true;
  }

  function showResultQuestion() {
    elements.resultQuestion.hidden = !state.lastWinner;
  }

  function pulseResultCard() {
    elements.resultCard.classList.remove("is-bouncing");
    void elements.resultCard.offsetWidth;
    elements.resultCard.classList.add("is-bouncing");
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

  function formatTime(value) {
    if (!value) {
      return "";
    }

    try {
      return new Intl.DateTimeFormat("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(value));
    } catch (error) {
      return "";
    }
  }

  function renderDiscussion() {
    const filter = state.discussionFilter;
    const posts = state.discussionPosts.filter((post) => filter === "all" || post.post_type === filter);
    elements.discussionList.innerHTML = "";
    elements.discussionEmpty.hidden = posts.length > 0;
    elements.discussionSubmit.disabled = state.discussionSubmitting;

    posts.forEach((post) => {
      const card = document.createElement("article");
      const head = document.createElement("div");
      const type = document.createElement("span");
      const title = document.createElement("strong");
      const meta = document.createElement("span");
      const reason = document.createElement("p");
      const actions = document.createElement("div");

      card.className = `discussion-card ${post.post_type === "avoid" ? "is-avoid" : "is-recommend"}`;
      head.className = "discussion-card-head";
      type.className = "discussion-type";
      type.textContent = post.post_type === "avoid" ? "避雷" : "推荐";
      title.textContent = post.shop_name || "未命名店家";
      meta.textContent = `${post.school_name || "未知学校"} · 匿名 · ${formatTime(post.updated_at || post.created_at)}${post.updated_at ? " · 已修改" : ""}`;
      reason.textContent = post.reason || "";

      head.appendChild(type);
      head.appendChild(title);
      card.appendChild(head);
      card.appendChild(meta);
      card.appendChild(reason);

      if (isOwnPost(post)) {
        const edit = document.createElement("button");
        const remove = document.createElement("button");
        actions.className = "discussion-card-actions";
        edit.type = "button";
        edit.textContent = "修改";
        edit.setAttribute("data-edit-post", "");
        edit.addEventListener("click", () => startEditPost(post));
        remove.type = "button";
        remove.textContent = "删除";
        remove.className = "danger-link";
        remove.setAttribute("data-delete-post", "");
        remove.addEventListener("click", () => deletePost(post));
        actions.appendChild(edit);
        actions.appendChild(remove);
        card.appendChild(actions);
      }

      elements.discussionList.appendChild(card);
    });
  }

  async function loadDiscussionPosts() {
    try {
      discussionStatus("正在加载校园分享...", "");
      const response = await fetch(discussionEndpoint("?select=id,school_name,shop_name,post_type,reason,created_at,updated_at&order=created_at.desc&limit=50"), {
        headers: discussionHeaders()
      });

      if (!response.ok) {
        throw new Error("load failed");
      }

      state.discussionPosts = await response.json();
      discussionStatus("已加载最近的匿名分享。", "success");
    } catch (error) {
      discussionStatus("讨论区暂时无法加载，请稍后再试。", "warn");
    }

    renderDiscussion();
  }

  async function submitDiscussion() {
    const payload = {
      school_name: clampText(elements.discussionSchool.value, 40),
      shop_name: clampText(elements.discussionShop.value, 60),
      post_type: elements.discussionType.value === "avoid" ? "avoid" : "recommend",
      reason: clampText(elements.discussionReason.value, 240),
      owner_token: state.ownerToken
    };

    if (payload.school_name.length < 2 || !payload.shop_name || payload.reason.length < 5) {
      discussionStatus("请填写学校、店家和至少 5 个字的理由。", "warn");
      return;
    }

    if (state.editingPostId) {
      updatePost(state.editingPostId, payload);
      return;
    }

    state.discussionSubmitting = true;
    renderDiscussion();
    discussionStatus("正在发布匿名分享...", "");

    try {
      const response = await fetch(discussionEndpoint(), {
        method: "POST",
        headers: discussionHeaders({ Prefer: "return=representation" }),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("submit failed");
      }

      const rows = await response.json();
      (Array.isArray(rows) ? rows : []).forEach((row) => rememberOwnedPost(row.id));
      state.discussionPosts = (Array.isArray(rows) ? rows : []).concat(state.discussionPosts).slice(0, 50);
      elements.discussionForm.reset();
      elements.discussionType.value = payload.post_type;
      discussionStatus("已匿名发布，感谢分享。", "success");
    } catch (error) {
      discussionStatus("发布失败，请检查网络或 Supabase 权限。", "warn");
    }

    state.discussionSubmitting = false;
    renderDiscussion();
  }

  function startEditPost(post) {
    if (!canEditPost(post)) {
      discussionStatus("修改后需等待 10 秒才能再次修改。", "warn");
      return;
    }

    state.editingPostId = post.id;
    elements.discussionSchool.value = post.school_name || "";
    elements.discussionShop.value = post.shop_name || "";
    elements.discussionType.value = post.post_type === "avoid" ? "avoid" : "recommend";
    elements.discussionReason.value = post.reason || "";
    elements.discussionSubmit.textContent = "保存修改";
    discussionStatus("正在修改自己的匿名分享。", "");
  }

  function resetDiscussionForm(type) {
    state.editingPostId = "";
    elements.discussionForm.reset();
    elements.discussionType.value = type || "recommend";
    elements.discussionSubmit.textContent = "匿名发布";
  }

  async function updatePost(id, payload) {
    state.discussionSubmitting = true;
    renderDiscussion();
    discussionStatus("正在保存修改...", "");

    try {
      const response = await fetch(discussionEndpoint(`?id=eq.${encodeURIComponent(id)}`), {
        method: "PATCH",
        headers: discussionHeaders({ Prefer: "return=representation" }),
        body: JSON.stringify(Object.assign({}, payload, {
          updated_at: new Date().toISOString()
        }))
      });

      if (!response.ok) {
        throw new Error("update failed");
      }

      const rows = await response.json();
      const updated = Array.isArray(rows) ? rows[0] : null;
      if (updated) {
        state.discussionPosts = state.discussionPosts.map((post) => post.id === id ? updated : post);
        rememberOwnedPost(updated.id);
      }
      state.editCooldowns[id] = Date.now() + 10000;
      saveEditCooldowns();
      resetDiscussionForm(payload.post_type);
      discussionStatus("已保存修改，10 秒后才能再次修改。", "success");
    } catch (error) {
      discussionStatus("修改失败，请稍后再试。", "warn");
    }

    state.discussionSubmitting = false;
    renderDiscussion();
  }

  async function deletePost(post) {
    if (!confirm("确定删除这条匿名分享吗？")) {
      return;
    }

    state.discussionSubmitting = true;
    renderDiscussion();
    discussionStatus("正在删除...", "");

    try {
      const response = await fetch(discussionEndpoint(`?id=eq.${encodeURIComponent(post.id)}`), {
        method: "DELETE",
        headers: discussionHeaders()
      });

      if (!response.ok) {
        throw new Error("delete failed");
      }

      state.discussionPosts = state.discussionPosts.filter((entry) => entry.id !== post.id);
      forgetOwnedPost(post.id);
      delete state.editCooldowns[post.id];
      saveEditCooldowns();
      if (state.editingPostId === post.id) {
        resetDiscussionForm();
      }
      discussionStatus("已删除自己的匿名分享。", "success");
    } catch (error) {
      discussionStatus("删除失败，请稍后再试。", "warn");
    }

    state.discussionSubmitting = false;
    renderDiscussion();
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
    state.lastWinner = "";
    elements.result.textContent = "转动中...";
    hideResultQuestion();
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
      state.lastWinner = winner;
      elements.result.textContent = winner;
      status(`今天吃：${winner}。它会在后 ${PENALTY_ROUNDS} 次抽取中降低概率。`, "success");
      state.spinning = false;
      render();
      showResultQuestion();
      pulseResultCard();
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

  elements.dislikeResult.addEventListener("click", () => {
    if (!state.lastWinner) {
      return;
    }

    const item = state.lastWinner;
    if (addDisliked(item)) {
      state.lastWinner = "";
      hideResultQuestion();
      render();
    }
  });

  elements.keepResult.addEventListener("click", () => {
    if (!state.lastWinner) {
      return;
    }

    status(`已保留：${state.lastWinner}`, "success");
    state.lastWinner = "";
    hideResultQuestion();
  });

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

  elements.discussionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitDiscussion();
  });

  elements.discussionFilter.addEventListener("change", () => {
    state.discussionFilter = elements.discussionFilter.value || "all";
    renderDiscussion();
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
    state.lastWinner = "";
    elements.result.textContent = "等转盘决定";
    hideResultQuestion();
    status("已恢复默认设置。", "success");
    render();
  });

  window.addEventListener("resize", drawWheel);
  render();
  renderDiscussion();
  loadDiscussionPosts();
})();
