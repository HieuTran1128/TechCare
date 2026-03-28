import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as faceapi from 'face-api.js';
import toast from 'react-hot-toast';
import { Camera, RefreshCw } from 'lucide-react';

const API_BASE = 'http://localhost:3000/api';

export default function RegisterFace() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState('Đang khởi tạo camera...');
  const [isSuccess, setIsSuccess] = useState(false);
  const scanInterval = useRef<any>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        setStatusText('Đang tải mô hình nhận diện (vui lòng đợi một chút)...');
        const modelUrl = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
          faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
          faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl)
        ]);
        setStatusText('Đang kết nối camera...');
        startVideo();
      } catch (err) {
        toast.error('Lỗi khi khởi tạo nhận diện khuôn mặt');
        setStatusText('Lỗi môi trường hệ thống');
        setLoading(false);
      }
    };
    loadModels();

    return () => {
      if (scanInterval.current) clearInterval(scanInterval.current);
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setLoading(false);
        setStatusText('Đang chờ khuôn mặt...');
      })
      .catch((err) => {
        toast.error('Không thể truy cập camera. Vui lòng cấp quyền.');
        setStatusText('Vui lòng cấp quyền sử dụng camera trên trình duyệt.');
        setLoading(false);
      });
  };

  const handleVideoPlay = () => {
    if (scanInterval.current) clearInterval(scanInterval.current);
    
    // Tự động quét mỗi 1 giây
    scanInterval.current = setInterval(async () => {
      if (!videoRef.current || isSuccess) return;

      const detection = await faceapi.detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks().withFaceDescriptor();

      if (detection && detection.detection.score > 0.8) {
        // Đã tìm thấy khuôn mặt rất rõ ràng
        clearInterval(scanInterval.current);
        handleRegister(detection);
      }
    }, 1000);
  };

  const handleRegister = async (detection: any) => {
    try {
      setIsSuccess(true);
      setStatusText('Đã nhận diện! Đang lưu khuôn mặt...');
      
      const descriptor = Array.from(detection.descriptor); 
      
      await axios.post(`${API_BASE}/users/register-face`, { descriptor }, { withCredentials: true });
      toast.success('Thiết lập khuôn mặt thành công!');
      
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      
      // Navigate to homepage => update state explicitly or fetch me
      window.location.href = '/'; 
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu khuôn mặt');
      setIsSuccess(false);
      setStatusText('Đang chờ khuôn mặt...');
      handleVideoPlay(); // Quét lại 
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl flex flex-col items-center">
        <div className="bg-blue-100 dark:bg-blue-900 shadow-inner w-16 h-16 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 mb-6 relative">
          <Camera size={28} />
          {isSuccess && (
             <div className="absolute inset-0 rounded-full border-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse"></div>
          )}
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">Đăng ký khuôn mặt</h1>
        <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-6">
          Hệ thống sẽ <strong className="text-blue-600 dark:text-blue-400">tự động nhận diện</strong> khi bạn đưa mặt vào giữa khung hình.
        </p>

        <div className={`relative w-72 h-72 mb-6 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 mx-auto shadow-inner transition-all duration-300 border-4 border-dashed ${isSuccess ? 'border-emerald-500 shadow-emerald-500/50' : 'border-slate-300 dark:border-slate-600'}`}>
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline
            onPlay={handleVideoPlay}
            className="w-full h-full object-cover transform scale-x-[-1]" 
          />
          {(loading || statusText) && (
            <div className={`absolute bottom-0 w-full py-2 flex flex-col items-center justify-center font-bold text-xs shadow-lg transition-colors z-20 ${isSuccess ? 'bg-emerald-600 text-white' : 'bg-blue-600/80 text-white'}`}>
              <div className="flex items-center gap-2">
                {!isSuccess && <RefreshCw className="animate-spin" size={14} />}
                {statusText}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
