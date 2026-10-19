#!/usr/bin/env node
/**
 * 羊毛工具箱 wooltools.tech 静态生成器（零第三方依赖）
 * 用法: node scripts/build.mjs
 * 输入: book/*.md（641 条）+ scripts/data/*.json
 * 输出: dist/（纯静态，GitHub Pages 直接托管）
 *
 * 页面结构（2026-10-20 扩展，为 SEO 长尾铺量）：
 *   /                    首页
 *   /all/                全部目录（641 条按章分组）
 *   /ch/<章号>/          34 个章节页
 *   /p/<章号>-<条号>/     641 个条目页（每条一个搜索意图）
 *   /slice/<slug>/       8 个场景切片
 *   /weekly/ /guide/ /about/
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BOOK_DIR = join(ROOT, 'book');
const DIST = join(ROOT, 'dist');
const SITE = 'https://wooltools.tech';
const TODAY = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

/* ---------- 工具 ---------- */
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const linkify = (s) => esc(s).replace(/&lt;(https?:\/\/[^\s&]+)&gt;/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
const clip = (s, n) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n) + '…' : t;
};
const chapterUrl = (num) => `/ch/${num}/`;
const entryUrl = (num, idx) => `/p/${num}-${idx}/`;

/* ---------- 样式（外置，全部页面共用一份） ---------- */
const SITE_CSS = `:root{--bg:#faf9f7;--card:#fff;--ink:#2b2b28;--sub:#6b6b66;--line:#e8e4dc;--accent:#b3541e;--accent-bg:#fdf3ec;--green:#18794e;--green-bg:#eef7f1;--amber:#915930;--amber-bg:#fbf3e8;--red:#a33b2e;--red-bg:#fbeeec}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;background:var(--bg);color:var(--ink);line-height:1.75;font-size:16px}
a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}
.wrap{max-width:880px;margin:0 auto;padding:0 18px}
header.site{background:var(--card);border-bottom:1px solid var(--line);padding:14px 0;position:sticky;top:0;z-index:9}
header.site .wrap{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.logo{font-weight:700;font-size:19px;color:var(--ink)}.logo span{color:var(--accent)}
.logo small{display:block;font-size:11px;color:var(--sub);font-weight:400;letter-spacing:.5px}
nav.top{display:flex;gap:14px;flex-wrap:wrap;font-size:14px}
nav.top a{color:var(--sub)}nav.top a:hover{color:var(--accent)}
.hero{padding:44px 0 30px;text-align:center}
.hero h1{font-size:30px;line-height:1.35;margin-bottom:12px}
.hero p{color:var(--sub);max-width:640px;margin:0 auto;font-size:15px}
.hero .cta{display:inline-block;margin-top:18px;background:var(--accent);color:#fff;padding:10px 26px;border-radius:8px;font-size:15px}
.hero .cta:hover{text-decoration:none;opacity:.92}
section{padding:26px 0}
h2.sec{font-size:21px;margin-bottom:6px}
p.sec-desc{color:var(--sub);font-size:14px;margin-bottom:18px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px;display:block;color:inherit;transition:box-shadow .15s}
.card:hover{box-shadow:0 4px 16px rgba(0,0,0,.07);text-decoration:none}
.card h3{font-size:16px;margin-bottom:6px}
.card p{font-size:13px;color:var(--sub);line-height:1.6}
.card .meta{margin-top:10px;font-size:12px;color:var(--sub)}
.entry{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:20px 22px;margin-bottom:16px}
.entry h3{font-size:17px;line-height:1.5;margin-bottom:10px}
.entry h3 .no{color:var(--sub);font-weight:400;margin-right:6px}
.entry .plain{background:var(--accent-bg);border-left:3px solid var(--accent);padding:10px 14px;border-radius:0 8px 8px 0;font-size:14.5px;margin:10px 0}
.entry dl{font-size:14px;margin-top:10px}
.entry dt{font-weight:600;color:var(--sub);margin-top:8px;font-size:13px}
.entry dd{margin-top:2px}
.entry .src{font-size:12.5px;color:var(--sub);word-break:break-all}
.entry .note{font-size:13px;color:var(--amber);background:var(--amber-bg);padding:8px 12px;border-radius:8px;margin-top:10px}
.badge{display:inline-block;font-size:11.5px;padding:1px 8px;border-radius:20px;margin-left:8px;vertical-align:1px;font-weight:400}
.badge.a{background:var(--green-bg);color:var(--green)}
.badge.b{background:var(--amber-bg);color:var(--amber)}
.badge.c{background:#f0efec;color:var(--sub)}
table.wk{width:100%;border-collapse:collapse;background:var(--card);border-radius:12px;overflow:hidden;font-size:14px;display:block;overflow-x:auto}
table.wk th{background:#f3f0ea;text-align:left;padding:10px 12px;font-size:13px;white-space:nowrap}
table.wk td{padding:10px 12px;border-top:1px solid var(--line);vertical-align:top}
table.wk td:first-child{white-space:nowrap;font-weight:600}
.tag{display:inline-block;font-size:11.5px;padding:1px 8px;border-radius:6px;background:var(--green-bg);color:var(--green);white-space:nowrap}
.tag.free{background:var(--accent-bg);color:var(--accent)}
.tag.cn{background:#eef2fb;color:#3451b2}
footer.site{border-top:1px solid var(--line);margin-top:40px;padding:26px 0 40px;color:var(--sub);font-size:13px}
footer.site p{margin-bottom:6px}
.crumb{font-size:13px;color:var(--sub);margin:18px 0 6px}
.crumb a{color:var(--sub)}
/* 条目页 / 章节页 */
.article{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:26px 28px;margin:8px 0 22px}
.article h1{font-size:24px;line-height:1.45;margin-bottom:14px}
.article h1 .no{color:var(--sub);font-weight:400;margin-right:8px;font-size:19px}
.article .plain{background:var(--accent-bg);border-left:3px solid var(--accent);padding:12px 16px;border-radius:0 8px 8px 0;font-size:15px;margin:14px 0 18px}
.article .plain b{color:var(--accent)}
.article .blk{margin-top:18px}
.article .blk h2{font-size:14px;color:var(--sub);font-weight:600;letter-spacing:.02em;margin-bottom:6px}
.article .blk p{font-size:15px}
.article .blk .src{font-size:12.5px;color:var(--sub);word-break:break-all;line-height:1.85}
.article .note{font-size:13.5px;color:var(--amber);background:var(--amber-bg);padding:10px 14px;border-radius:8px;margin-top:18px}
.pager{display:flex;justify-content:space-between;gap:14px;font-size:14px;margin:6px 0 26px;flex-wrap:wrap}
.pager a{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 16px;color:var(--ink)}
.pager a:hover{border-color:var(--accent);text-decoration:none}
.pager .sp{flex:1}
.rel{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px 20px;margin-bottom:18px}
.rel h2{font-size:15px;margin-bottom:12px}
.rel ul{list-style:none;display:flex;flex-direction:column;gap:9px}
.rel li{font-size:14.5px;line-height:1.55;padding-left:14px;position:relative}
.rel li:before{content:"";position:absolute;left:0;top:.72em;width:5px;height:5px;border-radius:50%;background:var(--accent)}
.rel li a{color:var(--ink)}
.rel li a:hover{color:var(--accent)}
.toc{list-style:none;display:flex;flex-direction:column;gap:7px;font-size:14.5px}
.toc li{line-height:1.55}
.toc .cn{color:var(--sub);font-size:12.5px;margin-left:6px}
.chapblk{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px 20px;margin-bottom:14px}
.chapblk h3{font-size:16px;margin-bottom:10px}
.chapblk h3 a{color:var(--ink)}
@media(max-width:560px){.hero h1{font-size:24px}.entry{padding:16px}.article{padding:20px 18px}.article h1{font-size:20px}}`;

