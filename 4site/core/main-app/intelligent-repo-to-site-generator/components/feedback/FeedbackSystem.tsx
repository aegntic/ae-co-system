import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  Star, 
  Send, 
  X, 
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Bug
} from 'lucide-react';

interface FeedbackData {
  type: 'rating' | 'bug' | 'feature' | 'general';
  rating?: number;
  message: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  reproductionSteps?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  userAgent: string;
  url: string;
  timestamp: string;
  userId?: string;
  sessionId: string;
}

interface FeedbackSystemProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'rating' | 'bug' | 'feature' | 'general';
  context?: string;
}

export const FeedbackSystem: React.FC<FeedbackSystemProps> = ({
  isOpen,
  onClose,
  initialType = 'general',
  context
}) => {
  const [feedbackType, setFeedbackType] = useState<'rating' | 'bug' | 'feature' | 'general'>(initialType);
  const [rating, setRating] = useState<number>(0);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [reproductionSteps, setReproductionSteps] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSessionId = useCallback(() => {
    let sessionId = sessionStorage.getItem('feedback_session_id');
    if (!sessionId) {
      sessionId = `FS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('feedback_session_id', sessionId);
    }
    return sessionId;
  }, []);

  const getUserId = useCallback(() => {
    try {
      const userData = localStorage.getItem('supabase.auth.token');
      if (userData) {
        const parsed = JSON.parse(userData);
        return parsed.user?.id || null;
      }
    } catch {
      return null;
    }
    return null;
  }, []);

  const submitFeedback = useCallback(async () => {
    if (!message.trim() && feedbackType !== 'rating') {
      setError('Please provide a message');
      return;
    }

    if (feedbackType === 'rating' && rating === 0) {
      setError('Please provide a rating');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const feedbackData: FeedbackData = {
        type: feedbackType,
        message: message.trim(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userId: getUserId(),
        sessionId: getSessionId(),
        ...(feedbackType === 'rating' && { rating }),
        ...(category && { category }),
        ...(priority && { priority }),
        ...(reproductionSteps.trim() && { reproductionSteps: reproductionSteps.trim() }),
        ...(expectedBehavior.trim() && { expectedBehavior: expectedBehavior.trim() }),
        ...(actualBehavior.trim() && { actualBehavior: actualBehavior.trim() })
      };

      // Send feedback to your backend
      await sendFeedback(feedbackData);

      setIsSubmitted(true);
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    feedbackType, 
    message, 
    rating, 
    category, 
    priority, 
    reproductionSteps, 
    expectedBehavior, 
    actualBehavior,
    getUserId,
    getSessionId,
    onClose
  ]);

  const sendFeedback = async (data: FeedbackData): Promise<void> => {
    // For now, just log to console. In production, send to your backend
    console.log('Feedback submitted:', data);
    
    // Example implementation:
    // const response = await fetch('/api/feedback', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data)
    // });
    // 
    // if (!response.ok) {
    //   throw new Error('Failed to submit feedback');
    // }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const resetForm = useCallback(() => {
    setFeedbackType('general');
    setRating(0);
    setMessage('');
    setCategory('');
    setPriority('medium');
    setReproductionSteps('');
    setExpectedBehavior('');
    setActualBehavior('');
    setIsSubmitting(false);
    setIsSubmitted(false);
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    onClose();
    resetForm();
  }, [onClose, resetForm]);

  const renderStarRating = () => (
    <div className="flex items-center gap-1 justify-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => setRating(star)}
          className={`w-8 h-8 transition-colors ${
            star <= rating ? 'text-yellow-400' : 'text-white/30 hover:text-yellow-200'
          }`}
        >
          <Star className="w-full h-full" fill={star <= rating ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );

  const feedbackTypes = [
    { id: 'rating', icon: Star, label: 'Rate Experience', color: 'text-yellow-400' },
    { id: 'bug', icon: Bug, label: 'Report Bug', color: 'text-red-400' },
    { id: 'feature', icon: Lightbulb, label: 'Request Feature', color: 'text-blue-400' },
    { id: 'general', icon: MessageSquare, label: 'General Feedback', color: 'text-green-400' }
  ] as const;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {isSubmitted ? 'Thank You!' : 'Send Feedback'}
              </h2>
              <button
                onClick={handleClose}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {isSubmitted ? (
              /* Success State */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Feedback Received!
                </h3>
                <p className="text-white/60">
                  Thank you for helping us improve 4site.pro
                </p>
              </motion.div>
            ) : (
              /* Feedback Form */
              <div className="space-y-6">
                {/* Feedback Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    What type of feedback do you have?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {feedbackTypes.map(({ id, icon: Icon, label, color }) => (
                      <button
                        key={id}
                        onClick={() => setFeedbackType(id)}
                        className={`p-3 rounded-lg border transition-all flex items-center gap-2 text-sm ${
                          feedbackType === id
                            ? 'border-white/40 bg-white/10'
                            : 'border-white/20 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${color}`} />
                        <span className="text-white">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating (for rating feedback) */}
                {feedbackType === 'rating' && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      How would you rate your experience?
                    </label>
                    {renderStarRating()}
                    {rating > 0 && (
                      <p className="text-center text-sm text-white/60 mt-2">
                        {rating === 1 && "We're sorry to hear that"}
                        {rating === 2 && "We'll work on improving"}
                        {rating === 3 && "Thanks for the feedback"}
                        {rating === 4 && "Glad you had a good experience"}
                        {rating === 5 && "We're thrilled you love it!"}
                      </p>
                    )}
                  </div>
                )}

                {/* Bug Report Fields */}
                {feedbackType === 'bug' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Priority Level
                      </label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                        className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                      >
                        <option value="low">Low - Minor issue</option>
                        <option value="medium">Medium - Noticeable problem</option>
                        <option value="high">High - Blocking issue</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Expected Behavior
                      </label>
                      <textarea
                        value={expectedBehavior}
                        onChange={(e) => setExpectedBehavior(e.target.value)}
                        placeholder="What did you expect to happen?"
                        className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 resize-none"
                        rows={2}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Actual Behavior
                      </label>
                      <textarea
                        value={actualBehavior}
                        onChange={(e) => setActualBehavior(e.target.value)}
                        placeholder="What actually happened?"
                        className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 resize-none"
                        rows={2}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Steps to Reproduce
                      </label>
                      <textarea
                        value={reproductionSteps}
                        onChange={(e) => setReproductionSteps(e.target.value)}
                        placeholder="1. First I did... 2. Then I clicked... 3. The error occurred..."
                        className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 resize-none"
                        rows={3}
                      />
                    </div>
                  </>
                )}

                {/* Feature Request Category */}
                {feedbackType === 'feature' && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Feature Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                    >
                      <option value="">Select category...</option>
                      <option value="ai">AI & Generation</option>
                      <option value="templates">Templates & Design</option>
                      <option value="collaboration">Collaboration</option>
                      <option value="integrations">Integrations</option>
                      <option value="performance">Performance</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                )}

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    {feedbackType === 'bug' ? 'Additional Details' : 'Message'}
                    {feedbackType !== 'rating' && <span className="text-red-400 ml-1">*</span>}
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      feedbackType === 'bug' 
                        ? "Any additional information about the bug..."
                        : feedbackType === 'feature'
                        ? "Describe the feature you'd like to see..."
                        : "Tell us what's on your mind..."
                    }
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 resize-none"
                    rows={4}
                    required={feedbackType !== 'rating'}
                  />
                </div>

                {/* Context Info */}
                {context && (
                  <div className="p-3 bg-blue-500/10 border border-blue-400/20 rounded-lg">
                    <p className="text-sm text-blue-300">
                      <strong>Context:</strong> {context}
                    </p>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-500/10 border border-red-400/20 rounded-lg flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <p className="text-sm text-red-300">{error}</p>
                  </motion.div>
                )}

                {/* Submit Button */}
                <button
                  onClick={submitFeedback}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Feedback
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* Floating Feedback Button */
export const FloatingFeedbackButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transition-all flex items-center justify-center z-40"
      >
        <MessageSquare className="w-6 h-6 text-white" />
      </motion.button>

      <FeedbackSystem
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};

export default FeedbackSystem;