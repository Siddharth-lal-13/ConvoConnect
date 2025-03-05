import os
import time

def save_chat_log(message):
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    filepath = f"recordings/chat_log_{timestamp}.txt"
    os.makedirs("recordings", exist_ok=True)
    with open(filepath, "a") as f:
        f.write(f"{time.ctime()}: {message}\n")
    print(f"Chat saved to {filepath}")

def save_file(filename, content):
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    filepath = f"recordings/{timestamp}_{filename}"
    os.makedirs("recordings", exist_ok=True)
    with open(filepath, "w") as f:
        f.write(content)
    print(f"File saved to {filepath}")

def save_screen_capture():
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    filepath = f"recordings/screen_{timestamp}.txt"  # Placeholder
    os.makedirs("recordings", exist_ok=True)
    with open(filepath, "w") as f:
        f.write("Simulated screen capture")
    print(f"Screen saved to {filepath}")