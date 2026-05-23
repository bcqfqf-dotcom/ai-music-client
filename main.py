import asyncio
import time
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

from config import load_config
from routers.api import router as api_router
from routers.sse import router as sse_router

app = FastAPI(title="AI Music Client")

app.include_router(api_router)
app.include_router(sse_router)

static_dir = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

last_heartbeat = time.time()
HEARTBEAT_TIMEOUT = 30  # seconds


@app.get("/")
async def index():
    return FileResponse(str(static_dir / "index.html"))


@app.post("/api/heartbeat")
async def heartbeat():
    global last_heartbeat
    last_heartbeat = time.time()
    return {"ok": True}


@app.on_event("startup")
async def start_watchdog():
    _cleanup_temp_files()
    asyncio.create_task(_watchdog())


def _cleanup_temp_files():
    import tempfile
    import os
    import glob
    tmp_dir = tempfile.gettempdir()
    for f in glob.glob(os.path.join(tmp_dir, "tmp*.mp4")):
        try:
            if time.time() - os.path.getmtime(f) > 300:
                os.unlink(f)
        except OSError:
            pass


async def _watchdog():
    global last_heartbeat
    while True:
        await asyncio.sleep(3)
        if time.time() - last_heartbeat > HEARTBEAT_TIMEOUT:
            print("No heartbeat received, shutting down...")
            import os
            os._exit(0)


if __name__ == "__main__":
    import uvicorn
    cfg = load_config()
    uvicorn.run(app, host=cfg["server"]["host"], port=cfg["server"]["port"])
