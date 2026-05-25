# AI Music Client 🎵

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=flat-square&logo=python)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

AI Music Client 是一款基于 **FastAPI 后端** 和 **原生 JavaScript/Vanilla CSS 前端** 构建的高清音视频播放器。项目深度融合了现代 AI 设计与现代 Apple 苹果视觉规范（macOS/iOS Apple Music UI），支持在 B站（Bilibili）和抖音（Douyin）上智能检索、流式播放音乐和视频，并提供免打扰、安全的扫码高清解锁方案。

同时，本项目已深度适配并集成了 **Windows 原生桌面客户端** 架构，可打包为免安装的单文件独立桌面应用，完美复用全部的高清流提取和 Apple 风格交互质感。

---

## 🎨 界面视觉亮点 (Premium Apple Aesthetics)

项目界面根据 **Apple 苹果官方设计指南** 进行了高保真、像素级的重构，为您带来顶级的视觉与微动效交互体验：

* 🌌 **动态霓虹背光 (Dynamic Mesh Glow)**：背景注入了三颗缓缓流动、高度模糊的彩色光斑（草莓红 `#ff2d55`、Apple蓝 `#0071e3`、紫罗兰 `#af52de`）。采用原生 GPU 硬件加速的关键帧动画，完美还原 Apple Music 经典的液态流动歌词背景。
* 🥛 **半透明毛玻璃 (Glassmorphism)**：搜索栏、播放卡片与列表面板采用高级发光玻璃描边与 `backdrop-filter: blur(32px)` 磨砂层级滤镜，质感细腻。
* ☀️ **明暗双主题一键切 (Persistent Theme Switcher)**：
  * **苹果白 (Light Theme - 默认)**：牛奶白实体浮空面板与极简的高对比度灰黑字族（iOS 系统级设置界面 Legibility 规范），明亮雅致、清晰度拉满。
  * **黑胶黑 (Dark Theme)**：深邃的碳黑半透明磨砂面与 Strawberry Pink 呼吸高亮指示器，极佳的暗光多媒体沉淀感。
* 🎚️ **极简滑块动效 (Invisible-until-Hover Sliders)**：进度条与音量条手柄默认保持隐藏，只有当鼠标移入轨道或进行拖拽时，滑块才会顺滑放大并显现（`opacity: 1; transform: scale(1.15)`），极具设计操守。
* 📊 **高保真律动频谱**：Canvas 音乐频谱柱被重构为圆角胶囊状，并采用了由粉至紫至蓝的 Apple Gradient 高保真渐变流填充。

---

## ⚡ 核心功能

* 🔍 **全网智能搜索**：基于优化的检索系统，快速聚合 B站 (Bilibili) 和抖音 (Douyin) 资源，支持自由切换首选/备用搜索源。
* 🎛️ **音视频双模播放**：在播放卡片中可随时一键切换“音频”和“视频”播放模式。在播放视频时自动调用 `FFmpeg` 进行音视频无缝合并输出。
* 🔒 **扫码免密高清登录**：内置 B站官方扫码登录安全通道（Segno 生成动态 QR 码并实时轮询），一次扫码即可自动捕获加密 `SESSDATA` 并存入本地，一键解锁 1080P 超高清画质播放，彻底免去手动复制 Cookie F12 页面的烦恼。
* ❤️ **离线收藏夹**：轻量化本地 favorites 缓存，支持全局收藏同步与一键取消收藏。
* 🎚️ **独立音频增益 (GainNode Volume)**：前端搭载 Web Audio API 独立增益节点，解决多浏览器下常规 HTML5 音频音量调节失效问题。
* 💓 **安全自动休眠 (Heartbeat)**：服务器与浏览器建立心跳（Heartbeat），当所有客户端标签页关闭时，后台服务器将安全自动退出进程，杜绝内存占用。

---

## 🖥️ Windows 原生桌面客户端

