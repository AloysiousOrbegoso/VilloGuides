const embedUrl = ({ provider, videoId }) =>
  provider === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0`
    : `https://player.vimeo.com/video/${encodeURIComponent(videoId)}?dnt=1`;
export function VideoBlock(props) {
  return (
    <div className="block block-video">
      <div className="video-frame">
        <iframe
          src={embedUrl(props)}
          title={props.title}
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    </div>
  );
}
