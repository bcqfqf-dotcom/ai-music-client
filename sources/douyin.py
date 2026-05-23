import asyncio
import yt_dlp
from sources.base import VideoSource
from models import VideoResult


class DouyinSource(VideoSource):
    @property
    def name(self) -> str:
        return "douyin"

    async def search(self, query: str, max_results: int = 5) -> list[VideoResult]:
        return await asyncio.get_event_loop().run_in_executor(
            None, self._search_sync, query, max_results
        )

    def _search_sync(self, query: str, max_results: int) -> list[VideoResult]:
        ydl_opts = {
            "extract_flat": True,
            "quiet": True,
            "no_warnings": True,
        }
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(f"douyinsearch{query}:{max_results}", download=False)
                if not info or "entries" not in info:
                    return []
                results = []
                for entry in info["entries"]:
                    if not entry:
                        continue
                    results.append(VideoResult(
                        id=entry.get("id", ""),
                        title=entry.get("title", ""),
                        url=entry.get("url", ""),
                        duration=entry.get("duration"),
                        view_count=entry.get("view_count"),
                        thumbnail=entry.get("thumbnail"),
                        uploader=entry.get("uploader"),
                        source="douyin",
                    ))
                return results
        except Exception:
            return []
