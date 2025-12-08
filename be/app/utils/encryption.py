"""
Encryption and Decryption Utilities for User Data

This module provides functions to encrypt and decrypt user text data using a combination
of a global PRIVATE_KEY and user-specific USERHASH from the database.

Encryption: AES-256-GCM (Galois/Counter Mode)
- Provides both confidentiality and authenticity
- 256-bit key derived from PRIVATE_KEY + USERHASH
- Random 12-byte IV (initialization vector) for each encryption
- Authentication tag for integrity verification
"""

import os
import hashlib
import base64
from typing import Optional
from bson import ObjectId
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.exceptions import InvalidTag
from app.core.database import get_database


async def encrypt_text(user_id: str, text: str) -> str:
    """
    Encrypt user text using PRIVATE_KEY + USERHASH.
    
    Args:
        user_id: The user's ID to fetch USERHASH from database
        text: The plaintext to encrypt
        
    Returns:
        Encrypted text (or original text if USERHASH is empty/None)
        
    Workflow:
        1. Retrieve PRIVATE_KEY from environment variables
        2. Fetch user document from database using user_id
        3. Extract USERHASH from user document
        4. Check if USERHASH is empty or None - if so, return text unchanged
        5. Compute encryption KEY = PRIVATE_KEY + USERHASH
        6. Initialize encryption cipher with KEY
        7. Convert plaintext to bytes
        8. Apply encryption algorithm (e.g., AES-256-GCM)
        9. Generate initialization vector (IV) for cipher
        10. Encrypt the text bytes using cipher
        11. Combine IV + encrypted bytes
        12. Encode result as base64 string
        13. Return encrypted text
    """
    # Step 1: Retrieve PRIVATE_KEY from environment
    private_key = os.getenv("PRIVATE_KEY", "")
    
    # Step 2: Fetch user document from database
    db = get_database()
    # Convert user_id string to ObjectId for MongoDB query
    if not ObjectId.is_valid(user_id):
        # Invalid ObjectId format, return text unchanged
        return text
    user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
    
    if not user_doc:
        # User not found, return text unchanged
        return text
    
    # Step 3: Extract USERHASH from user document
    userhash = user_doc.get("userhash", "")
    
    # Step 4: Check if USERHASH is empty or None
    if not userhash or userhash == "":
        # Return text unchanged if no USERHASH
        return text
    
    # Step 5: Compute encryption KEY = PRIVATE_KEY + USERHASH
    # Concatenate the private key and user hash
    combined_key_string = private_key + userhash
    
    # Step 6: Derive a 256-bit (32-byte) key using SHA-256 hash
    # This ensures we have a fixed-length key suitable for AES-256
    encryption_key_bytes = hashlib.sha256(combined_key_string.encode('utf-8')).digest()
    
    # Step 7: Initialize AES-256-GCM cipher with the derived key
    # GCM mode provides authenticated encryption (confidentiality + integrity)
    aesgcm = AESGCM(encryption_key_bytes)
    
    # Step 8: Generate a random 12-byte IV (initialization vector)
    # IV must be unique for each encryption operation
    # 12 bytes (96 bits) is the recommended size for GCM mode
    iv = os.urandom(12)
    
    # Step 9: Convert plaintext string to bytes using UTF-8 encoding
    plaintext_bytes = text.encode('utf-8')
    
    # Step 10: Encrypt the plaintext bytes using AES-256-GCM
    # The cipher automatically generates and appends the authentication tag
    # associated_data=None means no additional authenticated data
    ciphertext_with_tag = aesgcm.encrypt(iv, plaintext_bytes, associated_data=None)
    
    # Step 11: Combine IV + ciphertext+tag for storage
    # Format: [12 bytes IV][N bytes ciphertext][16 bytes auth tag]
    # We prepend IV so decryption knows which IV was used
    combined_bytes = iv + ciphertext_with_tag
    
    # Step 12: Encode the combined bytes as base64 string for safe text storage
    # Base64 encoding allows storing binary data in text fields (database, JSON, etc.)
    encrypted_text = base64.b64encode(combined_bytes).decode('utf-8')
    
    # Step 13: Return the encrypted text as a base64-encoded string
    return encrypted_text


