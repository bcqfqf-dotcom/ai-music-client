import json
from pathlib import Path
from fastapi import APIRouter, Query, Request
from fastapi.responses import StreamingResponse

from models import PlayRequest, FavoriteItem, ConfigUpdate
from config import get_masked_config, update_config, get_config
from sources.resolver import search_music
from player.stream import extract_stream

router = APIRouter(prefix="/api")

FAVORITES_PATH = Path(__file__).parent.parent / "favorites.json"


def _load_favorites() -> list[dict]:
    if FAVORITES_PATH.exists():
        return json.loads(FAVORITES_PATH.read_text(encoding="utf-8"))
    return []


def _save_favorites(favs: list[dict]):
    FAVORITES_PATH.write_text(json.dumps(favs, ensure_ascii=False, indent=2), encoding="utf-8")


@router.get("/config")
async def get_config_endpoint():
    return get_masked_config()


@router.put("/config")
async def update_config_endpoint(cfg: ConfigUpdate):
    update_config(cfg.model_dump(exclude_none=True))
    return {"ok": True}


@router.get("/search")
async def search(q: str = Query(...), max_results: int = Query(5)):
    cfg = get_config()
    results = await search_music(
        q,
        preferred_source=cfg["search"]["preferred_source"],
        fallback_source=cfg["search"]["fallback_source"],
        max_results=max_results,
    )
    return [r.model_dump() for r in results]


@router.post("/play")
async def play(req: PlayRequest):
    stream = await extract_stream(req.video_url, mode=req.mode, quality=req.quality)
    return stream.model_dump()


@router.get("/stream/proxy")
async def stream_proxy(url: str, request: Request):
    import httpx

    upstream_headers = {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://www.bilibili.com/",
    }

    # Forward browser's Range header to upstream so seeking works
    range_header = request.headers.get("range")
    if range_header:
        upstream_headers["Range"] = range_header

    # Keep client alive for the duration of the streaming response
    client = httpx.AsyncClient(follow_redirects=True, timeout=httpx.Timeout(10, read=300))
    req = client.build_request("GET", url, headers=upstream_headers)
    upstream_resp = await client.send(req, stream=True)

    # Relay upstream headers back to the browser
    resp_headers = {"Accept-Ranges": "bytes"}
    if "content-length" in upstream_resp.headers:
        resp_headers["Content-Length"] = upstream_resp.headers["content-length"]
    if "content-range" in upstream_resp.headers:
        resp_headers["Content-Range"] = upstream_resp.headers["content-range"]

    content_type = upstream_resp.headers.get("content-type", "audio/mp4")

    async def generate():
        try:
            async for chunk in upstream_resp.aiter_bytes(chunk_size=8192):
                yield chunk
        finally:
            await upstream_resp.aclose()
            await client.aclose()

    return StreamingResponse(
        generate(),
        status_code=upstream_resp.status_code,
        media_type=content_type,
        headers=resp_headers,
    )


@router.get("/image/proxy")
async def image_proxy(url: str):
    import httpx
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers={
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://www.bilibili.com/",
        })
        return StreamingResponse(
            iter([resp.content]),
            media_type=resp.headers.get("content-type", "image/jpeg"),
        )


@router.get("/stream/merge")
async def stream_merge(video_url: str, audio_url: str):
    import subprocess
    import tempfile
    import os
    from fastapi.responses import FileResponse
    from player.stream import FFMPEG_PATH

    headers = "User-Agent: Mozilla/5.0\r\nReferer: https://www.bilibili.com/\r\n"

    tmp_fd, tmp_path = tempfile.mkstemp(suffix=".mp4")
    os.close(tmp_fd)

    try:
        proc = subprocess.run(
            [
                FFMPEG_PATH,
                "-y",
                "-loglevel", "error",
                "-headers", headers,
                "-i", video_url,
                "-headers", headers,
                "-i", audio_url,
                "-c:v", "copy",
                "-c:a", "copy",
                "-movflags", "+faststart",
                "-f", "mp4",
                tmp_path,
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            timeout=60,
        )

        if proc.returncode != 0:
            os.unlink(tmp_path)
            return {"error": "ffmpeg merge failed", "detail": proc.stderr.decode(errors="replace")}

        return FileResponse(
            tmp_path,
            media_type="video/mp4",
            filename="video.mp4",
        )

    except Exception:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
        raise


@router.get("/favorites")
async def get_favorites():
    return _load_favorites()


@router.post("/favorites")
async def add_favorite(item: FavoriteItem):
    favs = _load_favorites()
    if any(f["id"] == item.id for f in favs):
        return {"ok": True, "message": "already exists"}
    favs.append(item.model_dump())
    _save_favorites(favs)
    return {"ok": True}


@router.delete("/favorites/{item_id}")
async def remove_favorite(item_id: str):
    favs = _load_favorites()
    favs = [f for f in favs if f["id"] != item_id]
    _save_favorites(favs)
    return {"ok": True}


@router.get("/bilibili/qrcode")
async def bilibili_qrcode():
    import httpx
    import segno
    import io
    import base64

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://passport.bilibili.com/x/passport-login/web/qrcode/generate",
            headers={"User-Agent": "Mozilla/5.0"},
        )
        data = resp.json()
        if data.get("code") != 0:
            return {"error": "生成二维码失败"}

    login_url = data["data"]["url"]
    qrcode_key = data["data"]["qrcode_key"]

    # Generate QR code as base64 PNG
    qr = segno.make(login_url)
    buf = io.BytesIO()
    qr.save(buf, kind="png", scale=6, border=2)
    qr_base64 = base64.b64encode(buf.getvalue()).decode()

    return {
        "qrcode_key": qrcode_key,
        "qr_image": f"data:image/png;base64,{qr_base64}",
    }


@router.get("/bilibili/qrcode/poll")
async def bilibili_qrcode_poll(key: str):
    import httpx
    from urllib.parse import urlparse, parse_qs

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://passport.bilibili.com/x/passport-login/web/qrcode/poll",
            params={"qrcode_key": key},
            headers={"User-Agent": "Mozilla/5.0"},
        )
        data = resp.json()

    code = data.get("data", {}).get("code", -1)

    if code == 0:
        # Login successful — extract SESSDATA
        sessdata = ""

        # Try from response cookies
        for cookie_str in resp.headers.get_list("set-cookie"):
            if "SESSDATA=" in cookie_str:
                sessdata = cookie_str.split("SESSDATA=")[1].split(";")[0]
                break

        # Fallback: parse from URL in response body
        if not sessdata:
            url = data.get("data", {}).get("url", "")
            if "SESSDATA=" in url:
                parsed = urlparse(url)
                params = parse_qs(parsed.query)
                sessdata = params.get("SESSDATA", [""])[0]

        if sessdata:
            update_config({"player_bilibili_sessdata": sessdata})
            return {"status": "success", "message": "登录成功"}
        return {"status": "error", "message": "获取登录信息失败"}

    elif code == 86090:
        return {"status": "scanned", "message": "已扫码，请在手机上确认"}
    elif code == 86038:
        return {"status": "expired", "message": "二维码已过期，请重新生成"}
    else:
        return {"status": "waiting", "message": "请用B站 App 扫描二维码"}
