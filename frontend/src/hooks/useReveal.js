import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

// Phần tử hiện dần lên khi cuộn tới; chỉ chạy một lần. Gắn ref vào phần tử,
// thêm class "reveal" và "reveal--visible" khi isVisible (CSS ở global.css).
export const useReveal = () => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(
    () => prefersReducedMotion() || typeof IntersectionObserver === 'undefined',
  );

  useEffect(() => {
    if (isVisible || !ref.current) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -60px 0px' },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [isVisible]);

  return [ref, isVisible];
};
