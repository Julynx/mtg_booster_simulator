import os
from PIL import Image

BOOSTERS_DIR = 'public/assets/boosters/'
TARGET_HEIGHT = 300 # Desired height for all booster images

def process_booster_images():
    """
    Autocrops all images and then resizes them to a consistent height.
    """
    image_files = [f for f in os.listdir(BOOSTERS_DIR) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    
    if not image_files:
        print("No image files found in the boosters directory.")
        return

    print("Processing images: Autocropping and resizing to consistent height...")
    for filename in image_files:
        filepath = os.path.join(BOOSTERS_DIR, filename)
        try:
            img = Image.open(filepath).convert("RGBA")
            
            # Autocrop (remove transparent borders)
            # getbbox() returns (left, upper, right, lower) bounding box of the non-transparent region
            bbox = img.getbbox()
            if bbox:
                cropped_img = img.crop(bbox)
            else:
                cropped_img = img # No opaque pixels, keep as is or handle as error

            # Resize to target height, maintaining aspect ratio
            width, height = cropped_img.size
            if height == 0: # Avoid division by zero if image is empty after crop
                print(f"  Skipping {filename}: Image has zero height after cropping.")
                continue

            scale_factor = TARGET_HEIGHT / height
            new_width = int(width * scale_factor)
            new_height = TARGET_HEIGHT
            
            # Ensure new dimensions are at least 1x1
            new_width = max(1, new_width)
            new_height = max(1, new_height)

            resized_img = cropped_img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Save the processed image, overwriting the original
            resized_img.save(filepath)
            print(f"  Processed {filename}: Cropped and resized to {new_width}x{new_height}")

        except Exception as e:
            print(f"Error processing {filename}: {e}")

    print("\nImage processing complete.")

if __name__ == "__main__":
    process_booster_images()
