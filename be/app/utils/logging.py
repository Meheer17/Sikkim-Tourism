import logging
import sys
from pathlib import Path

def setup_logging(log_level: str = "INFO"):
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    logging.basicConfig(level=getattr(logging, log_level.upper()), format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", handlers=[logging.StreamHandler(sys.stdout), logging.FileHandler(log_dir / "app.log")])
    logging.getLogger("motor").setLevel(logging.WARNING)
    logging.getLogger("pymongo").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
