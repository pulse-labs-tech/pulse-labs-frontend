import os
import subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# 1. Configuration & Paths
artifact_dir = r"C:\Users\Nhu Tuan\Gemini\antigravity\brain\9b519510-2a66-476b-ae03-23a0ad93723d"
# Resolve correct path dynamically in case of case mismatch
actual_artifact_dir = r"C:\Users\Nhu Tuan\.gemini\antigravity\brain\9b519510-2a66-476b-ae03-23a0ad93723d"
if not os.path.exists(actual_artifact_dir):
    actual_artifact_dir = artifact_dir

scratch_dir = r"C:\Users\Nhu Tuan\.gemini\antigravity\scratch"
frames_dir = os.path.join(scratch_dir, "frames")
os.makedirs(frames_dir, exist_ok=True)

public_videos_dir = r"c:\Users\Nhu Tuan\Pulse_LLM_Knowledge_Final_Docs\pulse-labs-frontend\public\videos"
hls_dir = os.path.join(public_videos_dir, "hls")
os.makedirs(hls_dir, exist_ok=True)

# Screenshots selection
image_files = [
    ("media__1779552209739.png", "PIPELINE: Nạp tài liệu & Tự động Chuẩn hóa Tri thức"),
    ("media__1779475321625.png", "AI QUERY: Hỏi đáp Trí tuệ Nhân tạo có Nguồn trích dẫn"),
    ("media__1779383041292.png", "DASHBOARD: Giám sát Dung lượng & Hoạt động KB Chuyên ngành"),
    ("media__1779382117361.png", "PERSONAL WIKI: Kho lưu trữ Concepts & Tích lũy Domain Chuyên sâu")
]

# Canvas properties
width, height = 1280, 720
fps = 30
slide_duration = 5 # seconds (4s static + 1s fade)
total_slides = len(image_files)
total_frames = slide_duration * total_slides * fps # 600 frames (20s)

# Load font
font_path = r"C:\Windows\Fonts\segoeui.ttf"
if not os.path.exists(font_path):
    font_path = r"C:\Windows\Fonts\arial.ttf"
if not os.path.exists(font_path):
    font_path = None # Fallback to default

# 2. Render Static Slides (Slide Image + border + glow + soft vignette + text)
slide_images = []

for idx, (filename, caption) in enumerate(image_files):
    img_path = os.path.join(actual_artifact_dir, filename)
    print(f"Rendering slide {idx+1}/{total_slides}: {filename}...")
    
    # Create black canvas
    canvas = Image.new("RGB", (width, height), (0, 0, 0))
    
    # Open screenshot
    screenshot = Image.open(img_path)
    sw, sh = screenshot.size
    
    # Scale screenshot to fit inside container box (approx 980x550)
    max_sw, max_sh = 980, 540
    scale = min(max_sw / sw, max_sh / sh)
    target_sw, target_sh = int(sw * scale), int(sh * scale)
    screenshot_resized = screenshot.resize((target_sw, target_sh), Image.Resampling.LANCZOS)
    
    # Positions
    x_offset = (width - target_sw) // 2
    y_offset = (height - target_sh) // 2
    
    # Create blurred vignette mask to fade edges to black
    mask = Image.new("L", (target_sw, target_sh), 255)
    mask_draw = ImageDraw.Draw(mask)
    # Draw black borders on mask to start fade early
    fade_px = 65
    mask_draw.rectangle([0, 0, target_sw, target_sh], fill=255)
    # Apply soft black borders
    for i in range(fade_px):
        opacity = int(255 * (i / fade_px))
        mask_draw.rectangle([i, i, target_sw - i - 1, target_sh - i - 1], outline=opacity)
    
    # Blur mask for extremely smooth vignette fade
    mask = mask.filter(ImageFilter.GaussianBlur(30))
    
    # Paste screenshot onto black canvas using vignette mask
    canvas.paste(screenshot_resized, (x_offset, y_offset), mask)
    
    # No outline, borders, HUD labels, or caption pills - pure frameless mockup
    slide_images.append(canvas)

# 3. Generate Blend Frame Sequence
print("Generating frame sequence...")
for f in range(total_frames):
    slide_idx = f // (slide_duration * fps)
    frame_in_slide = f % (slide_duration * fps)
    
    # Transition boundary
    transition_start = (slide_duration - 1) * fps # Last 1 second is fade transition
    
    if frame_in_slide < transition_start:
        # Static phase
        frame_img = slide_images[slide_idx]
    else:
        # Transition phase
        next_slide_idx = (slide_idx + 1) % total_slides
        progress = (frame_in_slide - transition_start) / (1 * fps) # 0.0 to 1.0
        
        # Smooth ease-in-out transition curve
        # cosine interpolation
        import math
        alpha = (1 - math.cos(progress * math.pi)) / 2
        
        frame_img = Image.blend(slide_images[slide_idx], slide_images[next_slide_idx], alpha)
        
    frame_path = os.path.join(frames_dir, f"frame_{f:04d}.png")
    frame_img.save(frame_path)

print(f"Successfully generated {total_frames} frames under {frames_dir}")

# 4. Compile to MP4 using FFmpeg
print("Compiling video using FFmpeg...")
mp4_output = os.path.join(scratch_dir, "showcase.mp4")

# Override existing mp4 if exists
if os.path.exists(mp4_output):
    os.remove(mp4_output)

# FFmpeg command
# -y: overwrite output
# -f image2: sequence of images
# -r 30: input framerate
# -i frame_%04d.png: image file pattern
# -c:v libx264: H.264 video codec
# -pix_fmt yuv420p: standard pixel format for web compatibility
# -crf 18: high-quality constant rate factor
ffmpeg_cmd = [
    "ffmpeg", "-y",
    "-f", "image2",
    "-r", str(fps),
    "-i", os.path.join(frames_dir, "frame_%04d.png"),
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-crf", "18",
    mp4_output
]

print("Executing: " + " ".join(ffmpeg_cmd))
subprocess.run(ffmpeg_cmd, check=True)
print(f"Successfully created showcase video: {mp4_output}")

# 5. Convert to HLS (HTTP Live Streaming)
print("Converting showcase.mp4 to HLS...")
# Target output playlist: public/videos/hls/playlist.m3u8
hls_playlist = os.path.join(hls_dir, "playlist.m3u8")

# Clear existing segments if any
for f in os.listdir(hls_dir):
    if f.endswith(".ts") or f.endswith(".m3u8"):
        os.remove(os.path.join(hls_dir, f))

hls_cmd = [
    "ffmpeg", "-y",
    "-i", mp4_output,
    "-codec:v", "copy", # Copy video directly without re-encoding to save time/quality
    "-map", "0",
    "-f", "hls",
    "-hls_time", "4", # 4-second chunks
    "-hls_playlist_type", "vod", # VOD playlist
    "-hls_segment_filename", os.path.join(hls_dir, "segment_%03d.ts"),
    hls_playlist
]

print("Executing: " + " ".join(hls_cmd))
subprocess.run(hls_cmd, check=True)
print(f"Successfully generated HLS stream folder under: {hls_dir}")
