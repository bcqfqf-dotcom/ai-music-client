# AI Music Desktop 🎵

基于 [ai-music-client](../) Web 版构建的 **原生 Windows 桌面客户端**。

使用 [pywebview](https://pywebview.flowrl.com/) 将 FastAPI 后端封装为原生桌面窗口，无需浏览器即可使用全部功能。

---

## ✨ 与 Web 版的区别

| 特性 | Web 版 | Desktop 版 |
|------|--------|-----------|
| 启动方式 | `python main.py` + 浏览器 | 双击 `AI Music.exe` |
| 窗口 | 浏览器标签页 | 原生桌面窗口 |
| 心跳保活 | 浏览器关闭自动退服 | 窗口关闭即退出 |
| 配置存储 | 项目目录下 | `%APPDATA%\AIMusicDesktop\` |
| 分发 | 需要 Python 环境 | 单文件夹免安装 |

---

## 🚀 快速开始（开发模式）

### 前置要求
- Python 3.10+
- FFmpeg（已加入系统 PATH）

### 安装依赖
```powershell
cd desktop
pip install -r requirements.txt
```

### 启动
```powershell
python desktop_app.py
```

---

## 📦 打包为 .exe

### 一键构建
```powershell
cd desktop
.\build.ps1
```

输出目录：`dist\AI Music\`，包含：
- `AI Music.exe` — 主程序
- 所有依赖 DLL 和资源文件

### 手动构建
```powershell
pyinstaller build\ai-music-desktop.spec --noconfirm
```

### 分发
将整个 `dist\AI Music\` 文件夹打包为 ZIP 即可分发，无需安装 Python。

---

## ⚙️ 配置

配置文件自动存储在 `%APPDATA%\AIMusicDesktop\config.yaml`，首次运行时自动创建。

支持与 Web 版相同的配置项：
```yaml
llm:
  provider: openai
  api_key: 'your_key'
  model: gpt-4o-mini
search:
  preferred_source: bililibili
  fallback_source: douyin
player:
  default_mode: audio
  bilibili_sessdata: ''
```

---

## 🏗️ 项目结构

```
desktop/
├── agents/             # AI 智能检索（复用 Web 版）
├── routers/            # FastAPI 路由（适配桌面版）
├── sources/            # Bilibili/Douyin 搜索源
├── player/             # yt-dlp 流提取
├── static/             # 前端资源（Apple 风格 UI）
├── build/              # PyInstaller 配置
├── config.py           # 桌面版配置管理（AppData）
├── desktop_app.py      # 主入口（pywebview + FastAPI）
├── models.py           # 数据模型
├── requirements.txt    # 依赖清单
├── build.ps1           # 一键构建脚本
└── README.md
```

---

## 📝 技术栈

- **后端**: FastAPI + uvicorn（复用 Web 版全部逻辑）
- **桌面壳**: pywebview（原生 WebView2 on Windows）
- **打包**: PyInstaller → 单文件夹分发
- **前端**: 原生 HTML/CSS/JS + Apple Music 风格 UI

---

## 📄 许可证

MIT License
