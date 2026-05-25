import os
import sys
import yaml
from pathlib import Path


def _get_config_dir() -> Path:
    """Return a persistent config directory that works in dev and packaged mode."""
    if sys.platform == "win32":
        base = Path(os.environ.get("APPDATA", Path.home() / "AppData" / "Roaming"))
        cfg_dir = base / "AIMusicDesktop"
    else:
        cfg_dir = Path.home() / ".config" / "ai-music-desktop"
    cfg_dir.mkdir(parents=True, exist_ok=True)
    return cfg_dir


CONFIG_DIR = _get_config_dir()
CONFIG_PATH = CONFIG_DIR / "config.yaml"
FAVORITES_PATH = CONFIG_DIR / "favorites.json"

_config = None


def load_config() -> dict:
    global _config
    if _config is not None:
        return _config

    cfg = {}
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            cfg = yaml.safe_load(f) or {}

    _config = {
        "llm": {
            "provider": os.environ.get("MUSIC_LLM_PROVIDER", cfg.get("llm", {}).get("provider", "openai")),
            "api_key": os.environ.get("MUSIC_LLM_API_KEY", cfg.get("llm", {}).get("api_key", "")),
            "model": cfg.get("llm", {}).get("model", "gpt-4o-mini"),
            "base_url": cfg.get("llm", {}).get("base_url", ""),
        },
        "search": {
            "preferred_source": cfg.get("search", {}).get("preferred_source", "bilibili"),
            "fallback_source": cfg.get("search", {}).get("fallback_source", "douyin"),
            "max_results": cfg.get("search", {}).get("max_results", 5),
        },
        "player": {
            "default_mode": cfg.get("player", {}).get("default_mode", "audio"),
            "bilibili_sessdata": cfg.get("player", {}).get("bilibili_sessdata", ""),
        },
        "server": {
            "host": "127.0.0.1",
            "port": 0,  # 0 = let OS pick a free port
        },
    }
    return _config


def get_config() -> dict:
    return _config or load_config()


def update_config(updates: dict):
    cfg = get_config()
    if "llm_provider" in updates and updates["llm_provider"]:
        cfg["llm"]["provider"] = updates["llm_provider"]
    if "llm_api_key" in updates and updates["llm_api_key"]:
        cfg["llm"]["api_key"] = updates["llm_api_key"]
    if "llm_model" in updates and updates["llm_model"]:
        cfg["llm"]["model"] = updates["llm_model"]
    if "llm_base_url" in updates and updates["llm_base_url"] is not None:
        cfg["llm"]["base_url"] = updates["llm_base_url"]
    if "player_default_mode" in updates and updates["player_default_mode"]:
        cfg["player"]["default_mode"] = updates["player_default_mode"]
    if "player_bilibili_sessdata" in updates and updates["player_bilibili_sessdata"] is not None:
        cfg["player"]["bilibili_sessdata"] = updates["player_bilibili_sessdata"]

    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        yaml.dump(cfg, f, allow_unicode=True, default_flow_style=False)


def get_masked_config() -> dict:
    cfg = get_config()
    masked = {
        "llm": {
            "provider": cfg["llm"]["provider"],
            "api_key": "***" + cfg["llm"]["api_key"][-4:] if cfg["llm"]["api_key"] else "",
            "model": cfg["llm"]["model"],
            "base_url": cfg["llm"]["base_url"],
        },
        "search": cfg["search"],
        "player": {
            **cfg["player"],
            "bilibili_sessdata": "***" if cfg["player"].get("bilibili_sessdata") else "",
        },
        "server": cfg["server"],
    }
    return masked
