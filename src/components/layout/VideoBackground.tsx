/**
 * VideoBackground Component
 * Displays Pexels video background with overlay
 */
export const VideoBackground = () => {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <video
        key="bg"
        className="absolute inset-0 w-full h-full object-cover opacity-20"
        autoPlay
        loop
        muted
        playsInline
      >
        <source
          src="https://videos.pexels.com/video-files/5091624/5091624-uhd_2560_1440_25fps.mp4"
          type="video/mp4"
        />
      </video>
      <div className="absolute inset-0 bg-black/80"></div>
    </div>
  );
};
