from paddleocr import PaddleOCR
import sys
import json


def extract_texts_from_result(result):
	"""Handle various PaddleOCR/PaddleX result formats and return a flat list of texts."""
	texts = []
	if not result:
		return texts

	# Case: paddlex-style dict list (seen in this repo) where each page has 'rec_texts'
	if isinstance(result, list) and all(isinstance(p, dict) for p in result):
		for page in result:
			# rec_texts is a list of strings (may include empty strings)
			for t in page.get('rec_texts', []):
				if isinstance(t, str) and t.strip():
					texts.append(t.strip())
		return texts

	# Case: classic paddleocr list of lines: [(box, ('text', conf))] or [ [box, text, conf], ... ]
	for item in result:
		# tuple/list with nested text
		if isinstance(item, (list, tuple)):
			# formats: [box, (text, score)] or [box, text, score]
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
			# fallback for other dict shapes
			t = item.get('text') or item.get('rec_text') or item.get('transcription')
			if isinstance(t, str) and t.strip():
				texts.append(t.strip())

	return texts


try:
	# `use_angle_cls` is deprecated; use `use_textline_orientation` instead
	ocr = PaddleOCR(use_textline_orientation=True, lang='en')  # Replace with custom model later

	# prefer the newer API if available
	if hasattr(ocr, 'predict'):
		raw = ocr.predict('/Users/nandu/Development/college/SIH2025/ai-pipeline/image.png')
	else:
		raw = ocr.ocr('/Users/nandu/Development/college/SIH2025/ai-pipeline/image.png')

	texts = extract_texts_from_result(raw)
	# join into a single paragraph
	paragraph = ' '.join(texts)

	# If the paragraph is long, ensure it ends with a period.
	paragraph = paragraph.strip()
	if paragraph and paragraph[-1] not in '.!?':
		paragraph += '.'

	# print a short, user-friendly paragraph
	print(paragraph)

	# Also write a cleaned, JSON-serializable version of the raw result for inspection
	def make_serializable(obj):
		try:
			import numpy as _np
			if isinstance(obj, _np.ndarray):
				return obj.tolist()
			if _np.isscalar(obj):
				return obj.item()
		except Exception:
			pass

		if isinstance(obj, dict):
			return {k: make_serializable(v) for k, v in obj.items()}
		if isinstance(obj, (list, tuple)):
			return [make_serializable(v) for v in obj]

		# objects that expose tolist (PIL/NumPy-like)
		try:
			if hasattr(obj, 'tolist'):
				return obj.tolist()
		except Exception:
			pass

		# fallback: stringify
		try:
			return str(obj)
		except Exception:
			return None

	try:
		cleaned = make_serializable(raw)
		with open('transcribe_result.json', 'w', encoding='utf-8') as fh:
			json.dump(cleaned, fh, ensure_ascii=False, indent=2)
	except Exception:
		pass

except Exception as e:
	print("OCR initialization failed:", e, file=sys.stderr)
	print("If you're on macOS, this often means a missing native dependency.", file=sys.stderr)
	print("Install the 'netcdf' library via Homebrew and try again:", file=sys.stderr)
	print("  brew install netcdf", file=sys.stderr)
	raise