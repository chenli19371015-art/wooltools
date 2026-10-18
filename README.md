# 羊毛工具箱 wooltools.tech

高性价比生活决策（641 条循证清单，切片化）+ AI 工具免费额度情报周报。

## 结构
- `book/` — 指南数据源（eternity4719/HowToLiveBetter，CC BY 4.0）
- `scripts/build.mjs` — 零依赖静态生成器（Node ≥18，无 npm install）
- `scripts/data/slices.json` — 切片页定义
- `scripts/data/weekly.json` — 额度情报数据（情报中心每周更新）
- `dist/` — 构建产物（GitHub Actions 自动部署到 Pages）

## 本地构建
```
node scripts/build.mjs
```

## 更新情报周报
编辑 `scripts/data/weekly.json` → commit → push，Actions 自动重建上线。

数据来源：https://github.com/eternity4719/HowToLiveBetter
