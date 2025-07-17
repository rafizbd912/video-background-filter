from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import logging
from helpers import *
import numpy as np
import cv2

app = Flask(__name__)
cors = CORS(app)

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route("/hello-world", methods=["GET"])
def hello_world():
    try:
        return jsonify({"Hello": "World"}), 200
    except Exception as e:
        logger.error(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/detect", methods=["POST"])
def detect_and_filter():
    try:
        # Check if file is in request
        if 'frame' not in request.files:
            return jsonify({"error": "No frame provided"}), 400
        
        file = request.files['frame']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Read image from uploaded file
        file_bytes = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        
        if img is None:
            return jsonify({"error": "Could not decode image"}), 400
        
        # Process the frame with face detection and background filtering
        processed_frame = process_frame_with_background_filter(img)
        
        # Encode processed frame as JPEG
        success, encoded_img = cv2.imencode('.jpg', processed_frame)
        if not success:
            return jsonify({"error": "Could not encode processed frame"}), 500
        
        # Return the processed frame as bytes
        return encoded_img.tobytes(), 200, {'Content-Type': 'image/jpeg'}
        
    except Exception as e:
        logger.error(f"Error in detect endpoint: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8080, debug=True, use_reloader=False)
