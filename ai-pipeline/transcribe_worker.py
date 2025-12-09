from __future__ import annotations

import os
from typing import List

from pymongo import MongoClient
from bson import ObjectId

# Configuration
MONGO_URI: str = os.environ.get("MONGO_URI", "mongodb+srv://newuser:Pzt8hcnH0uu9BqUb@mycluster.mt6afrt.mongodb.net/?retryWrites=true&w=majority&appName=mycluster")
MONGO_DB: str = os.environ.get("MONGO_DB", "mona360")
 
import datetime
import requests
import tempfile
import shutil
import logging
from paddleocr import PaddleOCR
import json
from sentence_transformers import SentenceTransformer
import numpy as np
import pymongo

logging.basicConfig(level=logging.INFO)


def get_mongo_client():
	return MongoClient(MONGO_URI)


def get_today_files(db) -> list:
	"""Return documents from `files` collection whose `created_at` is today (UTC)."""
	start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
	end = start + datetime.timedelta(days=1)
	q = {"created_at": {"$gte": start, "$lt": end}}
	return list(db.files.find(q))


def download_image(url: str, dest_dir: str) -> str:
	"""Download the image at `url` into `dest_dir` and return the local path."""
	os.makedirs(dest_dir, exist_ok=True)
	local_name = os.path.basename(url.split('?')[0]) or f"img_{int(datetime.datetime.utcnow().timestamp())}.jpg"
	dest_path = os.path.join(dest_dir, local_name)
	logging.info("Downloading %s -> %s", url, dest_path)
	try:
		r = requests.get(url, stream=True, timeout=30)
		r.raise_for_status()
		with open(dest_path, 'wb') as fh:
			shutil.copyfileobj(r.raw, fh)
		return dest_path
	except Exception as e:
		logging.error("Failed to download %s: %s", url, e)
		raise


def extract_texts_from_result(result):
	# copy of helper from transcribe.py to normalize results
	texts = []
	if not result:
		return texts

	if isinstance(result, list) and all(isinstance(p, dict) for p in result):
		for page in result:
			for t in page.get('rec_texts', []):
				if isinstance(t, str) and t.strip():
					texts.append(t.strip())
		return texts

	for item in result:
		if isinstance(item, (list, tuple)):
			if len(item) >= 2:
				cand = item[1]
				if isinstance(cand, tuple) and isinstance(cand[0], str):
					txt = cand[0].strip()
					if txt:
						texts.append(txt)
				elif isinstance(cand, str):
					txt = cand.strip()
					if txt:
						texts.append(txt)
		elif isinstance(item, dict):
			t = item.get('text') or item.get('rec_text') or item.get('transcription')
			if isinstance(t, str) and t.strip():
				texts.append(t.strip())

	return texts


def ocr_image(image_path: str) -> dict:
	"""Run PaddleOCR on the image and return a small dict with paragraph and raw result (serialized).

	The returned dict is safe to store in Mongo (raw_result contains str/list primitives only).
	"""
	ocr = PaddleOCR(use_textline_orientation=True, lang='en')
	if hasattr(ocr, 'predict'):
		raw = ocr.predict(image_path)
	else:
		raw = ocr.ocr(image_path)

	texts = extract_texts_from_result(raw)
	paragraph = ' '.join(texts).strip()
	if paragraph and paragraph[-1] not in '.!?':
		paragraph += '.'

	# Minimal serialization: try to keep small, avoid dumping huge numpy arrays
	def make_small(obj):
		if isinstance(obj, dict):
			out = {}
			for k, v in obj.items():
				if k in ('rec_texts', 'rec_scores', 'rec_polys', 'rec_boxes'):
					out[k] = make_small(v)
			return out
		if isinstance(obj, (list, tuple)):
			result = []
			for v in obj:
				if isinstance(v, (str, int, float)):
					result.append(v)
				elif isinstance(v, (list, tuple)):
					# try to extract inner text
					if v and isinstance(v[0], (list, tuple)) and len(v) > 1:
						# e.g., [box, (text, score)]
						cand = v[1]
						if isinstance(cand, (list, tuple)) and len(cand) > 0:
							result.append(cand[0])
						elif isinstance(cand, str):
							result.append(cand)
					else:
						result.append(make_small(v))
				elif isinstance(v, dict):
					result.append(make_small(v))
				else:
					try:
						result.append(str(v))
					except Exception:
						result.append(None)
			return result
		return obj
	def make_serializable(obj):
		"""Recursively convert numpy arrays and numpy types into Python primitives/lists."""
		try:
			# handle numpy arrays and types
			if isinstance(obj, np.ndarray):
				return obj.tolist()
			if isinstance(obj, np.generic):
				return obj.item()
		except Exception:
			pass

		if isinstance(obj, dict):
			return {k: make_serializable(v) for k, v in obj.items()}
		if isinstance(obj, (list, tuple)):
			return [make_serializable(v) for v in obj]
		# falling back to JSON-serializable primitives
		try:
			# str, int, float, bool, None
			json.dumps(obj)
			return obj
		except Exception:
			try:
				return str(obj)
			except Exception:
				return None
	small = make_small(raw)
	# run serializer to ensure JSON safe types
	small_json_safe = make_serializable(small)
	return {"paragraph": paragraph, "raw_small": small_json_safe}