async def decrypt_text(user_id: str, text: str) -> str:
    """
    Decrypt user text using PRIVATE_KEY + USERHASH.
    
    Args:
        user_id: The user's ID to fetch USERHASH from database
        text: The encrypted text to decrypt
        
    Returns:
        Decrypted plaintext (or original text if USERHASH is empty/None)
        
    Workflow:
        1. Retrieve PRIVATE_KEY from environment variables
        2. Fetch user document from database using user_id
        3. Extract USERHASH from user document
        4. Check if USERHASH is empty or None - if so, return text unchanged
        5. Compute decryption KEY = PRIVATE_KEY + USERHASH
        6. Decode base64 encrypted text to bytes
        7. Extract initialization vector (IV) from beginning of bytes
        8. Extract ciphertext from remaining bytes
        9. Initialize decryption cipher with KEY and IV
        10. Decrypt the ciphertext bytes using cipher
        11. Convert decrypted bytes to string
        12. Verify decryption success (e.g., check padding/authentication tag)
        13. Return decrypted plaintext
    """
    # Step 1: Retrieve PRIVATE_KEY from environment
    private_key = os.getenv("PRIVATE_KEY", "")
    
    # Step 2: Fetch user document from database
    db = get_database()
    # Convert user_id string to ObjectId for MongoDB query
    if not ObjectId.is_valid(user_id):
        # Invalid ObjectId format, return text unchanged
        return text
    user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
    
    if not user_doc:
        # User not found, return text unchanged
        return text
    
    # Step 3: Extract USERHASH from user document
    userhash = user_doc.get("userhash", "")
    
    # Step 4: Check if USERHASH is empty or None
    if not userhash or userhash == "":
        # Return text unchanged if no USERHASH
        return text
    
    # Step 5: Compute decryption KEY = PRIVATE_KEY + USERHASH
    # Must use the same key derivation process as encryption
    combined_key_string = private_key + userhash
    
    # Step 6: Derive a 256-bit (32-byte) key using SHA-256 hash
    # This must match the encryption key derivation exactly
    decryption_key_bytes = hashlib.sha256(combined_key_string.encode('utf-8')).digest()
    
    # Step 7: Decode base64 encrypted text back to bytes
    # This reverses the base64 encoding done during encryption
    try:
        combined_bytes = base64.b64decode(text.encode('utf-8'))
    except Exception as e:
        # If decoding fails, text might not be encrypted - return as is
        print(f"Base64 decode error: {e}")
        return text
    
    # Step 8: Extract the 12-byte IV from the beginning of the bytes
    # The IV is always the first 12 bytes (as stored during encryption)
    if len(combined_bytes) < 12:
        # Data too short to contain IV - return original text
        return text
    iv = combined_bytes[:12]
    
    # Step 9: Extract ciphertext+tag from the remaining bytes
    # Everything after the first 12 bytes is the encrypted data + auth tag
    ciphertext_with_tag = combined_bytes[12:]
    
    # Step 10: Initialize AES-256-GCM cipher with the derived key
    # Must use the same cipher mode (GCM) as encryption
    aesgcm = AESGCM(decryption_key_bytes)
    
    # Step 11: Decrypt the ciphertext using the cipher with IV
    # GCM mode automatically verifies the authentication tag
    # If tag verification fails, InvalidTag exception is raised
    try:
        plaintext_bytes = aesgcm.decrypt(iv, ciphertext_with_tag, associated_data=None)
    except InvalidTag:
        # Authentication tag verification failed - data may be corrupted or tampered
        print("Decryption failed: Invalid authentication tag")
        return text  # Return original text rather than raising error
    except Exception as e:
        # Other decryption errors
        print(f"Decryption error: {e}")
        return text
    
    # Step 12: Convert decrypted bytes back to string using UTF-8 decoding
    # This reverses the UTF-8 encoding done during encryption
    try:
        decrypted_text = plaintext_bytes.decode('utf-8')
    except UnicodeDecodeError as e:
        # If UTF-8 decoding fails, decryption likely failed
        print(f"UTF-8 decode error: {e}")
        return text
    
    # Step 13: Return the decrypted plaintext
    return decrypted_text
