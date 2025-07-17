import React, { useRef } from 'react';
import VideoPlayer from './components/VideoPlayer';
import { videoUrl } from './consts';

export interface FaceDetection {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  label?: string;
}

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className="container">
      <div style={{ textAlign: 'center' }}>
        <h1>Video Background Filter</h1>
        <p>The background will be filtered to grayscale while keeping the speaker in full color.</p>
        
        <div className="video-container">
          <VideoPlayer
            ref={videoRef}
            src={videoUrl}
            onLoadedMetadata={() => console.log('Video loaded')}
          />
        </div>
        
        <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          <p>Click "Start Filter" to begin the background filter processing.</p>
          <p>Click "Stop Filter" to return to the original video.</p>
        </div>
      </div>
    </div>
  );
};

export default App; 