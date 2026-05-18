# Wedding MiniApp (备婚清单小程序前端)

基于 uni-app + Vue 3 + TypeScript 的微信小程序前端，用于帮助新人协同管理备婚全流程。

## 技术栈

| 技术 | 说明 |
|------|------|
| uni-app | 跨平台小程序框架 (3.0.0-4060620250520001) |
| Vue 3 | 前端框架 (Composition API) |
| TypeScript | 类型安全 |
| Pinia | 状态管理 |
| uView Plus | UI 组件库 |
| SCSS | 样式预处理器 |
| Vite | 构建工具 |

## 项目结构

```
src/
├── api/                  # API 请求封装
│   ├── request.ts        # 基础请求工具 (JWT 注入、错误处理)
│   ├── auth.ts           # 登录认证 API (已废弃，迁移至 user.ts)
│   ├── user.ts           # 微信登录 API
│   ├── profile.ts        # 个人信息 API
│   ├── couple.ts         # 情侣绑定 API
│   ├── timeline.ts       # 时间线阶段 API
│   ├── task.ts           # 任务 CRUD + 状态流转 API
│   ├── budget.ts         # 预算管理 API
│   ├── item.ts           # 物品清单 API
│   ├── vendor.ts         # 供应商管理 API
│   ├── speech.ts         # 致辞模板 API
│   ├── guide.ts          # 备婚攻略 API
│   └── collaboration.ts  # 双人协作 API
├── pages/                # 主包页面 (TabBar 页面)
│   ├── index/            # 备婚首页 (4 状态: 未登录/未绑定/已绑定)
│   ├── budget/           # 预算管理 (环形图 + 分类进度)
│   ├── more/             # 更多功能入口
│   └── mine/             # 个人中心
├── pages-sub/            # 分包页面 (非 TabBar 页面)
│   ├── timeline/         # 备婚时间线 + 任务管理
│   ├── tasklist/         # 全部任务 (按状态筛选)
│   ├── items/            # 物品清单 (分类折叠 + 采购状态)
│   ├── vendors/          # 供应商对比 (评分 + 签约状态)
│   ├── speeches/         # 婚礼致辞 (系统模板 + 自定义)
│   ├── couple/           # 情侣绑定/解绑
│   ├── guide/            # 备婚攻略 (列表 + 详情)
│   ├── collaboration/    # 双人协作仪表盘
│   └── reminder/         # 提醒设置管理
├── store/                # Pinia 状态管理
│   ├── user.ts           # 用户状态 (token + 用户信息)
│   └── couple.ts         # 情侣状态 (coupleId + weddingDate + partnerName)
├── utils/                # 工具函数
│   └── auth.ts           # 静默登录 + 情侣信息加载
├── static/               # 静态资源
│   ├── tab/              # TabBar 图标
│   └── avatars/          # 预置头像 (10 新郎 + 10 新娘, 128x128)
├── manifest.json         # 小程序配置 (AppID、编译选项)
├── pages.json            # 页面路由 + 分包 + TabBar 配置
├── uni.scss              # 全局 SCSS 变量 (配色方案)
├── App.vue               # 应用入口
└── main.ts               # 入口文件
```

## 环境要求

- **Node.js** >= 18
- **微信开发者工具** (最新稳定版)
- **微信 AppID**: `wxxxxxxxxxxx`

## 快速开始

### 安装依赖

```bash
npm install
```

### 环境配置

复制环境配置文件并填写实际值：

```bash
cp .env.example .env
```

`.env` 配置项：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_API_BASE_URL` | 后端 API 地址 | `http://localhost:8080` |
| `VITE_WX_TEMPLATE_ID` | 微信订阅消息模板 ID | 空 |

> 真机调试时 `VITE_API_BASE_URL` 需改为电脑局域网 IP (如 `http://192.168.x.x:8080`)

### 开发模式

```bash
npm run dev:mp-weixin
```

产物输出到 `dist/dev/mp-weixin/`。

### 构建生产包

```bash
npm run build:mp-weixin
```

产物输出到 `dist/build/mp-weixin/`。

## 导入微信开发者工具

1. 打开 **微信开发者工具**
2. 选择「导入项目」
3. 目录选择 `dist/build/mp-weixin`（生产包）或 `dist/dev/mp-weixin`（开发包）
4. AppID 填写 `wxxxxxxxxx`（你的APPID或选择「测试号」）
5. 点击「确定」打开项目

## 分包加载

为满足微信小程序主包不超过 2MB 的限制，页面采用分包加载：

- **主包** (`pages/`): 4 个 TabBar 页面 — 备婚首页、预算管理、更多功能、个人中心
- **分包** (`pages-sub/`): 10 个非 TabBar 页面 — 时间线、任务列表、物品、供应商、致辞、情侣绑定、攻略、协作、提醒

## TabBar 页面

| Tab | 页面 | 说明 |
|-----|------|------|
| 备婚 | pages/index/index | 首页，婚礼倒计时 + 备婚进度 + 阶段时间线 + 任务管理 |
| 预算 | pages/budget/index | 预算环形图 + 分类列表 + 支出记录 |
| 更多 | pages/more/index | 物品/供应商/致辞/攻略/协作/提醒等入口 |
| 我的 | pages/mine/index | 个人中心、情侣绑定、婚礼日期设置 |

## API 请求机制

所有 API 请求通过 `src/api/request.ts` 统一处理：

- 自动注入 JWT Token (`Authorization: Bearer xxx`)
- 401 响应自动清除 Token 并跳转首页
- 错误消息自动 Toast 提示
- POST/PUT/DELETE 请求体自动 `JSON.stringify`

## 静默登录流程

`src/utils/auth.ts` 中的 `silentLogin()` 实现：

1. 检查 Pinia store 中是否已有 token，有则直接返回
2. 调用 `uni.login()` 获取微信临时 code
3. 用 code 请求后端 `/wx/auth/login` 获取 token + 用户信息
4. 存入 Pinia store (`user` + `couple`)
5. 若已绑定情侣，自动加载情侣信息

## 订阅消息授权

用户在以下场景设置任务提醒时，会弹出微信订阅消息授权弹窗：

- 时间线页面添加/编辑任务并设置了提醒时间
- 提醒管理页面修改提醒时间

授权通过 `uni.requestSubscribeMessage()` 实现，模板 ID 从环境变量 `VITE_WX_TEMPLATE_ID` 读取。

## 全局配色

`src/uni.scss` 定义全局 SCSS 变量：

```scss
$wedding-primary: #E8A0BF;    // 主色 - 浪漫粉
$wedding-secondary: #B5838D;  // 辅色 - 玫瑰棕
$wedding-accent: #D4A574;     // 强调色 - 香槟金
$wedding-bg: #FFF5F7;         // 背景色 - 浅粉白
```

## 相关仓库

- 主项目: https://github.com/EnergyYou/wedding-preparation-assistant
- 后端: https://github.com/EnergyYou/wedding-backend

## License

版权所属：公众号-AI玩技社
