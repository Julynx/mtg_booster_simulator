import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import styles from './ErrorBoundary.module.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReportIssue = () => {
    const { error, errorInfo } = this.state;
    const title = encodeURIComponent(`Application Error: ${error?.message || 'Unknown Error'}`);
    const body = encodeURIComponent(`
## Error Details

**Error Message:** ${error?.message || 'Unknown Error'}

**Stack Trace:**
\`\`\`
${error?.stack || 'No stack trace available'}
\`\`\`

**Component Stack:**
\`\`\`
${errorInfo?.componentStack || 'No component stack available'}
\`\`\`

**Browser Info:**
- User Agent: ${navigator.userAgent}
- URL: ${window.location.href}
- Timestamp: ${new Date().toISOString()}

## Steps to Reproduce
1. [Please describe what you were doing when the error occurred]

## Additional Context
[Add any other relevant information about your environment or actions]
    `);

    const githubUrl = `https://github.com/Julynx/mtg_booster_simulator/issues/new?title=${title}&body=${body}&labels=bug`;
    window.open(githubUrl, '_blank');
  };

  render() {
    if (this.state.hasError) {
      return (
        <AnimatePresence>
          <motion.div
            className={styles.errorOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={styles.errorModal}
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className={styles.errorHeader}>
                <div className={styles.errorIcon}>
                  <AlertTriangle size={32} />
                </div>
                <h2 className={styles.errorTitle}>Oops! Something went wrong</h2>
                <p className={styles.errorSubtitle}>
                  The application encountered an unexpected error. Don't worry, your progress is safe!
                </p>
              </div>

              <div className={styles.errorContent}>
                <div className={styles.errorDetails}>
                  <h3>Error Information</h3>
                  <div className={styles.errorMessage}>
                    <strong>Message:</strong> {this.state.error?.message || 'Unknown error occurred'}
                  </div>
                  <div className={styles.errorStack}>
                    <details>
                      <summary>Technical Details (Click to expand)</summary>
                      <pre className={styles.stackTrace}>
                        {this.state.error?.stack || 'No stack trace available'}
                      </pre>
                      <pre className={styles.componentStack}>
                        {this.state.errorInfo?.componentStack || 'No component stack available'}
                      </pre>
                    </details>
                  </div>
                </div>

                <div className={styles.errorActions}>
                  <motion.button
                    className={styles.retryButton}
                    onClick={this.handleRetry}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <RefreshCw size={18} />
                    Try Again
                  </motion.button>

                  <motion.button
                    className={styles.reportButton}
                    onClick={this.handleReportIssue}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ExternalLink size={18} />
                    Report Issue
                  </motion.button>
                </div>

                <div className={styles.errorHelp}>
                  <p>
                    If this problem persists, please report it on our GitHub repository.
                    Include the technical details above to help us fix the issue faster.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;