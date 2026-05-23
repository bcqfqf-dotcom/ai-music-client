import json
from models import SearchQuery
from agents.prompts import SYSTEM_PROMPT
from config import get_config


async def parse_user_message(message: str) -> SearchQuery:
    cfg = get_config()
    provider = cfg["llm"]["provider"]

    try:
        if provider == "anthropic":
            raw = await _call_anthropic(message, cfg)
        else:
            raw = await _call_openai(message, cfg)
        data = json.loads(raw)
        return SearchQuery(**data)
    except Exception:
        return SearchQuery(search_query=message, intent="play")


async def _call_openai(message: str, cfg: dict) -> str:
    from openai import AsyncOpenAI

    client = AsyncOpenAI(
        api_key=cfg["llm"]["api_key"],
        base_url=cfg["llm"]["base_url"] or None,
    )
    resp = await client.chat.completions.create(
        model=cfg["llm"]["model"],
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": message},
        ],
        temperature=0,
        max_tokens=200,
    )
    return resp.choices[0].message.content.strip()


async def _call_anthropic(message: str, cfg: dict) -> str:
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=cfg["llm"]["api_key"])
    resp = await client.messages.create(
        model=cfg["llm"]["model"],
        max_tokens=200,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": message}],
    )
    return resp.content[0].text.strip()
