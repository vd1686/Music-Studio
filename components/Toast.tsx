
import React, { useState, useEffect } from 'react';

interface ToastProps {
  message: string;
}

const Toast: React.FC<ToastProps> = ({ message }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
    }, 2500); // Animation is 0.5s, so this makes it visible for 2s

    return () => clearTimeout(timer);
  }, [message]);

  return (
    <div
      className={`fixed bottom-28 right-4 p-4 rounded-lg shadow-lg text-white bg-accent/80 backdrop-blur-sm z-50 transition-transform duration-500 ${
        visible ? 'animate-slideIn' : 'animate-slideOut'
      }`}
    >
      {message}
    </div>
  );
};

export default Toast;
