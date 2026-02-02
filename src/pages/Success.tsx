import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle } from "lucide-react";

const Success = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 4 saniye bekle ve dashboard'a yönlendir
    const timer = setTimeout(() => {
      navigate("/control"); // Dashboard route is /control in App.tsx
    }, 4000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center space-y-6 max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Ödemeniz başarıyla alındı!
          </h1>
          <p className="text-gray-500">
            Hesabınız oluşturuluyor, lütfen bekleyin...
          </p>
        </div>

        <div className="flex justify-center pt-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    </div>
  );
};

export default Success;
