import os, sys, socket, threading, time
from pathlib import Path

if getattr(sys, "frozen", False):
    BASE_DIR = Path(sys._MEIPASS)
else:
    BASE_DIR = Path(__file__).parent

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from config import load_config
from routers.api import router as api_router
from routers.sse import router as sse_router

app = FastAPI(title="AI Music")
app.include_router(api_router)
app.include_router(sse_router)
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

@app.get("/")
async def index():
    return FileResponse(str(BASE_DIR / "static" / "index.html"))

@app.post("/api/heartbeat")
async def heartbeat():
    return {"ok": True}

@app.on_event("startup")
async def on_startup():
    import glob, tempfile
    for f in glob.glob(os.path.join(tempfile.gettempdir(), "tmp*.mp4")):
        try:
            if time.time() - os.path.getmtime(f) > 300:
                os.unlink(f)
        except OSError:
            pass

if __name__ == "__main__":
    import uvicorn
    import webview

    load_config()
    cfg = load_config()
    host = cfg["server"]["host"]

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind((host, 0))
        port = s.getsockname()[1]

    url = f"http://{host}:{port}"

    server_ready = threading.Event()

    def run_server():
        uvicorn.run(app, host=host, port=port, log_level="info", access_log=False)
        server_ready.set()

    threading.Thread(target=run_server, daemon=True).start()

    window = webview.create_window(
        "AI Music",
        html="<html><body style='margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#1d1d1f;color:#f5f5f7;font-family:system-ui'><div style='text-align:center'><div style='font-size:48px;margin-bottom:16px'>&#9835;</div><div>Loading...</div></div></body></html>",
        width=1200, height=800, min_size=(800, 600),
        resizable=True, text_select=True,
    )

    def on_start():
        for _ in range(50):
            try:
                with socket.create_connection((host, port), timeout=0.5):
                    break
            except OSError:
                time.sleep(0.2)
        time.sleep(0.5)
        window.load_url(url)

    webview.start(on_start, gui="edgechromium", http_server=False, debug=False)
    os._exit(0)