import asyncio
import os
import yt_dlp
from models import StreamInfo
from config import get_config
import imageio_ffmpeg


FFMPEG_PATH = imageio_ffmpeg.get_ffmpeg_exe()

_QUALITY_MAP = {
    "360p": 360,
    "480p": 480,
    "720p": 720,
    "1080p": 1080,
}


async def extract_stream(url: str, mode: str = "audio", quality: str = "1080p") -> StreamInfo:
    return await asyncio.get_event_loop().run_in_executor(
        None, _extract_sync, url, mode, quality
    )


def _extract_sync(url: str, mode: str, quality: str = "1080p") -> StreamInfo:
    if mode == "audio":
        fmt = "bestaudio/best"
    else:
        height = _QUALITY_MAP.get(quality, 1080)
        fmt = (
            f"bestvideo[vcodec^=avc1][height<={height}]+bestaudio/"
            f"bestvideo[vcodec^=avc1]+bestaudio/"
            f"bestvideo[height<={height}]+bestaudio/"
            f"bestvideo+bestaudio/best"
        )

    base_opts = {
        "quiet": True,
        "no_warnings": True,
        "format": fmt,
        "ffmpeg_location": FFMPEG_PATH,
    }

    cfg = get_config()
    sessdata = cfg.get("player", {}).get("bilibili_sessdata", "")

    if sessdata:
        cookie_file = _create_cookie_file(sessdata)
        try:
            opts = {**base_opts, "cookiefile": cookie_file}
            info = _do_extract(url, opts)
            return _build_stream_info(info, mode)
        except Exception as e:
            print(f"SESSDATA extraction failed ({e}), retrying without cookies...")
        finally:
            try:
                os.unlink(cookie_file)
            except OSError:
                pass

    info = _do_extract(url, base_opts)
    return _build_stream_info(info, mode)


def _create_cookie_file(sessdata: str) -> str:
    """Create a Netscape-format cookies.txt with Bilibili SESSDATA."""
    import tempfile
    content = "# Netscape HTTP Cookie File\n"
    content += f".bilibili.com\tTRUE\t/\tFALSE\t0\tSESSDATA\t{sessdata}\n"
    fd, path = tempfile.mkstemp(suffix=".txt", prefix="bili_cookies_")
    os.write(fd, content.encode("utf-8"))
    os.close(fd)
    return path


def _do_extract(url: str, ydl_opts: dict) -> dict:
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        return ydl.extract_info(url, download=False)


def _build_stream_info(info: dict, mode: str) -> StreamInfo:
    stream_url = info.get("url", "")
    content_type = "audio/mp4"
    video_url = None
    audio_url = None

    if mode == "video":
        requested = info.get("requested_formats")
        if requested and len(requested) >= 2:
            video_url = requested[0].get("url", "")
            audio_url = requested[1].get("url", "")
            stream_url = video_url
            content_type = "video/mp4"
        elif requested and len(requested) == 1:
            stream_url = requested[0].get("url", stream_url)
            ext = requested[0].get("ext", "mp4")
            content_type = f"video/{ext}"
        else:
            ext = info.get("ext", "mp4")
            content_type = f"video/{ext}"

    dur = info.get("duration")
    if dur is not None:
        dur = int(dur)

    return StreamInfo(
        url=stream_url,
        content_type=content_type,
        duration=dur,
        title=info.get("title", ""),
        video_url=video_url,
        audio_url=audio_url,
    )

