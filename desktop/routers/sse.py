import json
from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse
from models import ChatMessage, SearchQuery
from agents.music_agent import parse_user_message
from sources.resolver import search_music
from config import get_config

router = APIRouter()


@router.post("/api/chat")
async def chat(msg: ChatMessage):
    cfg = get_config()

    async def event_stream():
        has_key = bool(cfg["llm"].get("api_key"))

        if has_key:
            yield {"event": "thinking", "data": "正在理解你的请求..."}
            query = await parse_user_message(msg.message)
        else:
            query = SearchQuery(search_query=msg.message, intent="play")

        yield {
            "event": "parsed",
            "data": json.dumps(query.model_dump(), ensure_ascii=False),
        }

        search_label = "Bilibili"
        yield {"event": "searching", "data": f"正在搜索 {search_label}: {query.search_query}"}

        results = await search_music(
            query.search_query,
            preferred_source=cfg["search"]["preferred_source"],
            fallback_source=cfg["search"]["fallback_source"],
            max_results=cfg["search"]["max_results"],
        )

        if not results:
            yield {"event": "error", "data": "未找到相关结果，请换个关键词试试"}
            return

        yield {
            "event": "found",
            "data": json.dumps([r.model_dump() for r in results], ensure_ascii=False),
        }

        yield {"event": "done", "data": "搜索完成，请选择要播放的歌曲"}

    return EventSourceResponse(event_stream())