def extract_rec_scores_from_raw_small(raw_small):
	"""Extract rec_scores from a raw_small structure that may be a dict or list."""
	scores = []
	if not raw_small:
		return scores
	if isinstance(raw_small, dict):
		s = raw_small.get('rec_scores')
		if isinstance(s, (list, tuple)):
			scores.extend(s)
	elif isinstance(raw_small, (list, tuple)):
		for el in raw_small:
			if isinstance(el, dict):
				s = el.get('rec_scores')
				if isinstance(s, (list, tuple)):
					scores.extend(s)
	return scores


_embedding_model = None


def get_embedding_model(model_name: str = "all-MiniLM-L6-v2"):
	global _embedding_model
	if _embedding_model is None:
		_embedding_model = SentenceTransformer(model_name)
	return _embedding_model


def compute_embedding(text: str, model_name: str = "all-MiniLM-L6-v2") -> list:
	if not text:
		return None
	model = get_embedding_model(model_name)
	emb = model.encode([text], convert_to_numpy=True)[0]
	return emb.tolist()


def split_into_chunks(text: str, max_chars: int = 512):
	"""Split text into chunks no longer than `max_chars` by sentence boundaries."""
	if not text:
		return []
	# simple rule: split on newlines then sentences
	text = text.replace('\r', '\n')
	text = text.strip()
	if len(text) <= max_chars:
		return [text]
	# split into rough sentences using punctuation
	import re
	pieces = re.split(r'(?<=[.!?])\s+', text)
	chunks = []
	current = ''
	for s in pieces:
		if not s.strip():
			continue
		if len(current) + len(s) + 1 <= max_chars:
			current = (current + ' ' + s).strip()
		else:
			if current:
				chunks.append(current)
			current = s
	if current:
		chunks.append(current)
	return chunks


