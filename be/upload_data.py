#!/usr/bin/env python3
"""
Data Upload Script for Sikkim Tourism
Uploads location data from CSV and images to backend and CDN.

IMPORTANT COORDINATE SYSTEM:
- Backend uses position: { x: longitude, y: latitude }
- CSV provides: Latitude, Longitude columns
- This script correctly maps: x=longitude, y=latitude
"""

import asyncio
import csv
import os
import httpx
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime
from typing import List, Dict, Optional
import json

# Load environment variables
load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME")

# CDN Configuration
CDN_URL = "https://models.shrishesha.space/api/media/upload"
CDN_API_KEY = "promatrs@25"

# Paths
DATA_DIR = Path(__file__).parent.parent / "app-data"
CSV_FILE = DATA_DIR / "data.csv"
PANO_CSV_FILE = DATA_DIR / "pano.csv"
PHOTOS_DIR = DATA_DIR / "photos"


class DataUploader:
    def __init__(self):
        self.client = None
        self.db = None
        self.uploaded_images = {}
        self.failed_uploads = []
    
    async def connect(self):
        """Connect to MongoDB"""
        self.client = AsyncIOMotorClient(MONGODB_URL)
        self.db = self.client[MONGODB_DB_NAME]
        print(f"✓ Connected to MongoDB: {MONGODB_DB_NAME}")
    
    async def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            print("\n✓ MongoDB connection closed")
    
    async def download_and_upload_panorama_to_cdn(self, pano_url: str, location_name: str) -> Optional[str]:
        """
        Process panorama URL - for panoramas we use Google's CDN directly
        since they serve high quality without compression
        """
        try:
            # Verify the URL works
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                print(f"   Verifying panorama URL...", end=" ")
                response = await client.head(pano_url)
                
                if response.status_code == 200:
                    print(f"✓ Valid (Google CDN)")
                    # Return the high-quality Google URL directly
                    # Google's CDN is fast and doesn't compress further
                    return pano_url
                else:
                    print(f"✗ Invalid URL: {response.status_code}")
                    return None
                    
        except Exception as e:
            print(f"✗ Error: {str(e)}")
            self.failed_uploads.append({
                'location': location_name,
                'file': 'panorama-360',
                'error': str(e)
            })
            return None
    
    async def upload_image_to_cdn(self, image_path: Path, location_name: str, image_index: int) -> Optional[str]:
        """Upload a single image to CDN with unique filename"""
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                with open(image_path, 'rb') as f:
                    # Create unique filename: location-name-index.extension
                    # Example: umiam-lake-0.jpg, umiam-lake-1.jpg
                    safe_location_name = location_name.lower().replace(' ', '-').replace('_', '-')
                    file_ext = image_path.suffix.lower()
                    unique_filename = f"{safe_location_name}-{image_index}{file_ext}"
                    
                    files = {
                        'file': (unique_filename, f, 'image/jpeg')
                    }
                    headers = {
                        'x-api-key': CDN_API_KEY
                    }
                    
                    print(f"   Uploading {image_path.name} as {unique_filename}...", end=" ")
                    response = await client.post(CDN_URL, files=files, headers=headers)
                    
                    if response.status_code == 200:
                        data = response.json()
                        # Get filename from response
                        filename = data.get('filename')
                        
                        if filename:
                            # Construct URL using FastAPI backend CDN endpoint
                            url = f"http://10.0.0.5:8000/api/v1/cdn/images/{filename}"
                        else:
                            # Fallback: try to get URL from response
                            url = data.get('cdnUrl') or data.get('url') or data.get('fileUrl')
                            if url and 'localhost' in url:
                                url = url.replace('localhost:3000', '10.0.0.5:8000/api/v1/cdn')
                        
                        print(f"✓ {url}")
                        return url
                    else:
                        print(f"✗ Failed: {response.status_code}")
                        self.failed_uploads.append({
                            'location': location_name,
                            'file': image_path.name,
                            'error': f"HTTP {response.status_code}"
                        })
                        return None
        except Exception as e:
            print(f"✗ Error: {str(e)}")
            self.failed_uploads.append({
                'location': location_name,
                'file': image_path.name,
                'error': str(e)
            })
            return None
    
    async def upload_location_images(self, location_name: str) -> List[str]:
        """Upload all images for a location with unique filenames"""
        # Try to find the photo folder with case-insensitive and flexible matching
        photo_folder = None
        
        # First try exact match
        exact_match = PHOTOS_DIR / location_name
        if exact_match.exists():
            photo_folder = exact_match
        else:
            # Try case-insensitive and flexible matching
            location_normalized = location_name.lower().strip()
            for folder in PHOTOS_DIR.iterdir():
                if folder.is_dir():
                    folder_normalized = folder.name.lower().strip()
                    
                    # Try various normalizations
                    if folder_normalized == location_normalized:
                        photo_folder = folder
                        break
                    # Handle underscore ↔ apostrophe conversions
                    elif folder_normalized.replace('_', "'") == location_normalized:
                        photo_folder = folder
                        break
                    elif folder_normalized.replace("'", "_") == location_normalized:
                        photo_folder = folder
                        break
                    # Handle spaces removal
                    elif folder_normalized.replace(' ', '') == location_normalized.replace(' ', ''):
                        photo_folder = folder
                        break
                    # Handle partial matches (e.g., "Hanging Bridge Walk" → "Hanging Bridge")
                    elif folder_normalized in location_normalized or location_normalized in folder_normalized:
                        # Check if it's a significant match (not just one word)
                        if len(folder_normalized) > 5 and len(location_normalized) > 5:
                            photo_folder = folder
                            break
            
            if photo_folder:
                print(f"   📁 Matched '{location_name}' → '{photo_folder.name}'")
        
        if not photo_folder or not photo_folder.exists():
            print(f"   ⚠️  No photos folder found for: {location_name}")
            return []
        
        image_urls = []
        image_files = sorted([f for f in photo_folder.iterdir() if f.suffix.lower() in ['.jpg', '.jpeg', '.png']])
        
        if not image_files:
            print(f"   ⚠️  No images found in: {photo_folder.name}")
            return []
        
        print(f"   Found {len(image_files)} image(s) in {photo_folder.name}")
        
        for index, image_file in enumerate(image_files):
            url = await self.upload_image_to_cdn(image_file, location_name, index)
            if url:
                image_urls.append(url)
        
        return image_urls
    
    def parse_coordinates(self, coord_str: str, lat: str, lon: str) -> tuple:
        """Parse coordinates from CSV"""
        try:
            # Try to use lat/lon columns first
            if lat and lon and lat != '–' and lon != '–':
                return float(lat), float(lon)
            
            # Fallback to parsing coordinate string
            # This is a simplified parser - may need adjustment based on actual data
            return None, None
        except (ValueError, TypeError):
            return None, None
    
    def clean_description(self, desc: str) -> tuple:
        """
        Split description into short and long descriptions
        Short: First sentence or up to 150 chars
        Long: Full description
        """
        if not desc:
            return "", ""
        
        desc = desc.strip()
        
        # Try to get first sentence for short description
        first_sentence_end = desc.find('. ')
        if first_sentence_end > 0 and first_sentence_end < 200:
            short_desc = desc[:first_sentence_end + 1].strip()
        else:
            # Otherwise take first 150 chars
            short_desc = (desc[:147] + '...') if len(desc) > 150 else desc
        
        return short_desc, desc
    
    def categorize_location(self, name: str, description: str) -> str:
        """Categorize location based on name and description"""
        name_lower = name.lower()
        desc_lower = description.lower()
        
        # Adventure/Activity keywords
        if any(word in name_lower or word in desc_lower for word in 
               ['adventure', 'zipline', 'water sports', 'trek', 'cave', 'peak', 'hanging bridge']):
            return 'tourism'
        
        # Food/Cafe keywords
        if any(word in name_lower for word in ['cafe', 'restaurant', 'food']):
            return 'business'
        
        # Shopping/Market keywords
        if any(word in name_lower or word in desc_lower for word in ['bazaar', 'market', 'shopping']):
            return 'business'
        
        # Cultural/Heritage keywords
        if any(word in name_lower or word in desc_lower for word in 
               ['museum', 'culture', 'heritage', 'tribal', 'village', 'monolith']):
            return 'tourism'
        
        # Natural attractions
        if any(word in name_lower or word in desc_lower for word in 
               ['falls', 'lake', 'peak', 'valley', 'forest', 'garden', 'viewpoint']):
            return 'tourism'
        
        # Default to tourism
        return 'tourism'
    
    async def read_pano_csv_data(self) -> Dict[str, str]:
        """Read panorama 360 image URLs from CSV and upgrade resolution"""
        print("\n📄 Reading panorama CSV data...")
        
        pano_map = {}
        
        if not PANO_CSV_FILE.exists():
            print(f"   ⚠️  Panorama CSV not found: {PANO_CSV_FILE}")
            return pano_map
        
        with open(PANO_CSV_FILE, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                location_name = row['Location '].strip()
                pano_url = row['360 Image'].strip()
                
                # Upgrade resolution to maximum quality
                # Remove any existing size parameters and request maximum resolution
                if '=w' in pano_url:
                    # Remove existing size params
                    base_url = pano_url.split('=w')[0]
                    # Request maximum resolution: 3200x1600 for equirectangular panoramas
                    upgraded_url = f"{base_url}=w3200-h1600-k-no"
                else:
                    upgraded_url = pano_url
                
                pano_map[location_name] = upgraded_url
                print(f"   📸 {location_name}: {upgraded_url[:80]}...")
        
        print(f"   ✓ Found {len(pano_map)} panorama images (upgraded to max resolution)")
        return pano_map
    
    async def read_csv_data(self) -> List[Dict]:
        """Read and parse CSV data"""
        print("\n📄 Reading CSV data...")
        
        locations = []
        
        with open(CSV_FILE, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                location_name = row['Location '].strip()
                description = row['Description '].strip()
                
                # Parse coordinates
                lat, lon = self.parse_coordinates(
                    row['Coordinates'],
                    row['Latitude'],
                    row['Longitude']
                )
                
                if lat is None or lon is None:
                    print(f"   ⚠️  Invalid coordinates for: {location_name}")
                    continue
                
                # Clean descriptions
                short_desc, long_desc = self.clean_description(description)
                
                # Categorize
                location_type = self.categorize_location(location_name, description)
                
                locations.append({
                    'name': location_name,
                    'description': long_desc,
                    'short_description': short_desc,
                    'latitude': lat,
                    'longitude': lon,
                    'type': location_type,
                    'coordinates_str': row['Coordinates']
                })
        
        print(f"   ✓ Parsed {len(locations)} locations from CSV")
        return locations
    
    async def create_location_in_db(self, location_data: Dict, image_urls: List[str], pano_url: Optional[str] = None) -> bool:
        """Create location document in database"""
        try:
            # Prepare metadata
            metadata = {
                'images': image_urls,
                'coordinates_original': location_data['coordinates_str'],
                'image_count': len(image_urls),
                'imported': True,
                'imported_at': datetime.utcnow().isoformat()
            }
            
            # Add panorama URL if available
            if pano_url:
                metadata['panorama_360'] = pano_url
            
            # Prepare location document
            # NOTE: Backend position uses x=longitude, y=latitude
            location_doc = {
                'name': location_data['name'],
                'description': location_data['description'],
                'short_description': location_data['short_description'],
                'position': {
                    'x': location_data['longitude'],  # x = longitude
                    'y': location_data['latitude']     # y = latitude
                },
                'type': location_data['type'],
                'metadata': metadata,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            # Insert into database (collection name is 'locations' not 'places')
            result = await self.db.locations.insert_one(location_doc)
            
            print(f"   ✓ Created location in DB: {location_data['name']} (ID: {result.inserted_id})")
            return True
            
        except Exception as e:
            print(f"   ✗ Failed to create location: {str(e)}")
            self.failed_uploads.append({
                'location': location_data['name'],
                'file': 'database',
                'error': str(e)
            })
            return False
    
    async def upload_all_data(self):
        """Main upload process"""
        print("\n" + "=" * 80)
        print("DATA UPLOAD UTILITY - SIKKIM TOURISM")
        print("=" * 80)
        
        # Read CSV data
        locations = await self.read_csv_data()
        
        if not locations:
            print("\n❌ No valid locations found in CSV")
            return
        
        # Read panorama data
        pano_map = await self.read_pano_csv_data()
        
        print(f"\n📤 Starting upload process for {len(locations)} locations...")
        print("=" * 80)
        
        success_count = 0
        pano_added_count = 0
        
        for i, location in enumerate(locations, 1):
            print(f"\n[{i}/{len(locations)}] Processing: {location['name']}")
            print("-" * 80)
            
            # Upload images
            image_urls = await self.upload_location_images(location['name'])
            
            # Check for panorama URL and download/upload to CDN
            pano_cdn_url = None
            pano_google_url = pano_map.get(location['name'])
            if pano_google_url:
                print(f"   🌐 Processing 360° panorama...")
                pano_cdn_url = await self.download_and_upload_panorama_to_cdn(pano_google_url, location['name'])
                if pano_cdn_url:
                    pano_added_count += 1
            
            # Create location in database
            if await self.create_location_in_db(location, image_urls, pano_cdn_url):
                success_count += 1
            
            # Small delay to avoid overwhelming the CDN
            await asyncio.sleep(0.5)
        
        # Summary
        print("\n" + "=" * 80)
        print("UPLOAD SUMMARY")
        print("=" * 80)
        print(f"Total locations processed: {len(locations)}")
        print(f"Successfully uploaded: {success_count}")
        print(f"360° panoramas added: {pano_added_count}")
        print(f"Failed: {len(locations) - success_count}")
        
        if self.failed_uploads:
            print(f"\n⚠️  {len(self.failed_uploads)} upload failures:")
            for failure in self.failed_uploads[:10]:  # Show first 10 failures
                print(f"   - {failure['location']}: {failure['file']} - {failure['error']}")
            if len(self.failed_uploads) > 10:
                print(f"   ... and {len(self.failed_uploads) - 10} more")
        
        print("\n✅ Upload process completed!")
    
    async def verify_data(self):
        """Verify uploaded data in database"""
        print("\n" + "=" * 80)
        print("DATA VERIFICATION")
        print("=" * 80)
        
        # Count locations (collection name is 'locations')
        count = await self.db.locations.count_documents({})
        print(f"Total locations in database: {count}")
        
        # Sample locations
        cursor = self.db.locations.find({}).limit(5)
        locations = await cursor.to_list(length=5)
        
        print(f"\nSample locations:")
        for loc in locations:
            image_count = len(loc.get('metadata', {}).get('images', []))
            # Show coordinates in human-readable format (lat, lon)
            pos = loc.get('position', {})
            lat = pos.get('y', 'N/A')  # y = latitude
            lon = pos.get('x', 'N/A')  # x = longitude
            print(f"  - {loc['name']}: {image_count} images, type: {loc.get('type', 'N/A')}, coords: ({lat}, {lon})")
        
        # Statistics
        pipeline = [
            {
                '$group': {
                    '_id': '$type',
                    'count': {'$sum': 1}
                }
            }
        ]
        stats = await self.db.locations.aggregate(pipeline).to_list(length=None)
        
        print(f"\nLocations by type:")
        for stat in stats:
            print(f"  - {stat['_id']}: {stat['count']}")


async def main():
    """Main function"""
    import sys
    
    uploader = DataUploader()
    await uploader.connect()
    
    if len(sys.argv) > 1 and sys.argv[1] == "verify":
        # Verify mode - just check what's in the database
        await uploader.verify_data()
    else:
        # Upload mode
        print("\n⚠️  This will upload all location data and images to the backend and CDN.")
        print("Make sure:")
        print("  1. Backend server is running")
        print("  2. CDN is accessible")
        print("  3. You have the correct API keys in .env")
        
        response = input("\nProceed with upload? (yes/no): ").strip().lower()
        
        if response == "yes" or response == 'y':
            await uploader.upload_all_data()
            await uploader.verify_data()
        else:
            print("\n❌ Upload cancelled")
    
    await uploader.close()


if __name__ == "__main__":
    asyncio.run(main())
