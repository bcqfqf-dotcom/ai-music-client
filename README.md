# AI Music Client 🎵

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=flat-square&logo=python)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

AI Music Client 是一款基于 **FastAPI 后端** 和 **原生 JavaScript/Vanilla CSS 前端** 构建的高清音视频播放器。项目深度融合了现代 AI 设计与现代 Apple 苹果视觉规范（macOS/iOS Apple Music UI），支持在 B站（Bilibili）和抖音（Douyin）上智能检索、流式播放音乐和视频，并提供免打扰、安全的扫码高清解锁方案。

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

## 🖥️ Windows 桌面客户端

> **[点击下载最新版](https://github.com/bcqfqf-dotcom/ai-music-client/releases/latest)** — 解压即用，无需安装 Python

项目包含一个 **原生 Windows 桌面客户端**，使用 [pywebview](https://pywebview.flowrl.com/) 将 FastAPI 后端封装为独立桌面窗口，体验与原生应用一致。

### 与 Web 版对比

| 特性 | Web 版 | Desktop 版 |
|------|--------|-----------|
| 启动方式 | python main.py + 浏览器 | 双击 AI Music.exe |
| 窗口 | 浏览器标签页 | 原生桌面窗口 |
| 自定义图标 | - | Apple Music 风格 |
| 控制台窗口 | 有 | 无（静默运行） |
| 配置存储 | 项目目录 | %APPDATA%\AIMusicDesktop\ |
| 心跳保活 | 浏览器关闭自动退服 | 窗口关闭即退出 |
| 分发方式 | 需要 Python 环境 | 解压即用 |

### 功能特性

- **原生窗口** — 基于 EdgeChromium 的独立桌面窗口，无浏览器地址栏/标签干扰
- **自定义图标** — Apple Music 风格红色音符 .ico 图标
- **静默运行** — 无控制台黑窗，双击直接打开应用界面
- **配置持久化** — 设置和收藏夹存储在 %APPDATA%\AIMusicDesktop\，重装不丢失
- **全功能复用** — 搜索、播放、收藏、扫码登录等所有 Web 版功能完整保留

### 环境要求

- **操作系统**: Windows 10 / 11
- **WebView2 Runtime**: Windows 11 已内置，Windows 10 需 [手动安装](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)
- **FFmpeg**: 需安装并加入系统 PATH（scoop install ffmpeg 或 [手动下载](https://ffmpeg.org/download.html)）

### 开发模式运行

`powershell
cd desktop
pip install -r requirements.txt
python desktop_app.py
`

### 打包为 .exe

`powershell
cd desktop
pip install -r requirements.txt
pyinstaller build\ai-music-desktop.spec --noconfirm
# 输出: dist\AI Music\AI Music.exe
`

或将整个 dist\AI Music\ 文件夹打包为 ZIP 分发给其他用户，无需安装 Python。

> 完整文档见 [desktop/README.md](desktop/README.md)

---

## ⚙️ 快速开始

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
├── desktop/              # 🖥️ Windows 桌面客户端 (pywebview)
├── agents/             # AI 智能体检索逻辑 (音乐推荐等)
├── player/             # 媒体提取底层 (yt-dlp、FFmpeg 合并流等)
├── routers/            # FastAPI 路由控制器 (B站扫码、播放接口、Sse心跳)
├── sources/            # 检索数据层 (Bilibili、Douyin 解析器)
├── static/             # 精美的前端网页静态文件
│   ├── app.js          # 主控制逻辑与 Web Audio 增益控制器
│   ├── index.html      # trans-glass 苹果网页视图
│   └── style.css       # 苹果 UI 样式、明暗变量与光影关键帧
├── config.py           # 动态掩码配置读取模块
├── config.yaml.example # 干净的配置文件模版 [NEW]
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
