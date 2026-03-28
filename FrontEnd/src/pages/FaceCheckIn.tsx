import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import * as faceapi from 'face-api.js';
import toast from 'react-hot-toast';
import { ScanFace, RefreshCw, CheckCircle2 } from 'lucide-react';

const API_BASE = 'http://localhost:3000/api';

export default function FaceCheckIn() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState('Đang khởi tạo camera...');
  const navigate = useNavigate();
  const scanInterval = useRef<any>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  
  const targetDate = searchParams.get('date');
  const targetShift = searchParams.get('shift');

  useEffect(() => {
    if (!targetDate || !targetShift) {
      toast.error('Thiếu thông tin ca làm việc để check-in');
      navigate(-1);
      return;
    }

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
  }, [targetDate, targetShift, navigate]);

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
        setStatusText('Vui lòng cấp quyền sử dụng camera.');
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
        handleCheckIn(detection);
      }
    }, 1000);
  };

  const handleCheckIn = async (detection: any) => {
    try {
      setIsSuccess(true);
      setStatusText('Đã nhận diện! Đang ghi nhận...');
      
      const descriptor = Array.from(detection.descriptor);
      
      const res = await axios.post(`${API_BASE}/schedules/check-in`, { 
        descriptor,
        date: targetDate,
        shift: targetShift
      }, { withCredentials: true });
      
      const statusMessage = res.data.checkInStatus === 'late' 
        ? `Bạn đã vào làm trễ vào lúc ${new Date(res.data.checkInTime).toLocaleTimeString('vi-VN')}` 
        : `Check-in đúng giờ vào lúc ${new Date(res.data.checkInTime).toLocaleTimeString('vi-VN')}`;

      toast.success(statusMessage, { duration: 5000 });
      
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      
      navigate('/my-schedule');
    } catch (err: any) {
      console.error(err);
      toast.error('Nhận diện chưa khớp hoặc lỗi check-in. Đang thử lại...');
      setStatusText('Không khớp! Đang thử lại...');
      setIsSuccess(false);
      handleVideoPlay();
    }
  };

  return (
    <div className="min-h-[80vh] bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl flex flex-col items-center border border-slate-100 dark:border-slate-700">
        <div className="bg-emerald-100 dark:bg-emerald-900 shadow-inner w-16 h-16 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-300 mb-6 relative">
          {isSuccess ? <CheckCircle2 size={28} /> : <ScanFace size={28} />}
          {isSuccess && (
             <div className="absolute inset-0 rounded-full border-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse"></div>
          )}
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">Check-in Ca Làm Việc</h1>
        <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-6">
          Ca {targetShift === 'morning' ? 'Sáng' : 'Chiều'} ngày {targetDate}
        </p>

        <div className={`relative w-72 h-72 mb-6 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 mx-auto shadow-inner border-4 transition-all duration-300 ${isSuccess ? 'border-emerald-500 shadow-emerald-500/50' : 'border-emerald-100 dark:border-emerald-800/50'}`}>
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline
            onPlay={handleVideoPlay}
            className="w-full h-full object-cover transform scale-x-[-1]" 
          />
          {(loading || statusText) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 text-white p-4 text-center">
              <RefreshCw className="animate-spin mb-3 text-emerald-400" size={32} />
              <p className="text-xs font-semibold">{statusText}</p>
            </div>
          )}
        </div>
        
        <button
          onClick={() => {
            const stream = videoRef.current?.srcObject as MediaStream;
            stream?.getTracks().forEach(track => track.stop());
            navigate(-1);
          }}
          disabled={isSuccess}
          className="w-full mt-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 font-medium py-2 rounded-xl transition-colors disabled:opacity-50"
        >
          Hủy bỏ
        </button>
      </div>
    </div>
  );
}
