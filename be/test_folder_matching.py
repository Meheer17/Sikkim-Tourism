#!/usr/bin/env python3
"""
Dry run to test folder matching logic
Tests if CSV location names can be matched to photo folders
"""

import csv
from pathlib import Path

# Paths
DATA_DIR = Path(__file__).parent.parent / "app-data"
CSV_FILE = DATA_DIR / "data.csv"
PHOTOS_DIR = DATA_DIR / "photos"

def find_photo_folder(location_name: str) -> tuple[Path | None, str]:
    """
    Find matching photo folder for a location name
    Returns: (folder_path, match_type)
    """
    # First try exact match
    exact_match = PHOTOS_DIR / location_name
    if exact_match.exists():
        return exact_match, "exact"
    
    # Try case-insensitive and flexible matching
    location_normalized = location_name.lower().strip()
    for folder in PHOTOS_DIR.iterdir():
        if folder.is_dir():
            folder_normalized = folder.name.lower().strip()
            
            # Try various normalizations
            if folder_normalized == location_normalized:
                return folder, "case-insensitive"
            elif folder_normalized.replace('_', "'") == location_normalized:
                return folder, "underscore→apostrophe"
            elif folder_normalized.replace("'", "_") == location_normalized:
                return folder, "apostrophe→underscore"
            elif folder_normalized.replace(' ', '') == location_normalized.replace(' ', ''):
                return folder, "no-spaces"
            # Handle partial matches (e.g., "Hanging Bridge Walk" → "Hanging Bridge")
            elif folder_normalized in location_normalized or location_normalized in folder_normalized:
                # Check if it's a significant match (not just one word)
                if len(folder_normalized) > 5 and len(location_normalized) > 5:
                    return folder, "partial-match"
    
    return None, "not-found"

def count_images(folder: Path) -> int:
    """Count images in a folder"""
    if not folder or not folder.exists():
        return 0
    return len([f for f in folder.iterdir() if f.suffix.lower() in ['.jpg', '.jpeg', '.png']])

def main():
    print("=" * 80)
    print("DRY RUN - FOLDER MATCHING TEST")
    print("=" * 80)
    
    # Read CSV
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        locations = [row['Location '].strip() for row in reader]
    
    print(f"\nTotal locations in CSV: {len(locations)}")
    print(f"Total folders in photos: {len([f for f in PHOTOS_DIR.iterdir() if f.is_dir()])}")
    
    print("\n" + "=" * 80)
    print("MATCHING RESULTS")
    print("=" * 80)
    
    matched = 0
    not_matched = 0
    total_images = 0
    
    for i, location in enumerate(locations, 1):
        folder, match_type = find_photo_folder(location)
        image_count = count_images(folder)
        
        if folder:
            matched += 1
            total_images += image_count
            status = "✓"
            folder_name = folder.name
        else:
            not_matched += 1
            status = "✗"
            folder_name = "NOT FOUND"
        
        # Show match details
        if match_type == "exact":
            print(f"{status} [{i:2d}] {location:35s} → {image_count} images")
        else:
            print(f"{status} [{i:2d}] {location:35s} → {folder_name:35s} ({match_type}) → {image_count} images")
    
    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Total locations:     {len(locations)}")
    print(f"Matched folders:     {matched} ({matched/len(locations)*100:.1f}%)")
    print(f"Not matched:         {not_matched}")
    print(f"Total images:        {total_images}")
    print(f"Average per matched: {total_images/matched if matched > 0 else 0:.1f}")
    
    # Show unmatched
    if not_matched > 0:
        print("\n" + "=" * 80)
        print("UNMATCHED LOCATIONS")
        print("=" * 80)
        for location in locations:
            folder, match_type = find_photo_folder(location)
            if not folder:
                print(f"  • {location}")
        
        print("\nAvailable folders not matched:")
        matched_folders = set()
        for location in locations:
            folder, _ = find_photo_folder(location)
            if folder:
                matched_folders.add(folder.name)
        
        all_folders = {f.name for f in PHOTOS_DIR.iterdir() if f.is_dir()}
        unmatched_folders = all_folders - matched_folders
        for folder_name in sorted(unmatched_folders):
            image_count = count_images(PHOTOS_DIR / folder_name)
            print(f"  • {folder_name} ({image_count} images)")

if __name__ == "__main__":
    main()