/* ---------- 1. 解析 book/*.md ---------- */
function parseBook() {
  const entries = [];
  const chapters = [];
  const files = readdirSync(BOOK_DIR).filter((f) => f.endsWith('.md')).sort();
  for (const file of files) {
    const text = readFileSync(join(BOOK_DIR, file), 'utf8');
    const headMatch = text.match(/^#\s*(\d+)\.\s*(.+)$/m);
    const chapterNum = headMatch ? parseInt(headMatch[1], 10) : parseInt((file.match(/^(\d+)/) || [, '0'])[1], 10);
    const chapterTitle = headMatch ? headMatch[2].trim() : file.replace(/\.md$/, '');
    const introMatch = text.match(/^#\s*\d+\.\s*.+\r?\n([\s\S]*?)(?=^###)/m);
    const chapterIntro = introMatch ? introMatch[1].trim().split(/\r?\n\s*\r?\n/)[0].trim() : '';
    const blocks = text.split(/^###\s+/m).slice(1);
    for (const b of blocks) {
      const m = b.match(/^(\d+)\.\s*(.+)$/m);
      if (!m) continue;
      const get = (label) => {
        const r = b.match(new RegExp(`^-\\s*${label}：(.+)$`, 'm'));
        return r ? r[1].trim() : '';
      };
      entries.push({
        chapter: file,
        chapterNum,
        chapterTitle,
        chapterIntro,
        index: parseInt(m[1], 10),
        title: m[2].trim(),
        cost: get('成本'),
        plain: get('说人话'),
        benefit: get('收益'),
        grade: get('证据等级') || 'C',
        source: get('来源'),
        note: get('备注'),
      });
    }
    if (!chapters.find((c) => c.num === chapterNum)) {
      chapters.push({ num: chapterNum, title: chapterTitle, intro: chapterIntro, file });
    }
  }
  chapters.sort((a, b) => a.num - b.num);
  return { entries, chapters };
}

/* ---------- 2. 布局 ---------- */
function layout({ title, desc, body, path = '/', jsonld = '', robots = 'index,follow' }) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${SITE}${path}">
<link rel="stylesheet" href="/assets/site.css">
${jsonld ? `<script type="application/ld+json">${jsonld}</script>` : ''}
</head>
<body>
<header class="site"><div class="wrap">
<a class="logo" href="/">🧰 羊毛工具箱 <span>wooltools.tech</span><small>WOOL TOOLS · 高性价比生活决策 + AI 工具免费额度情报</small></a>
<nav class="top">
<a href="/">首页</a><a href="/all/">全部目录</a><a href="/slice/shiye/">失业保障</a><a href="/slice/shengqian/">省钱</a><a href="/slice/chengxuyuan/">程序员红线</a><a href="/weekly/">额度情报</a><a href="/guide/">完整指南</a><a href="/about/">关于</a>
</nav>
</div></header>
<main class="wrap">
${body}
</main>
<footer class="site"><div class="wrap">
<p>🧰 <strong>羊毛工具箱 wooltools.tech</strong> — 用最少的钱、时间和精力，换回最多的寿命、金钱和人身自由。</p>
<p>指南数据来源：<a href="https://github.com/eternity4719/HowToLiveBetter" target="_blank" rel="noopener">eternity4719/HowToLiveBetter</a>（CC BY 4.0，署名转载再加工）。本站内容不构成医疗、法律建议，请以官方最新公布为准。</p>
</div></footer>
</body>
</html>`;
}

/* ---------- 3. 条目渲染 ---------- */
function renderEntry(e, no) {
  const g = e.grade === 'A' ? 'a' : e.grade === 'B' ? 'b' : 'c';
  return `<article class="entry" id="e-${e.chapterNum}-${e.index}">
<h3><span class="no">${no}.</span><a href="${entryUrl(e.chapterNum, e.index)}" style="color:inherit">${esc(e.title)}</a><span class="badge ${g}">证据 ${e.grade}</span></h3>
${e.plain ? `<div class="plain">${esc(e.plain)}</div>` : ''}
<dl>
${e.cost ? `<dt>成本</dt><dd>${esc(e.cost)}</dd>` : ''}
${e.benefit ? `<dt>收益</dt><dd>${esc(e.benefit)}</dd>` : ''}
${e.source ? `<dt>来源</dt><dd class="src">${linkify(e.source)}</dd>` : ''}
</dl>
${e.note ? `<div class="note">备注：${esc(e.note)}</div>` : ''}
</article>`;
}

/* ---------- 4. 首页 ---------- */
function buildIndex(entries, slices, weekly, chapters) {
  const wk = weekly.weekly[0];
  const body = `
<div class="hero">
<h1>用最少的钱和时间<br>换回最多的寿命、金钱和自由</h1>
<p>641 条循证生活决策（每条写明成本、收益、证据等级和官方出处）+ AI 工具免费额度情报周报。不灌鸡汤，只给能查证的清单。</p>
<a class="cta" href="/slice/shiye/">失业了？先看能领什么 →</a>
</div>

<section>
<h2 class="sec">📋 人生决策切片</h2>
<p class="sec-desc">从 641 条指南里按场景切出来的长尾清单，手机直接看。</p>
<div class="grid">
${slices.map((s) => {
  const n = countSlice(entries, s);
  return `<a class="card" href="/slice/${s.slug}/"><h3>${esc(s.nav)}</h3><p>${esc(s.desc.slice(0, 52))}…</p><div class="meta">${n} 条 · 证据分级标注</div></a>`;
}).join('\n')}
</div>
</section>

<section>
<h2 class="sec">📚 全部 34 个主题</h2>
<p class="sec-desc">${entries.length} 条建议按主题分章，点进任何一条都能看到成本、收益和官方文件出处。</p>
<div class="grid">
${chapters.map((c) => `<a class="card" href="${chapterUrl(c.num)}"><h3>${c.num}. ${esc(c.title)}</h3><div class="meta">${entries.filter((e) => e.chapterNum === c.num).length} 条</div></a>`).join('\n')}
</div>
<p class="sec-desc" style="margin-top:14px"><a href="/all/">查看全部 ${entries.length} 条完整目录 →</a></p>
</section>

<section>
<h2 class="sec">🎁 AI 工具免费额度情报</h2>
<p class="sec-desc">${esc(wk.title)} · ${esc(wk.date)}</p>
<table class="wk">
<tr><th>工具</th><th>额度</th><th>类型</th><th>状态</th></tr>
${wk.items.map((i) => `<tr><td><a href="${esc(i.link)}" target="_blank" rel="noopener">${esc(i.name)}</a></td><td>${esc(i.offer)}</td><td><span class="tag ${i.type === '国内直连' ? 'cn' : i.type === '免卡白嫖' ? 'free' : ''}">${esc(i.type)}</span></td><td>${esc(i.status)}</td></tr>`).join('\n')}
</table>
<p class="sec-desc" style="margin-top:12px"><a href="/weekly/">查看全部周报 →</a> ｜ <a href="/guide/">完整版 641 条指南检索 →</a></p>
</section>

<section>
<h2 class="sec">🧧 近期薅到</h2>
<div class="grid">
${weekly.deals.map((d) => `<div class="card"><h3>${esc(d.item)}</h3><div class="meta">${esc(d.date)} · ${esc(d.status)}</div></div>`).join('\n')}
</div>
</section>`;
  writePage('index.html', { title: '羊毛工具箱 wooltools.tech — 高性价比生活决策 + AI 工具免费额度情报', desc: '641 条循证生活决策清单（失业保障/省钱/租房/维权/程序员红线）+ AI 工具免费额度情报周报。每条写明成本、收益、证据等级和官方出处。', body, path: '/' });
}

function countSlice(entries, slice) {
  let n = 0;
  for (const ref of slice.refs) {
    if (ref.indexes && ref.indexes.length) n += ref.indexes.length;
    else n += entries.filter((e) => e.chapter === ref.chapter).length;
  }
  return n;
}

/* ---------- 5. 场景切片 ---------- */
function buildSlices(entries, slices) {
  for (const s of slices) {
    const picked = [];
    for (const ref of s.refs) {
      const list = entries.filter((e) => e.chapter === ref.chapter);
      if (ref.indexes && ref.indexes.length) {
        for (const idx of ref.indexes) {
          const e = list.find((x) => x.index === idx);
          if (e) picked.push(e);
        }
      } else picked.push(...list);
    }
    const body = `
<div class="crumb"><a href="/">首页</a> / ${esc(s.nav)}</div>
<section style="padding-top:8px">
<h2 class="sec">${esc(s.h1)}</h2>
<p class="sec-desc">${esc(s.desc)}</p>
${picked.map((e, i) => renderEntry(e, i + 1)).join('\n')}
<p class="sec-desc" style="margin-top:20px">数据来源：<a href="https://github.com/eternity4719/HowToLiveBetter" target="_blank" rel="noopener">HowToLiveBetter</a>（CC BY 4.0）。完整 641 条见 <a href="/guide/">完整指南</a> 或 <a href="/all/">全部目录</a>。</p>
</section>`;
    mkdirSync(join(DIST, 'slice', s.slug), { recursive: true });
    writePage(join('slice', s.slug, 'index.html'), { title: `${s.nav} — 羊毛工具箱`, desc: s.desc, body, path: `/slice/${s.slug}/` });
  }
}

/* ---------- 6. 章节页（34 个） ---------- */
function buildChapters(entries, chapters, sliceMap) {
  chapters.forEach((c, ci) => {
    const list = entries.filter((e) => e.chapterNum === c.num).sort((a, b) => a.index - b.index);
    const prev = chapters[ci - 1];
    const next = chapters[ci + 1];
    const desc = c.intro ? clip(c.intro, 118) : `第 ${c.num} 章：${c.title}，共 ${list.length} 条，每条写明成本、收益、证据等级与官方文件出处。`;
    const body = `
<div class="crumb"><a href="/">首页</a> / <a href="/all/">全部目录</a> / ${esc(c.title)}</div>
<section style="padding-top:8px">
<h2 class="sec">${c.num}. ${esc(c.title)}</h2>
<p class="sec-desc">${esc(c.intro || desc)}</p>
<p class="sec-desc">本章共 <strong>${list.length}</strong> 条。证据等级 A 表示有官方文件或权威统计支撑，B 表示有部分依据，C 表示经验性建议。点开任意一条可以看到完整依据。</p>
${list.map((e, i) => renderEntry(e, i + 1)).join('\n')}
</section>
<div class="pager">
${prev ? `<a href="${chapterUrl(prev.num)}">← ${prev.num}. ${esc(prev.title)}</a>` : '<span class="sp"></span>'}
${next ? `<a href="${chapterUrl(next.num)}">${next.num}. ${esc(next.title)} →</a>` : '<span class="sp"></span>'}
</div>`;
    writePage(join('ch', String(c.num), 'index.html'), {
      title: `${c.num}. ${c.title}（${list.length} 条）— 羊毛工具箱`,
      desc,
      body,
      path: chapterUrl(c.num),
      jsonld: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${c.num}. ${c.title}`,
        description: desc,
        url: `${SITE}${chapterUrl(c.num)}`,
        isPartOf: { '@type': 'WebSite', name: '羊毛工具箱', url: SITE + '/' },
        inLanguage: 'zh-CN',
      }),
    });
  });
}