def process_today_files():
	client = get_mongo_client()
	db = client[MONGO_DB]
	files = get_today_files(db)
	logging.info('Found %d files created today', len(files))
	out_col = db.get_collection('transcriptions')
	# ensure unique file_id index
	try:
		out_col.create_index([('file_id', pymongo.ASCENDING)], unique=True)
	except Exception:
		pass

	tmpdir = os.path.join(os.getcwd(), 'tmp_images')
	os.makedirs(tmpdir, exist_ok=True)

	# collection for chunk vectors for KNN vector search
	vectors_col = db.get_collection('transcription_vectors')
	try:
		vectors_col.create_index([('file_id', pymongo.ASCENDING), ('chunk_index', pymongo.ASCENDING)], unique=True)
	except Exception:
		pass

	for f in files:
		try:
			file_id = f.get('_id')
			file_path = f.get('file_path') or f.get('cdn_response', {}).get('cdnUrl') or f.get('cdn_response', {}).get('fileUrl')
			if not file_path:
				logging.warning('No file path for doc %s; skipping', file_id)
				continue
			local = download_image(file_path, tmpdir)
			ocr_res = ocr_image(local)
			paragraph = ocr_res.get('paragraph')
			# compute average confidence if rec_scores exist
			avg_conf = None
			scores = []
			try:
				raw_small = ocr_res.get('raw_small')
				scores = extract_rec_scores_from_raw_small(raw_small)
				# flatten and convert
				parsed_scores = []
				for obj in scores:
					try:
						parsed_scores.append(float(obj))
					except Exception:
						pass
				if parsed_scores:
					avg_conf = float(np.mean(parsed_scores))
			except Exception:
				avg_conf = None

			# compute embedding
			emb = None
			try:
				emb = compute_embedding(paragraph)
			except Exception as e:
				logging.warning('Embedding failed: %s', e)

			# prepare doc for $set (without created_at to avoid conflict)
			logging.info(f'Processing file: {file_id}, l_id: {f.get("l_id")}, b_id: {f.get("b_id")}')
			print("\n" + "="*80)
			print(f"EXTRACTED TEXT FOR FILE: {file_id}")
			print(f"File Name: {f.get('file_name')}")
			print(f"Average Confidence: {avg_conf}")
			print("-"*80)
			print(paragraph)
			print("="*80 + "\n")
			doc_set = {
				'file_id': file_id,
				'file_name': f.get('file_name') if isinstance(f, dict) else None,
				'file_path': file_path,
				'local_path': local,
				'text': paragraph,
				'avg_confidence': avg_conf,
				'embedding': emb,
				'raw_small': ocr_res.get('raw_small'),
				'b_id': f.get('b_id'),
				'l_id': f.get('l_id'),
				'uploaded_by': f.get('uploaded_by'),
				'updated_at': datetime.datetime.utcnow(),
			}
			logging.info(f'Transcription doc to insert: file_id={file_id}, l_id={doc_set["l_id"]}, text_length={len(paragraph)}')
			# prepare doc for $setOnInsert (only created_at)
			doc_insert = {
				'created_at': datetime.datetime.utcnow(),
			}
			# upsert by file_id (avoid duplicates)
			result = out_col.update_one({'file_id': file_id}, {'$set': doc_set, '$setOnInsert': doc_insert}, upsert=True)
			# mark the source file as transcribed
			try:
				trans_id = None
				if result.upserted_id:
					trans_id = result.upserted_id
				else:
					# find existing doc's _id
					existing = out_col.find_one({'file_id': file_id}, projection={'_id': 1})
					trans_id = existing.get('_id') if existing else None
				# set marker
				if trans_id:
					db.files.update_one({'_id': file_id}, {'$set': {'transcribed': True, 'transcription_id': trans_id}})
			except Exception as e:
				logging.warning('Failed to mark file as transcribed: %s', e)

			# split into chunks and store vectors
			try:
				chunks = split_into_chunks(paragraph, max_chars=512)
				for idx, chunk in enumerate(chunks):
					emb_chunk = compute_embedding(chunk)
					chunk_set = {
						'file_id': file_id,
						'file_name': f.get('file_name') if isinstance(f, dict) else None,
						'chunk_index': idx,
						'text': chunk,
						'embedding': emb_chunk,
					}
					chunk_insert = {
						'created_at': datetime.datetime.utcnow(),
					}
					vectors_col.update_one({'file_id': file_id, 'chunk_index': idx}, {'$set': chunk_set, '$setOnInsert': chunk_insert}, upsert=True)
			except Exception as e:
				logging.warning('Failed to create chunks or vectors: %s', e)
			logging.info('Inserted transcription for %s', file_id)
		except Exception as e:
			logging.exception('Failed to process file: %s', e)


if __name__ == '__main__':
	process_today_files()


def search_vectors(query: str, db, k: int = 5, model_name: str = "all-MiniLM-L6-v2") -> list:
	"""Perform a local k-NN search over `transcription_vectors` by computing embeddings and returning top k matches.

	Note: This fallback does a brute-force scan — for production, use MongoDB Atlas vector search or Faiss.
	"""
	model = get_embedding_model(model_name)
	q_emb = model.encode([query], convert_to_numpy=True)[0]
	vectors_col = db.get_collection('transcription_vectors')
	# stream candidates
	results = []
	for doc in vectors_col.find({}, projection={'embedding': 1, 'text': 1, 'file_id': 1, 'chunk_index': 1, 'file_name': 1}):
		emb = doc.get('embedding')
		if not emb:
			continue
		try:
			score = float(np.dot(q_emb, np.array(emb)) / (np.linalg.norm(q_emb) * np.linalg.norm(np.array(emb))))
		except Exception:
			continue
		results.append({'score': score, 'doc': doc})
	results = sorted(results, key=lambda x: -x['score'])[:k]
	return results



