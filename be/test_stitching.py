#!/usr/bin/env python3
"""
Test script for panorama stitching service
Usage: python test_stitching.py <image_folder> [output.jpg]
"""
import sys
import os
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent))

from app.services.panorama_service import panorama_stitcher


def test_stitching(image_folder: str, output_path: str = "panorama_output.jpg"):
    """
    Test panorama stitching with images from a folder
    
    Args:
        image_folder: Path to folder containing images
        output_path: Path to save stitched panorama
    """
    folder = Path(image_folder)
    
    if not folder.exists():
        print(f"❌ Error: Folder '{image_folder}' does not exist")
        return False
    
    # Get all image files (sorted alphabetically)
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}
    image_files = sorted([
        str(f) for f in folder.iterdir()
        if f.suffix.lower() in image_extensions
    ])
    
    if len(image_files) == 0:
        print(f"❌ Error: No images found in '{image_folder}'")
        return False
    
    print(f"📸 Found {len(image_files)} images:")
    for i, img in enumerate(image_files, 1):
        print(f"   {i}. {Path(img).name}")
    
    if len(image_files) < 2:
        print(f"❌ Error: Need at least 2 images to stitch (found {len(image_files)})")
        return False
    
    if len(image_files) > 20:
        print(f"⚠️  Warning: Found {len(image_files)} images. Using first 20 only.")
        image_files = image_files[:20]
    
    print(f"\n🔧 Starting stitching process...")
    print(f"   Mode: auto")
    print(f"   Output: {output_path}")
    print(f"   This may take 10-60 seconds...\n")
    
    # Perform stitching
    success, error_msg = panorama_stitcher.stitch_images(
        image_paths=image_files,
        output_path=output_path,
        mode='auto'
    )
    
    if success:
        # Get output image dimensions
        import cv2
        result_img = cv2.imread(output_path)
        h, w = result_img.shape[:2]
        ratio = w / h
        
        print(f"✅ SUCCESS! Panorama created:")
        print(f"   📁 Location: {output_path}")
        print(f"   📐 Dimensions: {w}x{h} pixels")
        print(f"   📊 Aspect Ratio: {ratio:.2f}:1")
        print(f"   🖼️  Images Stitched: {len(image_files)}")
        print(f"   ✓ 360° Compatible: {'Yes' if abs(ratio - 2.0) < 0.1 else 'No'}")
        
        # File size
        file_size = os.path.getsize(output_path)
        size_mb = file_size / (1024 * 1024)
        print(f"   💾 File Size: {size_mb:.2f} MB")
        
        return True
    else:
        print(f"❌ STITCHING FAILED:")
        print(f"   {error_msg}")
        print(f"\n💡 Tips:")
        print(f"   • Ensure images overlap by 30-40%")
        print(f"   • Images should be taken from the same location")
        print(f"   • Use consistent exposure and focus")
        print(f"   • Keep camera level (avoid tilting)")
        return False


def main():
    if len(sys.argv) < 2:
        print("Usage: python test_stitching.py <image_folder> [output.jpg]")
        print("\nExample:")
        print("  python test_stitching.py test_images/ my_panorama.jpg")
        sys.exit(1)
    
    image_folder = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else "panorama_output.jpg"
    
    print("=" * 60)
    print("🌄 PANORAMA STITCHING TEST")
    print("=" * 60)
    print()
    
    success = test_stitching(image_folder, output_path)
    
    print()
    print("=" * 60)
    
    if success:
        print("✅ Test completed successfully!")
    else:
        print("❌ Test failed. Check error messages above.")
    
    print("=" * 60)
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
