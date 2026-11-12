/**
 * The home stage's background: a slowly drifting gradient in the theme's stage colours
 * (--stage-1..3), plus a few twinkling stars that only show in the night theme. CSS
 * only (see .stage-backdrop in app/globals.css); static under reduced motion.
 */

/** left %, top %, size px, twinkle delay s. Fixed, so server and client render the same. */
const STARS: ReadonlyArray<readonly [number, number, number, number]> = [
  [6, 14, 2, 0],
  [14, 62, 1.5, 1.6],
  [21, 28, 2.5, 3.1],
  [29, 80, 1.5, 0.8],
  [37, 9, 2, 2.4],
  [46, 44, 1.5, 4.2],
  [58, 18, 2, 1.1],
  [64, 72, 2.5, 3.7],
  [72, 35, 1.5, 0.4],
  [81, 12, 2, 2.9],
  [88, 58, 2, 1.9],
  [94, 26, 1.5, 3.4],
  [52, 88, 1.5, 2.2],
  [9, 90, 2, 4.6],
];

export default function StageBackdrop() {
  return (
    <div aria-hidden="true" className="stage-backdrop pointer-events-none absolute inset-0">
      <div className="stage-stars absolute inset-0">
        {STARS.map(([left, top, size, delay]) => (
          <span
            key={`${left}-${top}`}
            className="stage-star absolute rounded-full"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: size,
              height: size,
              animationDelay: `${delay}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