/* ---------- 7. 条目页（641 个） ---------- */
function buildEntries(entries, slices, chapterMap, sliceMap) {
  // 按章节分组，用于"同主题其他条目"
  const byChapter = new Map();
  for (const e of entries) {
    if (!byChapter.has(e.chapterNum)) byChapter.set(e.chapterNum, []);
    byChapter.get(e.chapterNum).push(e);
  }
  for (const list of byChapter.values()) list.sort((a, b) => a.index - b.index);

  for (const e of entries) {
    const g = e.grade === 'A' ? 'a' : e.grade === 'B' ? 'b' : 'c';
    const chap = chapterMap.get(e.chapterNum) || { num: e.chapterNum, title: e.chapterTitle };
    const siblings = byChapter.get(e.chapterNum).filter((x) => x.index !== e.index);
    // 相关条目：优先同章节相邻，最多 8 条
    const near = siblings
      .slice()
      .sort((a, b) => Math.abs(a.index - e.index) - Math.abs(b.index - e.index))
      .slice(0, 8)
      .sort((a, b) => a.index - b.index);
    const relSlices = sliceMap.get(`e:${e.chapterNum}-${e.index}`) || [];
    const all = byChapter.get(e.chapterNum);
    const pos = all.findIndex((x) => x.index === e.index);
    const prevE = all[pos - 1];
    const nextE = all[pos + 1];

    const desc = clip(e.plain || e.cost || e.title, 118);
    const body = `
<div class="crumb"><a href="/">首页</a> / <a href="/all/">全部目录</a> / <a href="${chapterUrl(chap.num)}">${esc(chap.title)}</a> / 第 ${e.index} 条</div>
<article class="article">
<h1><span class="no">${e.index}.</span>${esc(e.title)}<span class="badge ${g}">证据 ${e.grade}</span></h1>
${e.plain ? `<div class="plain"><b>说人话：</b>${esc(e.plain)}</div>` : ''}
${e.cost ? `<div class="blk"><h2>成本</h2><p>${esc(e.cost)}</p></div>` : ''}
${e.benefit ? `<div class="blk"><h2>收益 / 怎么做</h2><p>${esc(e.benefit)}</p></div>` : ''}
${e.source ? `<div class="blk"><h2>官方来源</h2><p class="src">${linkify(e.source)}</p></div>` : ''}
${e.note ? `<div class="note"><strong>备注：</strong>${esc(e.note)}</div>` : ''}
</article>
<div class="pager">
${prevE ? `<a href="${entryUrl(prevE.chapterNum, prevE.index)}">← 上一条</a>` : '<span class="sp"></span>'}
${nextE ? `<a href="${entryUrl(nextE.chapterNum, nextE.index)}">下一条 →</a>` : '<span class="sp"></span>'}
</div>
${relSlices.length ? `<div class="rel"><h2>这条属于这些场景</h2><ul>${relSlices.map((s) => `<li><a href="/slice/${s.slug}/">${esc(s.nav)}</a></li>`).join('')}</ul></div>` : ''}
${near.length ? `<div class="rel"><h2>${esc(chap.title)} · 其他条目</h2><ul>${near.map((x) => `<li><a href="${entryUrl(x.chapterNum, x.index)}">${esc(x.title)}</a></li>`).join('')}</ul></div>` : ''}
<div class="rel"><h2>出处与说明</h2><ul><li>数据来自开源项目 <a href="https://github.com/eternity4719/HowToLiveBetter" target="_blank" rel="noopener">HowToLiveBetter</a>（CC BY 4.0），本站按原许可署名转载并再加工。</li><li>本站内容不构成医疗、法律、投资建议；政策金额、门槛以你所在地当年官方公布为准。</li></ul></div>`;

    writePage(join('p', `${e.chapterNum}-${e.index}`, 'index.html'), {
      title: `${e.title} — 羊毛工具箱`,
      desc,
      body,
      path: entryUrl(e.chapterNum, e.index),
      jsonld: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: e.title,
        description: desc,
        url: `${SITE}${entryUrl(e.chapterNum, e.index)}`,
        inLanguage: 'zh-CN',
        isPartOf: { '@type': 'WebSite', name: '羊毛工具箱', url: SITE + '/' },
        about: chap.title,
        citation: (e.source || '').split(/；/).slice(0, 3).join(' ').slice(0, 500),
        publisher: { '@type': 'Organization', name: '羊毛工具箱', url: SITE + '/' },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: SITE + '/' },
            { '@type': 'ListItem', position: 2, name: chap.title, item: `${SITE}${chapterUrl(chap.num)}` },
            { '@type': 'ListItem', position: 3, name: e.title },
          ],
        },
      }),
    });
  }
}

