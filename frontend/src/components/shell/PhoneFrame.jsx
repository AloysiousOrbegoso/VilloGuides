/**
 * Device outline. The child is a live, fully interactive MobileShell, not a screenshot.
 * width and height are optional so the studio preview can use a smaller phone.
 */
export function PhoneFrame({ children, width, height }) {
  const style = {};
  if (width) style["--phone-w"] = `${width}px`;
  if (height) style["--phone-h"] = `${height}px`;
  return (
    <div className="phone-frame" style={style}>
      <div className="phone-frame__notch" aria-hidden="true" />
      <div className="phone-frame__screen">{children}</div>
    </div>
  );
}
