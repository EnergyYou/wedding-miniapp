# Wedding MiniApp (备婚清单小程序前端)

基于 uni-app + Vue 3 + TypeScript 的微信小程序前端，用于帮助新人协同管理备婚全流程。

## 技术栈

| 技术 | 说明 |
|------|------|
| uni-app | 跨平台小程序框架 (3.0.0-4060620250520001) |
| Vue 3 | 前端框架 |
| TypeScript | 类型安全 |
| Pinia | 状态管理 |
| uView Plus | UI 组件库 |
| SCSS | 样式预处理器 |
| Vite | 构建工具 |

## 项目结构

```
src/
├── api/                # API 请求封装
│   ├── request.ts      # 基础请求工具 (JWT 注入、错误处理)
│   ├── auth.ts         # 登录认证 API
│   ├── couple.ts       # 情侣绑定 API
│   ├── timeline.ts     # 时间线 API
│   ├── task.ts         # 任务 API
│   ├── budget.ts       # 预算 API
│   ├── item.ts         # 物品 API
│   ├── vendor.ts       # 供应商 API
│   └── speech.ts       # 致辞 API
├── pages/              # 页面组件
│   ├── index/          # 首页 (4 状态: 未登录/未绑定/已绑定)
│   ├── budget/         # 预算管理 (环形图 + 分类进度)
│   ├── items/          # 物品清单 (分类折叠 + 采购状态)
│   ├── vendors/        # 供应商对比 (评分 + 签约状态)
│   ├── speeches/       # 致辞模板 (系统模板 + 自定义)
│   ├── timeline/       # 备婚时间线
│   ├── more/           # 更多入口
│   ├── mine/           # 个人中心
│   └── couple/         # 情侣绑定
├── stores/             # Pinia 状态
│   └── user.ts         # 用户状态 (token + 用户信息)
├── static/             # 静态资源
│   └── tab/            # TabBar 图标
├── manifest.json       # 小程序配置 (AppID、编译选项)
├── pages.json          # 页面路由 + TabBar 配置
├── App.vue             # 应用入口
└── main.ts             # 入口文件
```

## 环境要求

- **Node.js** >= 18
- **微信开发者工具** (最新稳定版)
- **微信 AppID**: `wx3f68eaa82cee73ac`

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

启动开发服务器，文件修改后自动热更新：

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

构建完成后，将产物目录导入微信开发者工具：

1. 打开 **微信开发者工具**
2. 选择「导入项目」
3. 目录选择 `dist/build/mp-weixin`（生产包）或 `dist/dev/mp-weixin`（开发包）
4. AppID 填写 `wx3f68eaa82cee73ac`（或选择「测试号」）
5. 点击「确定」打开项目

## API 配置

后端地址通过环境变量 `VITE_API_BASE_URL` 配置，默认为 `http://localhost:8080`。

可在项目根目录创建 `.env` 文件：

```bash
# 本地开发
VITE_API_BASE_URL=http://localhost:8080

# 线上环境
# VITE_API_BASE_URL=https://your-domain.com
```

所有 API 请求通过 `src/api/request.ts` 统一处理：
- 自动注入 JWT Token (`Authorization: Bearer xxx`)
- 401 响应自动清除 Token 并跳转首页
- 错误消息自动 Toast 提示

## TabBar 页面

| Tab | 页面 | 说明 |
|-----|------|------|
| 备婚 | pages/index/index | 首页，根据登录/绑定状态显示不同内容 |
| 预算 | pages/budget/index | 预算环形图 + 分类列表 |
| 更多 | pages/more/index | 物品/供应商/致辞等入口 |
| 我的 | pages/mine/index | 个人中心、婚礼倒计时 |

## 相关仓库

- 主项目: https://github.com/EnergyYou/wedding-preparation-assistant
- 后端: https://github.com/EnergyYou/wedding-backend