/* ---------- 8. 全部目录 ---------- */
function buildAllIndex(entries, chapters) {
  const body = `
<div class="crumb"><a href="/">首页</a> / 全部目录</div>
<section style="padding-top:8px">
<h2 class="sec">📚 全部 ${entries.length} 条 · 按主题分 ${chapters.length} 章</h2>
<p class="sec-desc">每一条都可以单独打开，里面写了成本、收益、证据等级和官方文件出处。</p>
${chapters.map((c) => {
  const list = entries.filter((e) => e.chapterNum === c.num).sort((a, b) => a.index - b.index);
  return `<div class="chapblk">
<h3><a href="${chapterUrl(c.num)}">${c.num}. ${esc(c.title)}</a><span class="cn">${list.length} 条</span></h3>
<ul class="toc">
${list.map((e) => `<li><a href="${entryUrl(e.chapterNum, e.index)}">${e.index}. ${esc(e.title)}</a></li>`).join('\n')}
</ul>
</div>`;
}).join('\n')}
</section>`;
  writePage(join('all', 'index.html'), {
    title: `全部目录 · ${entries.length} 条生活决策 — 羊毛工具箱`,
    desc: `${entries.length} 条循证生活决策完整目录，按 ${chapters.length} 个主题分章：失业保障、省钱、租房、维权、职业病、法律红线、程序员、创业、育儿、养老等。每条写明成本、收益、证据等级和官方出处。`,
    body,
    path: '/all/',
  });
}

