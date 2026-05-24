# 口腔 KOS 内容生文器

基于两份 Excel 生成口腔跑量笔记分析资产，支持 KOS / 非KOS 双入口，并提供移动端 H5 选择、案例参考和 DeepSeek 生文能力。

## 数据管线

```bash
cd oral-kos-content-generator
/Users/huangzhiyao1/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/01_join_notes.py
/Users/huangzhiyao1/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/02_label_and_score.py
/Users/huangzhiyao1/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/03_build_formula_library.py
/Users/huangzhiyao1/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/04_generate_customer_doc.py
```

主要产物在 `data/output/`：

- `joined_notes.csv`
- `data_quality_report.md`
- `labeled_notes.csv`
- `spu_summary.csv`
- `content_type_summary.csv`
- `topic_summary.csv`
- `formula_library.json`
- `good_cases.json`
- `desensitization_report.md`
- `客户使用文档.md`

## 本地运行 H5

```bash
npm install
cp .env.example .env
# 在 .env 中填写 DEEPSEEK_API_KEY
npm run build
npm run dev
```

前端默认运行在 `http://localhost:5173`，后端默认运行在 `http://localhost:8787`。

## 临时共享 Dev 链接

本地服务启动后，可以用 tunnel 生成临时公网链接：

```bash
npx localtunnel --port 5173
```

只共享生成的 `https://...loca.lt` 链接即可。电脑和终端需要保持运行；`.env` 中的 API Key 只在本地后端使用，不会暴露到前端。

## 正式部署

推荐用 Render 部署为一个 Node Web Service。该服务会同时托管 H5 页面和后端 API。

Render 配置：

- Build Command: `npm ci && npm run build`
- Start Command: `npm start`
- Health Check Path: `/api/health`
- Environment Variables:
  - `DEEPSEEK_API_KEY`
  - `DEEPSEEK_BASE_URL=https://api.deepseek.com`
  - `DEEPSEEK_MODEL=deepseek-chat`
  - `NODE_ENV=production`

仓库内已提供 `render.yaml`，可以用 Render Blueprint 直接创建服务。不要把 `.env` 上传到代码仓库。

## DeepSeek

前端不会读取 API Key。所有生文请求通过后端 `POST /api/generate` 中转。

## 合规提醒

工具生成内容不是医疗诊断。涉及价格、医生、资质、服务内容和治疗效果时，必须由客户基于真实信息复核。
