import { useEffect, useState } from 'react';

// day: 6h–16h, sunset: 16h–19h, night: 19h–6h (theo giờ máy người xem)
const getScene = (hour) => {
  if (hour >= 6 && hour < 16) return 'day';
  if (hour >= 16 && hour < 19) return 'sunset';
  return 'night';
};

const getGreeting = (hour) => {
  if (hour >= 4 && hour < 11) return 'Chào buổi sáng';
  if (hour >= 11 && hour < 13) return 'Chào buổi trưa';
  if (hour >= 13 && hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
};

const read = () => {
  const hour = new Date().getHours();
  return { scene: getScene(hour), greeting: getGreeting(hour) };
};

const CHECK_INTERVAL = 60 * 1000;

// Kiểm tra lại mỗi phút để cảnh tự đổi nếu người dùng mở trang lâu qua mốc giờ
const useTimeOfDay = () => {
  const [timeOfDay, setTimeOfDay] = useState(read);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = read();
      setTimeOfDay((current) =>
        current.scene === next.scene && current.greeting === next.greeting ? current : next,
      );
    }, CHECK_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  return timeOfDay;
};

export default useTimeOfDay;
