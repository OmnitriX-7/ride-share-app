import { motion, AnimatePresence } from 'framer-motion';
import { Gift } from 'lucide-react';

interface Props {
  show: boolean;
  message: string;
}

export default function NotificationToast({ show, message }: Props) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -50, x: '-50%', opacity: 0 }}
          animate={{ y: 20, x: '-50%', opacity: 1 }}
          exit={{ y: -50, x: '-50%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={toastStyle}
        >
          <div style={iconContainerStyle}>
            <Gift size={18} color="white" />
          </div>
          <span style={textStyle}>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const toastStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: '50%',
  zIndex: 10000,
  backgroundColor: '#1e293b', // Deep slate for premium look
  color: 'white',
  padding: '10px 20px',
  borderRadius: '50px', // Pill shape
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  whiteSpace: 'nowrap',
  border: '1px solid rgba(255, 255, 255, 0.1)'
};

const iconContainerStyle = {
  backgroundColor: '#2563eb',
  padding: '6px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const textStyle = {
  fontSize: '14px',
  fontWeight: '600',
  letterSpacing: '-0.01em'
};