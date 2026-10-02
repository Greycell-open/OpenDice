// Kept apart from MotorDiceScene so the first page load can check for WebGL
// without pulling in three.js.

/** True when this browser can draw 3D. Checked once, before mounting a canvas,
    because a failed WebGL context throws inside the renderer. */
export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export function WebGLHelp({ reason }: { reason?: string }) {
  return <div className="webgl-help" role="note">
    <strong>3D is switched off in this browser</strong>
    <span>The dice need WebGL, which this browser is not providing. Usually graphics acceleration is off:
      in Chrome or Edge open Settings, System, turn on "Use graphics acceleration when available" and restart the browser.
      Your results above are still exact.</span>
    {reason && <small>Browser said: {reason}</small>}
  </div>;
}
