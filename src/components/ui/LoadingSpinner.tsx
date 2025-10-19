/**
 * LoadingSpinner Component
 * Displays a loading indicator with optional message
 */
interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner = ({ message = "Loading..." }: LoadingSpinnerProps) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white/60 text-sm">{message}</p>
      </div>
    </div>
  );
};
