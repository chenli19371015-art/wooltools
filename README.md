# 羊毛工具箱 wooltools.tech

高性价比生活决策（641 条循证清单）+ AI 工具免费额度情报周报。

线上：https://wooltools.tech

## 站点规模（2026-10-20 扩展）

| 类型 | 数量 | URL | 说明 |
|---|---|---|---|
| 首页 | 1 | `/` | |
| 全部目录 | 1 | `/all/` | 641 条按 34 章分组 |
| 章节页 | 34 | `/ch/<章号>/` | 一个主题 = 一个入口 |
| **条目页** | **641** | `/p/<章号>-<条号>/` | **一条建议 = 一个页面 = 一个搜索意图** |
| 场景切片 | 8 | `/slice/<slug>/` | 跨章节的场景合集 |
| 周报 / 指南 / 关于 | 3 | | |
| **合计** | **688** | sitemap 全量收录 | |

单条目平均 1056 字，均带证据等级（A/B/C）和官方文件出处，所以每页都是正文，不是凑数的薄页。

## 结构
- `book/` — 指南数据源（eternity4719/HowToLiveBetter，CC BY 4.0）
- `scripts/build.mjs` — 零依赖静态生成器（Node ≥18，无 npm install）
- `scripts/submit-search.mjs` — 收录提交（IndexNow + 百度主动推送）
- `scripts/data/slices.json` — 切片页定义
- `scripts/data/weekly.json` — 额度情报数据（情报中心每周更新）
- `scripts/data/seo.json` — IndexNow 密钥 / 百度 token
- `dist/` — 构建产物（GitHub Actions 自动部署到 Pages）
- `public/` — iframe 完整检索版，构建时拷进 dist

## 本地构建
```
node scripts/build.mjs
```

## 提交收录

```bash
node scripts/submit-search.mjs            # 全量提交 sitemap 688 个 URL
node scripts/submit-search.mjs --changed  # 只提交首页 + 周报（日常增量）
```

- **IndexNow 已跑通**：必应/ Yandex / Seznam / Naver 全部返回 200/202（2026-10-20 实测）
  密钥文件 `dist/<key>.txt` 由 build.mjs 自动生成，push 后即可访问
- **百度还差一步**：需要你登录百度搜索资源平台 → 站点管理 → 添加 `wooltools.tech` →
  普通收录 → API 提交 → 复制 token → 填进 `scripts/data/seo.json` 的 `baiduToken`
  也可以直接把 token 贴给我，我填。

## 收录预期（未备案 + 海外托管，已按六折折算）
| 搜索引擎 | 首次收录 | 说明 |
|---|---|---|
| 必应 | 1~3 天 | IndexNow 已推送，最快 |
| Yandex / Naver / Seznam | 1~2 周 | |
| 百度 | **7~15 天**，收录率约 50~75% | 境外无备案站抓取频率中-低 |
| Google | 1~4 周 | 未提交 Search Console，需要账号 |

## 更新情报周报
编辑 `scripts/data/weekly.json` → commit → push，Actions 自动重建上线 → 再跑一次 `--changed` 提交。

数据来源：https://github.com/eternity4719/HowToLiveBetter