/* ---------- 9. 周报 / 指南 / 关于 ---------- */
function buildWeekly(weekly) {
  const body = `
<div class="crumb"><a href="/">首页</a> / 额度情报周报</div>
<section style="padding-top:8px">
<h2 class="sec">🎁 AI 工具免费额度情报周报</h2>
<p class="sec-desc">情报中心每周整理：注册即送、免卡白嫖、国内直连三类真免费入口。状态栏标 ✅ 的是本站已实测领到的。</p>
${weekly.weekly.map((w) => `
<h3 style="margin:22px 0 10px;font-size:17px">${esc(w.title)} <span style="color:var(--sub);font-weight:400;font-size:14px">${esc(w.date)}</span></h3>
<p class="sec-desc">${esc(w.summary)}</p>
<table class="wk">
<tr><th>工具</th><th>额度</th><th>类型</th><th>状态</th></tr>
${w.items.map((i) => `<tr><td><a href="${esc(i.link)}" target="_blank" rel="noopener">${esc(i.name)}</a></td><td>${esc(i.offer)}</td><td><span class="tag ${i.type === '国内直连' ? 'cn' : i.type === '免卡白嫖' ? 'free' : ''}">${esc(i.type)}</span></td><td>${esc(i.status)}</td></tr>`).join('\n')}
</table>`).join('')}
</section>`;
  mkdirSync(join(DIST, 'weekly'), { recursive: true });
  writePage(join('weekly', 'index.html'), { title: 'AI 工具免费额度情报周报 — 羊毛工具箱', desc: '每周更新的 AI 工具免费额度情报：注册即送、免卡白嫖、国内直连。', body, path: '/weekly/' });
}

