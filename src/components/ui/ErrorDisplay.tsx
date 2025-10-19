/**
 * ErrorDisplay Component
 * Shows error messages to the user
 */
interface ErrorDisplayProps {
  message: string;
}

export const ErrorDisplay = ({ message }: ErrorDisplayProps) => {
  return (
    <div className="absolute top-6 right-6 z-20 bg-red-500/20 border border-red-500/50 backdrop-blur-sm rounded-lg px-4 py-2 text-red-200 text-sm max-w-xs">
      {message}
    </div>
  );
};
