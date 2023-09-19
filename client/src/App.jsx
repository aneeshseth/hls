import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css'
import '@videojs/http-streaming'
import Hls from 'hls.js';


export default function App() {

  const [manifestUrl, serManifestUrl] = useState('');
  const [video, setVideo] = useState('');
  const videoRef = useRef();

  async function fetchManifest() {

    const formData = new FormData();
    formData.append('video', video);

    const res = await fetch('http://localhost:3004/upload', {
      method: 'POST',
      body: formData
    })

    const data = await res.json();
    console.log(data.manifest)
    return data.manifest;
  }

  const handleVideoChange = (e) => {
    console.log(e.target.files[0]);
    setVideo(e.target.files[0]);
  }

  const handelSubmit = async (e) => {
    e.preventDefault();
    const manifest = await fetchManifest();
    console.log(manifest)
    serManifestUrl(`http://localhost:3004/stream/${manifest}`)
  }

  useEffect(() => {
    if (manifestUrl) {

      console.log(manifestUrl);

      const videoElement = videoRef.current;

      // Check if HLS is supported by the browser
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(manifestUrl);
        hls.attachMedia(videoElement);
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        // For Safari, use the native HLS support
        videoElement.src = manifestUrl;
      } else {
        console.error('HLS is not supported in this browser.');
      }

      const player = videojs(videoElement, {
        controls: true,
      });

      return () => {
        if (player) {
          player.dispose();
        }
      }

    }
  }, [manifestUrl]);

  return (
    <div>
      <form action="http://localhost:3004/upload" method="post" encType="multipart/form-data" onSubmit={handelSubmit}>
        <input type="file" name="video" accept="video/mp4" onChange={handleVideoChange} />
        <button type="submit">Upload</button>
      </form>

      <section style={{ width: "400px" }}>
        <video  ref={videoRef} className='video-js vjs-default-skin' />
      </section>
    </div>
  )
}