> **[点击下载最新版](https://github.com/bcqfqf-dotcom/ai-music-client/releases/latest)** — 解压即用，无需安装 Python

项目包含一个 **原生 Windows 桌面客户端**，使用 [pywebview](https://pywebview.flowrl.com/) 将 FastAPI 后端封装为独立桌面窗口，体验与原生应用一致。

### 与 Web 版对比

| 特性 | Web 版 | Desktop 版 |
|------|--------|-----------|
| 启动方式 | `python main.py` + 浏览器访问 | 双击 `AI Music.exe` |
| 运行窗口 | 浏览器标签页 | 原生桌面窗口 |
| 自定义图标 | - | Apple Music 风格红色音量音符 |
| 配置与收藏存储 | 项目所在本地目录 | `%APPDATA%\AIMusicDesktop\` |
| 心跳保活 | 浏览器关闭自动退服 | 桌面窗口关闭即自动退出整个进程 |
| 分发方式 | 需要 Python 环境与手动拉起进程 | 打包为绿色免安装单文件夹分发 |

### 功能特性

* **原生独立窗口** — 基于 Edge Chromium 内核的高性能 WebView2 独立桌面窗口，免受浏览器地址栏与多标签页干扰。
* **自定义应用图标** — 带有 Apple Music 风格的高清红色音量音符应用图标。
* **配置与数据隔离** — 设置和收藏夹数据自动存储在系统 `%APPDATA%\AIMusicDesktop\` 下，重装或升级程序时您的收藏列表和 session 配置不会丢失。
* **全功能高保真** — 搜索、音视频流合成、本地收藏、B站安全扫码登录等核心逻辑完全保留。

### 开发模式运行

在 `desktop/` 目录下准备运行：

```powershell
cd desktop
pip install -r requirements.txt
python desktop_app.py
```

### 打包构建为 .exe

如需将桌面端打包为独立的 `.exe` 进行发布，请在 `desktop/` 目录下执行一键构建脚本或手动执行 PyInstaller 构建：

#### 1. 一键构建脚本 (推荐)
```powershell
cd desktop
.\build.ps1
```

#### 2. 手动构建命令
```powershell
cd desktop
pip install -r requirements.txt
pyinstaller build\ai-music-desktop.spec --noconfirm
```

构建成功后，将在 `desktop/dist/AI Music/` 目录下生成打包好的免安装程序，包含：
* `AI Music.exe` — 主可执行程序
* 所有关联的底层依赖 DLL 和网页静态资源文件

将整个 `dist\AI Music` 目录压缩为 ZIP 即可方便地分发给其他 Windows 10/11 用户使用。

> 💡 **桌面端环境要求：**
> * **操作系统**: Windows 10 / 11
> * **WebView2 Runtime**: Windows 11 已默认内置，部分 Windows 10 用户若无法加载窗口需 [手动安装 Edge WebView2](https://developer.microsoft.com/zh-cn/microsoft-edge/webview2/)。
> * **FFmpeg**: 需安装并加入系统 `PATH`。

---

## ⚙️ 快速开始 (Web 版)

### 1. 克隆项目

```bash
git clone https://github.com/bcqfqf-dotcom/ai-music-client.git
cd ai-music-client
```

### 2. 安装依赖

本项目要求 **Python 3.10+** 及系统已安装并配置 `ffmpeg` 工具链：

```bash
pip install -r requirements.txt
```

> 💡 **FFmpeg 安装说明：**
> * **Windows**: 可通过 [Scoop](https://scoop.sh/) 安装：`scoop install ffmpeg`，或手动下载解压并加入系统环境变量 `Path` 中。
> * **macOS**: `brew install ffmpeg`
> * **Linux**: `sudo apt install ffmpeg`

### 3. 配置项目 (非常重要)

为了保护用户账号凭证和 API 隐私安全，核心配置文件 `config.yaml` 已默认列入 `.gitignore`，**不会**被提交至公开 GitHub 仓库。

请在项目根目录下**复制模版并重命名**为 `config.yaml`：

```bash
cp config.yaml.example config.yaml
```

接着用编辑器打开 `config.yaml` 进行简单配置：
```yaml
llm:
  provider: openai        # OpenAI 或 Anthropic
  api_key: 'your_api_key' # API 密钥
  model: gpt-4o-mini
  base_url: ''            # 可选的反向代理 Base URL
server:
  host: 127.0.0.1
  port: 8000
```

### 4. 启动服务

```bash
python main.py
```
启动成功后，浏览器将自动或手动打开 `http://127.0.0.1:8000` 即可开始赏析您的音乐之旅！

---

## 📁 目录结构

```text
ai-music-client/
├── desktop/            # 🖥️ Windows 原生桌面客户端项目
│   ├── build/          # 打包所需图标（app.ico）及 spec 文件
│   ├── config.py       # 桌面版专有配置管理器（指向 %APPDATA%）
│   ├── desktop_app.py  # 桌面客户端入口（pywebview 绑定）
│   ├── build.ps1       # 一键打包自动化构建 PowerShell 脚本
│   └── README.md       # 桌面客户端专有文档
├── agents/             # AI 智能体检索逻辑 (音乐推荐等)
├── player/             # 媒体提取底层 (yt-dlp、FFmpeg 合并流等)
├── routers/            # FastAPI 路由控制器 (B站扫码、播放接口、Sse心跳)
├── sources/            # 检索数据层 (Bilibili、Douyin 解析器)
├── static/             # 精美的前端网页静态文件
│   ├── app.js          # 主控制逻辑与 Web Audio 增益控制器
│   ├── index.html      # trans-glass 苹果网页视图
│   └── style.css       # 苹果 UI 样式、明暗变量与光影关键帧
├── config.py           # 动态掩码配置读取模块
├── config.yaml.example # 干净的配置文件模版
├── favorites.json      # 您的个人收藏夹数据库 (本地独有，已忽略)
├── main.py             # FastAPI 服务入口
└── requirements.txt    # 依赖声明
```

---

## 🛡️ 隐私与安全规范

项目采取严格的隐私数据出坞保障：
1. 本地收藏夹 `favorites.json` 与动态会话配置文件 `config.yaml` **已被强制添加至 `.gitignore`**。
2. 即使您在设置界面扫码登录或输入了私人的 AI API 密钥，这些数据均仅存在于您本地的计算机，杜绝误提交泄露的风险。

---

## 📄 许可证

本项目采用 [MIT License](LICENSE) 协议开源。