function buildGuide() {
  const body = `
<div class="crumb"><a href="/">首页</a> / 完整指南</div>
<section style="padding-top:8px">
<h2 class="sec">📖 高性价比人生指南 · 完整检索版</h2>
<p class="sec-desc">641 条循证建议，支持按成本/证据等级/性价比筛选和全文搜索。数据来自 <a href="https://github.com/eternity4719/HowToLiveBetter" target="_blank" rel="noopener">eternity4719/HowToLiveBetter</a>（CC BY 4.0），本站镜像再加工。</p>
<iframe src="/HowToLiveBetter.html" style="width:100%;height:78vh;border:1px solid var(--line);border-radius:12px;background:#fff" title="高性价比人生指南完整检索版"></iframe>
</section>`;
  writePage(join('guide', 'index.html'), { title: '完整指南 641 条 — 羊毛工具箱', desc: '高性价比人生指南完整检索版：641 条循证建议，按成本/证据等级筛选。', body, path: '/guide/' });
}

function buildAbout() {
  const body = `
<div class="crumb"><a href="/">首页</a> / 关于</div>
<section style="padding-top:8px">
<h2 class="sec">关于羊毛工具箱</h2>
<p class="sec-desc" style="font-size:15px;color:var(--ink)">
<p><strong>wooltools.tech（羊毛工具箱）</strong>是一个「高性价比生活决策 + AI 工具免费额度情报」站点。</p>
<p style="margin-top:10px">指南数据来自开源项目 <a href="https://github.com/eternity4719/HowToLiveBetter" target="_blank" rel="noopener">eternity4719/HowToLiveBetter</a>（56.9k★，CC BY 4.0 许可，署名转载再加工）。原项目的规矩我们照抄：只引期刊论文和官方文件，每条写明成本、收益、证据等级，不引二手转述。</p>
<p style="margin-top:10px">额度情报由自动化情报系统每日采集、每周整理，状态栏标 ✅ 的是实测领到的。</p>
<p style="margin-top:10px">本站内容不构成医疗、法律、投资建议。政策金额以你所在地当年官方公布为准。</p>
</section>`;
  writePage(join('about', 'index.html'), { title: '关于 — 羊毛工具箱', desc: '羊毛工具箱是什么：高性价比生活决策 + AI 工具免费额度情报。', body, path: '/about/' });
}

