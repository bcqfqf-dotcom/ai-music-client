import math
from sources.bilibili import BilibiliSource
from sources.douyin import DouyinSource
from models import VideoResult

_sources = {
    "bilibili": BilibiliSource(),
    "douyin": DouyinSource(),
}


def _title_similarity(query: str, title: str) -> float:
    query_chars = set(query.lower().replace(" ", ""))
    title_chars = set(title.lower().replace(" ", ""))
    if not query_chars:
        return 0.0
    overlap = len(query_chars & title_chars)
    return overlap / len(query_chars)


def _duration_score(duration: int | None) -> float:
    if not duration:
        return 0.5
    if 120 <= duration <= 360:
        return 1.0
    if 60 <= duration <= 480:
        return 0.7
    return 0.3


def _official_bonus(title: str) -> float:
    keywords = ["官方", "official", "mv", "MV", "高清", "HQ"]
    for kw in keywords:
        if kw in title:
            return 1.0
    return 0.0


def _rank_results(query: str, results: list[VideoResult]) -> list[VideoResult]:
    def score(r: VideoResult) -> float:
        s = _title_similarity(query, r.title) * 40
        if r.view_count:
            s += math.log10(r.view_count + 1) * 5
        s += _duration_score(r.duration) * 15
        s += _official_bonus(r.title) * 10
        if r.uploader and "JLRS-jayfm" in r.uploader:
            s += 100
        return s

    return sorted(results, key=score, reverse=True)


async def search_music(
    query: str,
    preferred_source: str = "bilibili",
    fallback_source: str = "douyin",
    max_results: int = 5,
) -> list[VideoResult]:
    primary = _sources.get(preferred_source)
    if primary:
        results = await primary.search(query, max_results)
        if results:
            return _rank_results(query, results)[:max_results]

    fallback = _sources.get(fallback_source)
    if fallback and fallback_source != preferred_source:
        results = await fallback.search(query, max_results)
        if results:
            return _rank_results(query, results)[:max_results]

    return []
