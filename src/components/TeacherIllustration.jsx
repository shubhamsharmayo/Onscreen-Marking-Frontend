import { motion } from 'motion/react';

export function TeacherIllustration() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Animated background elements */}
      <motion.div
        className="absolute inset-0 opacity-20"
        animate={{
          background: [
            'radial-gradient(circle at 20% 30%, rgba(99, 179, 237, 0.3), transparent 50%)',
            'radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.3), transparent 50%)',
            'radial-gradient(circle at 40% 60%, rgba(52, 211, 153, 0.3), transparent 50%)',
          ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      />

      {/* Main illustration container */}
      <div className="relative z-10 w-full max-w-md px-8">
        {/* Laptop */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Laptop screen */}
          <div className="relative rounded-2xl p-[3px] bg-gradient-to-br border-navy-900 border-8 shadow-2xl">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl aspect-[16/10] overflow-hidden relative">
              {/* Animated code lines */}
              <div className="absolute inset-0 p-4 space-y-2">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded opacity-30"
                    initial={{ width: '0%' }}
                    animate={{ width: `${40 + i * 10}%` }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.2,
                      repeat: Infinity,
                      repeatType: 'reverse',
                      repeatDelay: 2,
                    }}
                  />
                ))}
              </div>

              {/* Floating icons */}
              <motion.div
                className="absolute top-4 right-4 w-8 h-8 bg-blue-500 rounded-lg shadow-lg flex items-center justify-center"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </motion.div>

              <motion.div
                className="absolute bottom-6 right-8 w-10 h-10 bg-purple-500 rounded-lg shadow-lg flex items-center justify-center"
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </motion.div>
            </div>

            {/* Laptop notch */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-16 h-1 bg-slate-600 rounded-full" />
          </div>

          {/* Laptop base */}
          <div className="h-2 bg-gradient-to-b border-navy-900 border-4 rounded-b-xl shadow-lg" />
        </motion.div>

        {/* Teacher character (simplified) */}
        <motion.div
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {/* Coffee cup */}
          <motion.div
            className="relative"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-12 h-14 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg shadow-md relative">
              <div className="absolute top-2 left-2 right-2 h-8 bg-gradient-to-br from-amber-600 to-amber-800 rounded opacity-60" />
              <div className="absolute -right-2 top-4 w-3 h-6 border-2 border-amber-200 rounded-r-full" />
              
              {/* Steam */}
              <motion.div
                className="absolute -top-8 left-1/2 transform -translate-x-1/2"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.6, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-1 h-6 bg-gradient-to-t from-gray-400 to-transparent rounded-full" />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Floating particles */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full opacity-40"
            style={{
              left: `${20 + i * 15}%`,
              top: `${10 + i * 10}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>
    </div>
  );
}
