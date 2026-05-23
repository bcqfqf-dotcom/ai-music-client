from abc import ABC, abstractmethod
from models import VideoResult


class VideoSource(ABC):
    @property
    @abstractmethod
    def name(self) -> str: ...

    @abstractmethod
    async def search(self, query: str, max_results: int = 5) -> list[VideoResult]: ...