function writePage(relPath, { title, desc, body, path, jsonld = '', robots = 'index,follow' }) {
  const html = layout({ title, desc, body, path, jsonld, robots });
  const full = join(DIST, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, html, 'utf8');
}

/* ---------- 10. SEO ---------- */
function buildSeo(entries, chapters, slices) {
  const urls = [
    '/',
    '/all/',
    '/weekly/',
    '/guide/',
    '/about/',
    ...chapters.map((c) => chapterUrl(c.num)),
    ...slices.map((s) => `/slice/${s.slug}/`),
    ...entries.map((e) => entryUrl(e.chapterNum, e.index)),
  ];
  writeFileSync(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `<url><loc>${SITE}${u}</loc><lastmod>${TODAY}</lastmod><changefreq>${u === '/' || u === '/weekly/' ? 'daily' : 'monthly'}</changefreq></url>`).join('\n')}
</urlset>`, 'utf8');
  writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`, 'utf8');
  return urls.length;
}

/* ---------- main ---------- */
const { entries, chapters } = parseBook();
const slices = JSON.parse(readFileSync(join(__dirname, 'data', 'slices.json'), 'utf8')).slices;
const weekly = JSON.parse(readFileSync(join(__dirname, 'data', 'weekly.json'), 'utf8'));

