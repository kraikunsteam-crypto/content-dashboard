const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const apiUrl = localHosts.has(window.location.hostname) ? "/api/dashboard" : null;
const fallbackUrl = "data/sample-facebook-scan.json";

const els = {
  status: document.querySelector("#dataStatus"),
  totalPosts: document.querySelector("#totalPosts"),
  activeBrands: document.querySelector("#activeBrands"),
  totalEngagement: document.querySelector("#totalEngagement"),
  topBrand: document.querySelector("#topBrand"),
  topBrandNote: document.querySelector("#topBrandNote"),
  insights: document.querySelector("#insights"),
  topicMix: document.querySelector("#topicMix"),
  topPosts: document.querySelector("#topPosts"),
  brandCards: document.querySelector("#brandCards"),
  hookList: document.querySelector("#hookList"),
  ideaBoard: document.querySelector("#ideaBoard"),
  postRows: document.querySelector("#postRows"),
  refreshButton: document.querySelector("#refreshButton"),
};

const number = (value) => Number(value || 0);
const format = (value) => new Intl.NumberFormat("th-TH").format(number(value));

function text(value, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function score(post) {
  return number(post.reactions) + number(post.comments) + number(post.shares);
}

function classifyTopic(caption = "") {
  const source = caption.toLowerCase();
  if (source.includes("กิจกรรม") || source.includes("รับ") || source.includes("รางวัล")) {
    return "กิจกรรม/แจกของ";
  }
  if (source.includes("โปร") || source.includes("ลด") || source.includes("ซื้อคู่")) {
    return "โปรโมชัน";
  }
  if (source.includes("สูตร") || source.includes("วิธี") || source.includes("เลือกซื้อ")) {
    return "How-to / ความรู้";
  }
  if (source.includes("ชา") || source.includes("เมนู") || source.includes("สเต็ก")) {
    return "เมนู/สินค้า";
  }
  return "Brand update";
}

function buildDashboard(raw) {
  const rows = raw.rows || [];
  const summaries = raw.summaries || [];
  const rankedPosts = [...rows].sort((a, b) => score(b) - score(a));
  const topPost = rankedPosts[0];
  const active = summaries.filter((item) => number(item.recent_posts) > 0);
  const totalEngagement = rows.reduce((sum, post) => sum + score(post), 0);
  const topSummary = [...summaries].sort((a, b) => {
    const aScore = number(a.reactions) + number(a.comments) + number(a.shares);
    const bScore = number(b.reactions) + number(b.comments) + number(b.shares);
    return bScore - aScore;
  })[0];

  const topics = rows.reduce((map, post) => {
    const topic = classifyTopic(post.caption || post.raw_text || "");
    map.set(topic, (map.get(topic) || 0) + 1);
    return map;
  }, new Map());

  const topicRows = [...topics.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  return {
    raw,
    scannedAt: raw.scannedAt,
    rows,
    summaries,
    metrics: {
      totalPosts: rows.length,
      activeBrands: active.length,
      totalEngagement,
      topBrand: topSummary?.brand || "-",
      topBrandScore:
        number(topSummary?.reactions) + number(topSummary?.comments) + number(topSummary?.shares),
    },
    insights: [
      `${topSummary?.brand || "เพจที่นำ"} ทำ engagement สูงสุดในชุดข้อมูลนี้ (${format(
        number(topSummary?.reactions) + number(topSummary?.comments) + number(topSummary?.shares),
      )} interactions)`,
      `${topPost?.brand || "Top post"} มีโพสต์เด่น: "${text(topPost?.caption, "ไม่มี caption").slice(0, 86)}"`,
      `คอนเทนต์กลุ่ม "${topicRows[0]?.label || "Brand update"}" ถูกใช้มากสุดในช่วง 3 วันนี้`,
      `โพสต์ที่ตัวเลขไม่ครบควรเก็บ metric_confidence ไว้ เพื่อไม่ปนกับยอด official จาก Meta API`,
    ],
    topics: topicRows,
    topPosts: rankedPosts.slice(0, 5),
    hooks: rows
      .filter((post) => text(post.caption, "").length > 0)
      .sort((a, b) => score(b) - score(a))
      .slice(0, 6)
      .map((post) => ({
        brand: post.brand,
        hook: makeHook(post.caption),
        score: score(post),
        type: classifyTopic(post.caption),
        postUrl: post.post_url,
      })),
    ideas: makeIdeas(topicRows, topSummary),
  };
}

function makeHook(caption = "") {
  const clean = caption.replace(/\s+/g, " ").trim();
  if (!clean) return "เปิดด้วย pain point หรือผลลัพธ์ที่คนอยากได้";
  if (clean.length <= 72) return clean;
  return `${clean.slice(0, 72)}...`;
}

function makeIdeas(topics, topSummary) {
  const topTopic = topics[0]?.label || "How-to / ความรู้";
  return [
    {
      title: "ทำเวอร์ชันของเราในมุมเดียวกับคู่แข่งที่ชนะ",
      body: `หยิบแนว ${topTopic} มาทำเป็นโพสต์ของแบรนด์เรา พร้อม hook ที่สั้นและวัดผลได้`,
    },
    {
      title: "เก็บ hook จากโพสต์ engagement สูง",
      body: `${topSummary?.brand || "Top brand"} น่าจะเป็น benchmark รอบนี้ ให้แตก hook เป็น 3 สูตรแล้วเอาเข้าคลัง`,
    },
    {
      title: "ทำโพสต์เติมช่องว่าง",
      body: "ถ้าคู่แข่งเน้นโปร/กิจกรรม ให้เราทำ how-to หรือเมนูใช้งานจริงเพื่อกินพื้นที่ search และ save",
    },
  ];
}

function render(data, sourceLabel) {
  els.status.textContent = `${sourceLabel} · ${new Date(data.scannedAt).toLocaleString("th-TH")}`;
  els.totalPosts.textContent = format(data.metrics.totalPosts);
  els.activeBrands.textContent = format(data.metrics.activeBrands);
  els.totalEngagement.textContent = format(data.metrics.totalEngagement);
  els.topBrand.textContent = data.metrics.topBrand;
  els.topBrandNote.textContent = `${format(data.metrics.topBrandScore)} interactions`;

  els.insights.innerHTML = data.insights
    .map((item) => `<div class="insight">${escapeHtml(item)}</div>`)
    .join("");

  const maxTopic = Math.max(...data.topics.map((item) => item.count), 1);
  els.topicMix.innerHTML = data.topics
    .map(
      (item) => `
        <div class="topic">
          <strong>${escapeHtml(item.label)} · ${format(item.count)}</strong>
          <div class="topic-bar"><span style="width:${(item.count / maxTopic) * 100}%"></span></div>
        </div>
      `,
    )
    .join("");

  els.topPosts.innerHTML = data.topPosts
    .map(
      (post, index) => `
        <article class="top-post">
          <div class="rank">${index + 1}</div>
          <div class="top-post-body">
            <p class="card-meta">${escapeHtml(post.brand || "-")} · ${escapeHtml(post.post_date || "-")} · ${escapeHtml(
              classifyTopic(post.caption || post.raw_text || ""),
            )}</p>
            <h3>${escapeHtml(text(post.caption, "ไม่มี caption"))}</h3>
            <div class="top-post-stats">
              <span>Like ${text(post.reactions)}</span>
              <span>Comment ${text(post.comments)}</span>
              <span>Share ${text(post.shares)}</span>
              <strong>${format(score(post))} total</strong>
            </div>
          </div>
          ${postButton(post.post_url)}
        </article>
      `,
    )
    .join("");

  els.brandCards.innerHTML = data.summaries
    .map(
      (item) => `
        <article class="brand-card">
          <p class="card-meta">${escapeHtml(item.product)} · ${escapeHtml(item.channel_id)}</p>
          <h3>${escapeHtml(item.brand)}</h3>
          <p>${escapeHtml(item.note || "No public metric warning")}</p>
          <div class="score-row">
            <span>โพสต์ ${format(item.recent_posts)}</span>
            <span>Like ${format(item.reactions)}</span>
            <span>Share ${format(item.shares)}</span>
          </div>
        </article>
      `,
    )
    .join("");

  els.hookList.innerHTML = data.hooks
    .map(
      (item) => `
        <article class="hook">
          <div>
            <p class="card-meta">${escapeHtml(item.brand)} · ${format(item.score)} interactions</p>
            <h3>"${escapeHtml(item.hook)}"</h3>
          </div>
          <div class="hook-actions">
            <span class="tag">${escapeHtml(item.type)}</span>
            ${postButton(item.postUrl)}
          </div>
        </article>
      `,
    )
    .join("");

  els.ideaBoard.innerHTML = data.ideas
    .map(
      (item) => `
        <article class="idea">
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.body)}</p>
        </article>
      `,
    )
    .join("");

  els.postRows.innerHTML = data.rows
    .map(
      (post) => `
        <tr>
          <td>${escapeHtml(post.post_date || "-")}</td>
          <td>${escapeHtml(post.brand || "-")}</td>
          <td class="caption-cell">
            ${escapeHtml(text(post.caption, "ไม่มี caption"))}
            <div class="post-note">${escapeHtml(post.post_type || "Post")} · ${escapeHtml(post.time_label || "")}</div>
          </td>
          <td>${text(post.reactions)}</td>
          <td>${text(post.comments)}</td>
          <td>${text(post.shares)}</td>
          <td>${escapeHtml(post.metric_confidence || "-")}</td>
          <td>${postButton(post.post_url)}</td>
        </tr>
      `,
    )
    .join("");
}

function postButton(url) {
  const href = safeUrl(url);
  if (!href) return `<span class="link-button disabled">ไม่มีลิงก์</span>`;
  return `<a class="link-button" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">เปิดโพสต์</a>`;
}

function safeUrl(url) {
  const value = text(url, "");
  if (!value.startsWith("https://www.facebook.com/") && !value.startsWith("https://facebook.com/")) {
    return "";
  }
  return value;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadDashboard() {
  els.status.textContent = "กำลังโหลดข้อมูล";
  try {
    if (!apiUrl) throw new Error("Static hosting mode");
    const response = await fetch(apiUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    render(buildDashboard(await response.json()), "API");
  } catch (apiError) {
    const fallback = await fetch(fallbackUrl, { cache: "no-store" });
    render(buildDashboard(await fallback.json()), "Sample JSON");
  }
}

els.refreshButton.addEventListener("click", loadDashboard);
loadDashboard();
