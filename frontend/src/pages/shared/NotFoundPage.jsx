import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 p-4">
      <div className="text-center max-w-md">
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <h1 className="text-9xl font-black bg-clip-text text-transparent bg-gradient-to-br from-primary-400 to-primary-600 mb-4 tracking-tighter drop-shadow-sm">
            404
          </h1>
        </motion.div>
        
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">Page Not Found</h2>
        <p className="text-surface-500 dark:text-surface-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <Link to="/" className="btn-primary inline-flex">
          <Home className="w-5 h-5 mr-2" />
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
