# AI Pipeline - Sentiment Analysis

This folder contains scripts for sentiment analysis and rating updates.

## Setup

1. **Create virtual environment** (if not already created):
   ```bash
   python -m venv venv
   ```

2. **Activate virtual environment**:
   ```bash
   # macOS/Linux
   source venv/bin/activate
   
   # Windows
   venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

## Scripts

### `update_sentiment_ratings.py`

Fetches comments from MongoDB, analyzes sentiment using the sentiment API, and updates service ratings.

**Features:**
- Fetches all comments from the `comments` collection
- Groups comments by service ID
- Sends comments to sentiment API in batches of 3
- Calculates overall sentiment score per service
- Normalizes sentiment to 0-5 rating scale
- Updates the `rating` field in the `services` collection

**Usage:**
```bash
# Make sure sentiment API is running on localhost:7050
python update_sentiment_ratings.py
```

**Configuration:**
The script uses environment variables from the parent `.env` file:
- `MONGODB_URL` - MongoDB connection string
- `MONGODB_DB_NAME` - Database name

**Sentiment API Endpoint:**
```
POST http://localhost:7050/sentiment/api/v1/classify
```

**Rating Normalization:**
- Sentiment scores are assumed to range from -1 (negative) to 1 (positive)
- Normalized to 0-5 scale: `-1 → 0`, `0 → 2.5`, `1 → 5`
