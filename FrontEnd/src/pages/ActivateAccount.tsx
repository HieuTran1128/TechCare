import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as faceapi from 'face-api.js';
import { Camera, RefreshCw } from 'lucide-react';

const API_BASE = 'http://localhost:3000/api'; 
console.log('[Activate.tsx] File này ĐÃ được import và chạy');

export default function Activate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // States for Step 2
  const [step, setStep] = useState<1 | 2>(1);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanInterval = useRef<any>(null);
  const [faceStatus, setFaceStatus] = useState('');
  const [isFaceSuccess, setIsFaceSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Link không hợp lệ. Vui lòng kiểm tra lại email.');
    }
    return () => {
      if (scanInterval.current) clearInterval(scanInterval.current);
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [token]);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setStep(2);
    loadModels();
  };

  const loadModels = async () => {
    try {
      setFaceStatus('Đang tải mô hình nhận diện...');
      const modelUrl = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
        faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
        faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl)
      ]);
      setFaceStatus('Đang kết nối camera...');
      startVideo();
    } catch (err) {
      setError('Lỗi khi khởi tạo nhận diện khuôn mặt');
      setFaceStatus('Lỗi môi trường hệ thống');
    }
  };

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setFaceStatus('Đang chờ khuôn mặt...');
      })
      .catch((err) => {
        setError('Không thể truy cập camera. Vui lòng cấp quyền.');
        setFaceStatus('Lỗi Camera');
      });
  };

  const handleVideoPlay = () => {
    if (scanInterval.current) clearInterval(scanInterval.current);
    scanInterval.current = setInterval(async () => {
      if (!videoRef.current || isFaceSuccess) return;
      const detection = await faceapi.detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks().withFaceDescriptor();

      if (detection && detection.detection.score > 0.8) {
        clearInterval(scanInterval.current);
        submitActivation(Array.from(detection.descriptor));
      }
    }, 1000);
  };

  const submitActivation = async (descriptor: number[]) => {
    setIsFaceSuccess(true);
    setFaceStatus('Đã nhận diện! Đang thiết lập tài khoản...');
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE}/auth/activate`,
        { token, password, descriptor },
        { withCredentials: true }
      );

      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());

      setMessage('Kích hoạt và đăng ký khuôn mặt thành công! Đang về trang đăng nhập...');
      
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err: any) {
      setIsFaceSuccess(false);
      let errMsg = 'Có lỗi xảy ra khi kích hoạt tài khoản';
      
      if (err.response) {
        errMsg = err.response.data?.message || errMsg;
      } else if (err.request) {
        errMsg = 'Không kết nối được đến server.';
      }

      if (errMsg.includes('INVALID_TOKEN') || errMsg === 'INVALID_TOKEN') {
        errMsg = 'Token không hợp lệ hoặc đã được sử dụng';
      } else if (errMsg.includes('EXPIRED') || errMsg === 'EXPIRED') {
        errMsg = 'Link đã hết hạn (hiệu lực 24 giờ)';
      }

      setError(errMsg);
      setFaceStatus('Quét khuôn mặt thất bại');
      setTimeout(() => {
        setError('');
        setFaceStatus('Đang chờ khuôn mặt...');
        handleVideoPlay(); // Quét lại 
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          {step === 1 ? 'Kích hoạt tài khoản' : 'Đăng ký khuôn mặt'}
        </h1>

        {message && (
          <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg text-center font-medium">
            {message}
          </div>
        )}

        {error && step === 1 && (
          <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg text-center">
            {error}
          </div>
        )}

        {step === 1 && !message && (
          <form onSubmit={handleStep1Submit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Mật khẩu mới</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nhập lại mật khẩu</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={!token}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Tiếp tục thiết lập Face ID
            </button>
          </form>
        )}

        {step === 2 && !message && (
          <div className="flex flex-col items-center">
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg text-center w-full text-sm">
                {error}
              </div>
            )}
            
            <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-6">
              Khung hình sẽ tự động nhận diện khuôn mặt của bạn để lưu làm dữ liệu đăng nhập sau này.
            </p>

            <div className={`relative w-48 h-48 mb-6 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mx-auto shadow-inner transition-all duration-300 border-4 ${isFaceSuccess ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'border-gray-300 dark:border-gray-600'}`}>
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline
                onPlay={handleVideoPlay}
                className="w-full h-full object-cover transform scale-x-[-1]" 
              />
              {(loading || faceStatus) && (
                <div className={`absolute bottom-0 left-0 w-full py-2 flex flex-col items-center justify-center font-bold text-xs shadow-lg transition-colors z-20 ${isFaceSuccess ? 'bg-emerald-600 text-white' : 'bg-blue-600/80 text-white'}`}>
                  <div className="flex items-center gap-2">
                    {!isFaceSuccess && <RefreshCw className="animate-spin" size={14} />}
                    {faceStatus}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                const stream = videoRef.current?.srcObject as MediaStream;
                stream?.getTracks().forEach(track => track.stop());
                setStep(1);
              }}
              disabled={loading}
              className="mt-2 text-sm text-gray-500 hover:text-blue-600 transition"
            >
              Quay lại bước thiết lập mật khẩu
            </button>
          </div>
        )}

        {step === 1 && (
          <p className="text-center mt-6 text-sm text-gray-500">
            <a href="/login" className="text-blue-600 hover:underline">Về trang đăng nhập (Bỏ qua)</a>
          </p>
        )}
      </div>
    </div>
  );
}