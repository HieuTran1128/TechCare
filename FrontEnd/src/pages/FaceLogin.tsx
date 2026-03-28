import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as faceapi from 'face-api.js';
import toast from 'react-hot-toast';
import { ScanFace, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:3000/api';

export default function FaceLogin() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState('Đang khởi tạo camera...');
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [isSuccess, setIsSuccess] = useState(false);
  const scanInterval = useRef<any>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        setStatusText('Đang tải mô hình AI...');
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
    
    scanInterval.current = setInterval(async () => {
      if (!videoRef.current || isSuccess) return;

      const detection = await faceapi.detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks().withFaceDescriptor();

      if (detection && detection.detection.score > 0.8) {
        clearInterval(scanInterval.current);
        handleFaceLogin(detection);
      }
    }, 1000);
  };

  const handleFaceLogin = async (detection: any) => {
    try {
      setIsSuccess(true);
      setStatusText('Đã nhận diện! Đang xác thực...');
      
      const descriptor = Array.from(detection.descriptor);
      
      const response = await axios.post(`${API_BASE}/auth/login-face`, { 
        descriptor
      }, { withCredentials: true });
      
      const { success, token, user } = response.data;
      
      if (success) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        login({
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        });

        toast.success(`Đăng nhập thành công! Xin chào ${user.fullName}`);
        
        const stream = videoRef.current?.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
        
        window.location.href = '/'; 
      }
      
    } catch (err: any) {
      console.error(err);
      toast.error('Nhận diện sai! Khuôn mặt này chưa khớp tài khoản nào.');
      setStatusText('Không khớp! Đang thử lại...');
      setIsSuccess(false);
      handleVideoPlay(); // auto retry
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl flex flex-col items-center border border-slate-100 dark:border-slate-700 relative">
        <button
          onClick={() => {
            const stream = videoRef.current?.srcObject as MediaStream;
            stream?.getTracks().forEach(track => track.stop());
            navigate('/login');
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          × Đóng
        </button>

        <div className="bg-indigo-100 dark:bg-indigo-900 shadow-inner w-16 h-16 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-300 mb-6 relative">
          <ScanFace size={28} />
          {isSuccess && (
             <div className="absolute inset-0 rounded-full border-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse"></div>
          )}
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">Đăng nhập Face ID</h1>
        <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-6">
          Hệ thống <strong className="text-indigo-500">quét tự động</strong>. Đưa khuôn mặt của bạn vào giữa màn hình.
        </p>

        <div className={`relative w-72 h-72 mb-6 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 mx-auto shadow-inner border-4 transition-all duration-300 ${isSuccess ? 'border-emerald-500 shadow-emerald-500/50' : 'border-indigo-100 dark:border-indigo-800/50'}`}>
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline
            onPlay={handleVideoPlay}
            className="w-full h-full object-cover transform scale-x-[-1]" 
          />
          {(loading || statusText) && (
            <div className={`absolute bottom-0 w-full py-2 flex flex-col items-center justify-center font-bold text-xs shadow-lg transition-colors z-20 ${isSuccess ? 'bg-emerald-600 text-white' : 'bg-indigo-600/80 text-white'}`}>
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
