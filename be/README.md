# FastAPI Production App (recreated)

This repository contains a production-style FastAPI backend skeleton with MongoDB and Telethon-based Telegram storage.

Quick start:

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and update credentials.

3. Run dev server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API endpoints available under `/api/v1`.
