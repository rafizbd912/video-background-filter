import logging
import os
import uuid

import cv2
import numpy as np
import mediapipe as mp

# Initialize Mediapipe SelfieSegmentation model once
mp_selfie_segmentation = mp.solutions.selfie_segmentation
selfie_segmentation = mp_selfie_segmentation.SelfieSegmentation(model_selection=1)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_temp_path():
    temp_dir = os.path.join(os.path.dirname(__file__), "temp")
    os.makedirs(temp_dir, exist_ok=True)
    random_filename = f"temp_{str(uuid.uuid4())[:8]}"
    return os.path.join(temp_dir, random_filename)

def process_frame_with_background_filter(img):
    """Apply grayscale to background while keeping person in color using Mediapipe segmentation."""
    try:
        # Convert image to RGB for Mediapipe
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = selfie_segmentation.process(rgb)
        mask = results.segmentation_mask  # float32 0-1
        if mask is None:
            logger.warning("Segmentation mask not returned, falling back to original frame")
            return img

        # Threshold the mask to create binary person mask
        binary_mask = (mask > 0.1).astype(np.uint8) * 255  # 0.1 threshold works well

        # Smooth mask edges
        binary_mask = cv2.GaussianBlur(binary_mask, (31, 31), 0)

        # Prepare masks for blending
        mask_3 = cv2.cvtColor(binary_mask, cv2.COLOR_GRAY2BGR).astype(np.float32) / 255.0

        # Grayscale background
        background_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        background_gray = cv2.cvtColor(background_gray, cv2.COLOR_GRAY2BGR)

        output = img.astype(np.float32) * mask_3 + background_gray.astype(np.float32) * (1 - mask_3)
        return output.astype(np.uint8)
    except Exception as e:
        logger.error(f"Error in Mediapipe processing: {e}")
        return img