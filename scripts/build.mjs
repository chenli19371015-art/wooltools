#!/usr/bin/env node
/**
 * 羊毛工具箱 wooltools.tech 静态生成器（零第三方依赖）
 * 用法: node scripts/build.mjs
 * 输入: book/*.md（HowToLiveBetter 641 条）+ scripts/data/*.json
 * 输出: dist/（纯静态，GitHub Pages 直接托管）
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BOOK_DIR = join(ROOT, 'book');
const DIST = join(ROOT, 'dist');
const SITE = 'https://wooltools.tech';

/* ---------- 工具 ---------- */
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const linkify = (s) => esc(s).replace(/&lt;(https?:\/\/[^\s&]+)&gt;/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');

/* ---------- 1. 解析 book/*.md ---------- */
function parseBook() {
  const entries = [];
  const files = readdirSync(BOOK_DIR).filter((f) => f.endsWith('.md')).sort();
  for (const file of files) {
    const text = readFileSync(join(BOOK_DIR, file), 'utf8');
    const chapterTitle = (text.match(/^#\s*\d+\.\s*(.+)$/m) || [, file.replace(/\.md$/, '')])[1].trim();
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
        chapterTitle,
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
  }
  return entries;
}

/* ---------- 2. 布局 ---------- */
function layout({ title, desc, body, path = '/' }) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}${path}">
<style>
:root{--bg:#faf9f7;--card:#fff;--ink:#2b2b28;--sub:#6b6b66;--line:#e8e4dc;--accent:#b3541e;--accent-bg:#fdf3ec;--green:#18794e;--green-bg:#eef7f1;--amber:#915930;--amber-bg:#fbf3e8;--red:#a33b2e;--red-bg:#fbeeec}
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
@media(max-width:560px){.hero h1{font-size:24px}.entry{padding:16px}}
</style>
</head>
<body>
<header class="site"><div class="wrap">
<a class="logo" href="/">🧰 羊毛工具箱 <span>wooltools.tech</span><small>WOOL TOOLS · 高性价比生活决策 + AI 工具免费额度情报</small></a>
<nav class="top">
<a href="/">首页</a><a href="/slice/shiye/">失业保障</a><a href="/slice/shengqian/">省钱</a><a href="/slice/chengxuyuan/">程序员红线</a><a href="/weekly/">额度情报</a><a href="/guide/">完整指南</a><a href="/about/">关于</a>
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
  return `<article class="entry" id="e-${e.chapter.replace(/\.md$/, '')}-${e.index}">
<h3><span class="no">${no}.</span>${esc(e.title)}<span class="badge ${g}">证据 ${e.grade}</span></h3>
${e.plain ? `<div class="plain">${esc(e.plain)}</div>` : ''}
<dl>
${e.cost ? `<dt>成本</dt><dd>${esc(e.cost)}</dd>` : ''}
${e.benefit ? `<dt>收益</dt><dd>${esc(e.benefit)}</dd>` : ''}
${e.source ? `<dt>来源</dt><dd class="src">${linkify(e.source)}</dd>` : ''}
</dl>
${e.note ? `<div class="note">备注：${esc(e.note)}</div>` : ''}
</article>`;
}

/* ---------- 4. 页面 ---------- */
function buildIndex(entries, slices, weekly) {
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
<p class="sec-desc" style="margin-top:20px">数据来源：<a href="https://github.com/eternity4719/HowToLiveBetter" target="_blank" rel="noopener">HowToLiveBetter</a>（CC BY 4.0）。完整 641 条见 <a href="/guide/">完整指南</a>。</p>
</section>`;
    mkdirSync(join(DIST, 'slice', s.slug), { recursive: true });
    writePage(join('slice', s.slug, 'index.html'), { title: `${s.nav} — 羊毛工具箱`, desc: s.desc, body, path: `/slice/${s.slug}/` });
  }
}

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
  writePage('guide.html', { title: '完整指南 641 条 — 羊毛工具箱', desc: '高性价比人生指南完整检索版：641 条循证建议，按成本/证据等级筛选。', body, path: '/guide/' });
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
  writePage('about.html', { title: '关于 — 羊毛工具箱', desc: '羊毛工具箱是什么：高性价比生活决策 + AI 工具免费额度情报。', body, path: '/about/' });
}

function writePage(relPath, { title, desc, body, path }) {
  const html = layout({ title, desc, body, path });
  const full = join(DIST, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, html, 'utf8');
}

/* ---------- 5. SEO ---------- */
function buildSeo(slices) {
  const urls = ['/', '/weekly/', '/guide/', '/about/', ...slices.map((s) => `/slice/${s.slug}/`)];
  writeFileSync(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `<url><loc>${SITE}${u}</loc><changefreq>weekly</changefreq></url>`).join('\n')}
</urlset>`, 'utf8');
  writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`, 'utf8');
}

/* ---------- main ---------- */
const entries = parseBook();
const slices = JSON.parse(readFileSync(join(__dirname, 'data', 'slices.json'), 'utf8')).slices;
const weekly = JSON.parse(readFileSync(join(__dirname, 'data', 'weekly.json'), 'utf8'));

console.log(`解析条目: ${entries.length} 条 / ${new Set(entries.map((e) => e.chapter)).size} 章`);
buildIndex(entries, slices, weekly);
buildSlices(entries, slices);
buildWeekly(weekly);
buildGuide();
buildAbout();
buildSeo(slices);
// public/（iframe 完整版）拷入 dist
if (existsSync(join(ROOT, 'public'))) {
  for (const f of readdirSync(join(ROOT, 'public'))) {
    copyFileSync(join(ROOT, 'public', f), join(DIST, f));
  }
  console.log('public/ 已拷入 dist');
}
// GitHub Pages 自定义域名
writeFileSync(join(DIST, 'CNAME'), 'wooltools.tech\n', 'utf8');
console.log(`生成完成 → ${DIST}`);