const chapterMap = new Map(chapters.map((c) => [c.num, c]));

// 建立 条目 → 场景切片 反查表
const sliceMap = new Map();
for (const s of slices) {
  for (const ref of s.refs) {
    const list = entries.filter((e) => e.chapter === ref.chapter);
    const picked = ref.indexes && ref.indexes.length ? list.filter((e) => ref.indexes.includes(e.index)) : list;
    for (const e of picked) {
      const k = `e:${e.chapterNum}-${e.index}`;
      if (!sliceMap.has(k)) sliceMap.set(k, []);
      sliceMap.get(k).push({ slug: s.slug, nav: s.nav });
    }
  }
}

console.log(`解析条目: ${entries.length} 条 / ${chapters.length} 章 / ${slices.length} 个场景切片`);
buildIndex(entries, slices, weekly, chapters);
buildSlices(entries, slices);
buildChapters(entries, chapters, sliceMap);
buildEntries(entries, slices, chapterMap, sliceMap);
buildAllIndex(entries, chapters);
buildWeekly(weekly);
buildGuide();
buildAbout();
const n = buildSeo(entries, chapters, slices);

// 资产
mkdirSync(join(DIST, 'assets'), { recursive: true });
writeFileSync(join(DIST, 'assets', 'site.css'), SITE_CSS, 'utf8');

// IndexNow / 百度站长 校验文件（必须能被公开访问，搜索引擎靠它认领站点）
if (existsSync(join(__dirname, 'data', 'seo.json'))) {
  const seo = JSON.parse(readFileSync(join(__dirname, 'data', 'seo.json'), 'utf8'));
  if (seo.indexnowKey) {
    writeFileSync(join(DIST, `${seo.indexnowKey}.txt`), seo.indexnowKey, 'utf8');
    console.log(`IndexNow 密钥文件 → /${seo.indexnowKey}.txt`);
  }
  if (seo.baiduVerifyFile && seo.baiduVerifyBody) {
    writeFileSync(join(DIST, seo.baiduVerifyFile), seo.baiduVerifyBody, 'utf8');
    console.log(`百度校验文件 → /${seo.baiduVerifyFile}`);
  }
}

// public/（iframe 完整版）拷入 dist
if (existsSync(join(ROOT, 'public'))) {
  for (const f of readdirSync(join(ROOT, 'public'))) {
    copyFileSync(join(ROOT, 'public', f), join(DIST, f));
  }
  console.log('public/ 已拷入 dist');
}
// GitHub Pages 自定义域名
writeFileSync(join(DIST, 'CNAME'), 'wooltools.tech\n', 'utf8');
console.log(`sitemap 收录 ${n} 个 URL`);
console.log(`生成完成 → ${DIST}`);
