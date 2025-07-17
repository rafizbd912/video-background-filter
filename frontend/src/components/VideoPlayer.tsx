import React, { forwardRef, useEffect, useRef, useState, useCallback } from 'react';
import { API_BASE_URL } from '../consts';

interface VideoPlayerProps {
  src: string;
  onLoadedMetadata?: () => void;
}

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ src, onLoadedMetadata }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [processedFrameUrl, setProcessedFrameUrl] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const processedFrameUrlRef = useRef<string>('');
    const isProcessingRef = useRef<boolean>(false);

    const processFrame = useCallback(async (blob: Blob): Promise<string | null> => {
      try {
        console.log('Sending frame to backend, size:', blob.size);
        const formData = new FormData();
        formData.append('frame', blob, 'frame.jpg');

        const response = await fetch(`${API_BASE_URL}/detect`, {
          method: 'POST',
          body: formData,
        });

        console.log('Backend response status:', response.status);

        if (!response.ok) {
          console.error('Failed to process frame:', response.statusText);
          const errorText = await response.text();
          console.error('Error details:', errorText);
          return null;
        }

        const processedBlob = await response.blob();
        console.log('Received processed frame, size:', processedBlob.size);
        return URL.createObjectURL(processedBlob);
      } catch (error) {
        console.error('Error processing frame:', error);
        return null;
      }
    }, []);

    const captureAndProcess = useCallback(async () => {
      console.log('=== CAPTURE ATTEMPT ===');
      
      if (!ref || typeof ref === 'function' || !ref.current || !canvasRef.current) {
        console.log('❌ Missing refs for capture');
        return;
      }

      const video = ref.current;
      const canvas = canvasRef.current;
      
      console.log('📹 Video readyState:', video.readyState);
      console.log('📹 Video dimensions:', video.videoWidth, 'x', video.videoHeight);
      console.log('📹 Video currentTime:', video.currentTime);
      console.log('📹 Video paused:', video.paused);
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.log('❌ Could not get canvas context');
        return;
      }

      // Check if video has valid dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.log('❌ Video has no dimensions yet');
        return;
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      console.log('✅ Capturing frame from video:', canvas.width, 'x', canvas.height);

      try {
        // Draw current video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        console.log('✅ Drew image to canvas');

        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
          if (!blob) {
            console.log('❌ Failed to create blob from canvas');
            return;
          }

          console.log('✅ Created blob from canvas, size:', blob.size);
          const newFrameUrl = await processFrame(blob);
          if (newFrameUrl) {
            // Clean up previous URL to avoid memory leaks
            if (processedFrameUrlRef.current) {
              URL.revokeObjectURL(processedFrameUrlRef.current);
            }
            processedFrameUrlRef.current = newFrameUrl;
            console.log('✅ Setting new processed frame URL');
            setProcessedFrameUrl(newFrameUrl);
          } else {
            console.log('❌ Failed to process frame');
          }
        }, 'image/jpeg', 0.8);
      } catch (error) {
        console.log('❌ Error during canvas operations:', error);
      }
    }, [ref, processFrame]);

    const startProcessing = useCallback(() => {
      if (intervalRef.current || isProcessingRef.current) {
        console.log('Processing already running');
        return;
      }
      
      console.log('Starting video processing...');
      isProcessingRef.current = true;
      setIsProcessing(true);
      intervalRef.current = setInterval(captureAndProcess, 100);
    }, [captureAndProcess]);

    const stopProcessing = useCallback(() => {
      console.log('Stopping video processing...');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      isProcessingRef.current = false;
      setIsProcessing(false);
      
      // Clean up processed frame URL
      if (processedFrameUrlRef.current) {
        URL.revokeObjectURL(processedFrameUrlRef.current);
        processedFrameUrlRef.current = '';
      }
      setProcessedFrameUrl('');
    }, []);

    // Manual trigger for testing
    const handleManualStart = useCallback(() => {
      console.log('Manual start triggered');
      if (!isProcessingRef.current) {
        startProcessing();
      } else {
        stopProcessing();
      }
    }, [startProcessing, stopProcessing]);

    // Setup event listeners once and never change them
    useEffect(() => {
      if (!ref || typeof ref === 'function' || !ref.current) return;

      const video = ref.current;
      
      const handleLoadedData = () => {
        console.log('Video loaded data event');
      };

      video.addEventListener('loadeddata', handleLoadedData);

      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        stopProcessing();
      };
    }, [ref]); // Only depend on ref, not on processing state or callbacks

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        if (processedFrameUrlRef.current) {
          URL.revokeObjectURL(processedFrameUrlRef.current);
        }
      };
    }, []);

    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <video
          ref={ref}
          src={src}
          className="video-player"
          controls
          onLoadedMetadata={onLoadedMetadata}
          crossOrigin="anonymous"
        />
        
        {/* Hidden canvas for frame capture */}
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />
        
        {/* Processed frame overlay */}
        {processedFrameUrl && (
          <img
            src={processedFrameUrl}
            alt="Processed frame"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        )}
        
        {/* Processing indicator */}
        {isProcessing && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(0, 255, 0, 0.8)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              zIndex: 2,
            }}
          >
            Processing...
          </div>
        )}
        
        {/* Debug button */}
        <button
          onClick={handleManualStart}
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            background: isProcessing ? 'red' : 'blue',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            zIndex: 2,
          }}
        >
          {isProcessing ? 'Stop Filter' : 'Start Filter'}
        </button>
        
        {/* Debug info */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            zIndex: 2,
          }}
        >
          {processedFrameUrl ? 'Filtered' : 'Original'}
        </div>
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer; 