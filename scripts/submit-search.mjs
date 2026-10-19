#!/usr/bin/env node
/**
 * 收录提交（零第三方依赖，Node 22+ 自带 fetch）
 * 用法：
 *   node scripts/submit-search.mjs            提交 sitemap 里的全部 URL
 *   node scripts/submit-search.mjs --changed  只提交最近 1 天改过的页面（日常用）
 *
 * 做的事：
 *   1. IndexNow → 必应 / Yandex / Seznam / Naver（不需要账号，靠密钥文件认领）
 *   2. 百度主动推送 → 需要你先把 token 填进 scripts/data/seo.json
 *
 * 前提：站点必须已上线且 /<key>.txt 可访问，否则搜索引擎不认。
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const HOST = 'wooltools.tech';
const ORIGIN = `https://${HOST}`;
const BATCH = 500;

const seo = JSON.parse(readFileSync(join(__dirname, 'data', 'seo.json'), 'utf8'));
const sitemapPath = join(ROOT, 'dist', 'sitemap.xml');
if (!existsSync(sitemapPath)) {
  console.error('找不到 dist/sitemap.xml，先跑 node scripts/build.mjs');
  process.exit(1);
}

const urls = [...readFileSync(sitemapPath, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!urls.length) {
  console.error('sitemap 里没有 URL');
  process.exit(1);
}
console.log(`sitemap: ${urls.length} 个 URL`);

/* ---------- 1. IndexNow ---------- */
const INDEXNOW_ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
  'https://yandex.com/indexnow',
  'https://search.seznam.cz/indexnow',
  'https://searchadvisor.naver.com/indexnow',
];

async function submitIndexNow(list) {
  const key = seo.indexnowKey;
  if (!key) {
    console.log('跳过 IndexNow：scripts/data/seo.json 没有 indexnowKey');
    return;
  }
  // 先确认密钥文件已上线
  const keyUrl = `${ORIGIN}/${key}.txt`;
  try {
    const r = await fetch(keyUrl, { method: 'GET' });
    const body = (await r.text()).trim();
    if (!r.ok || body !== key) {
      console.log(`⚠️  密钥文件不可访问或内容不符：${keyUrl}（HTTP ${r.status}）`);
      console.log('   站点还没部署上线，先 push 让 GitHub Actions 跑完再提交。');
      return;
    }
    console.log(`✓ 密钥文件在线：${keyUrl}`);
  } catch (e) {
    console.log(`⚠️  取不到密钥文件：${e.message}（可能还没部署）`);
    return;
  }

  let i = 0;
  for (let s = 0; s < list.length; s += BATCH) {
    const chunk = list.slice(s, s + BATCH);
    i++;
    for (const ep of INDEXNOW_ENDPOINTS) {
      try {
        const res = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({ host: HOST, key, keyLocation: keyUrl, urlList: chunk }),
        });
        console.log(`  [${i}] ${new URL(ep).host} → HTTP ${res.status} ${res.status === 200 || res.status === 202 ? '✓' : ''}`);
      } catch (e) {
        console.log(`  [${i}] ${new URL(ep).host} → 失败 ${e.message}`);
      }
    }
  }
}

/* ---------- 2. 百度主动推送 ---------- */
async function submitBaidu(list) {
  const token = (seo.baiduToken || '').trim();
  if (!token) {
    console.log('\n跳过百度：scripts/data/seo.json 的 baiduToken 为空');
    console.log('  填法：百度搜索资源平台 → 用户中心 → 站点管理 → 普通收录 → API 提交 → 复制 token');
    return;
  }
  const ep = `http://data.zz.baidu.com/urls?site=${ORIGIN}&token=${token}`;
  for (let s = 0; s < list.length; s += BATCH) {
    const chunk = list.slice(s, s + BATCH);
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: chunk.join('\n'),
      });
      const text = await res.text();
      console.log(`  百度推送 ${s + 1}-${s + chunk.length} → HTTP ${res.status} ${text.slice(0, 200)}`);
    } catch (e) {
      console.log(`  百度推送失败：${e.message}`);
    }
  }
}

/* ---------- main ---------- */
const onlyChanged = process.argv.includes('--changed');
const targets = onlyChanged ? urls.filter((u) => u === ORIGIN + '/' || u.includes('/weekly/')) : urls;
console.log(`本次提交 ${targets.length} 个 URL`);
await submitIndexNow(targets);
await submitBaidu(targets);
console.log('\n完成。收录生效时间：必应通常 1-3 天，百度 7-15 天（未备案站）。');
