export default function NoxLogo() {
  return (
    <svg
      className="nox-logo w-28 h-28 mx-auto"
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <g className="eye-rig">
        <g fill="none" stroke="#f3f1ee" strokeLinecap="round">
          <path className="draw" pathLength="1" style={{ animationDelay: '0s' }} d="M24 100 Q66 60 100 53 Q134 60 176 100" strokeWidth="3" />
          <path className="draw" pathLength="1" style={{ animationDelay: '.07s' }} d="M31 93  Q70 56 100 49  Q130 56 169 93" strokeWidth="2" opacity="0.55" />
          <path className="draw" pathLength="1" style={{ animationDelay: '.1s' }} d="M22 102 L34 98" strokeWidth="2" opacity="0.5" />
          <path className="draw" pathLength="1" style={{ animationDelay: '.12s' }} d="M166 98 L178 102" strokeWidth="2" opacity="0.5" />
          <path className="draw" pathLength="1" style={{ animationDelay: '.18s' }} d="M36 113 Q68 134 100 136 Q132 132 164 111" strokeWidth="3" />
          <path className="draw" pathLength="1" style={{ animationDelay: '.25s' }} d="M43 109 Q70 128 100 130 Q130 126 157 108" strokeWidth="2" opacity="0.55" />
        </g>
        <g fill="none" stroke="#e2231a" strokeLinejoin="round">
          <path className="draw" pathLength="1" style={{ animationDelay: '.34s' }} d="M100 54 L135 100 L98 149 L66 100 Z" strokeWidth="4" />
          <path className="draw" pathLength="1" style={{ animationDelay: '.42s' }} d="M103 59 L139 100 L101 145 L70 99 Z" strokeWidth="2.2" opacity="0.5" />
        </g>
        <circle className="pupil" style={{ animationDelay: '.58s' }} cx="99" cy="101" r="7" fill="#f3f1ee" />
        <circle className="glint" style={{ animationDelay: '.72s' }} cx="103" cy="97" r="2.2" fill="#050505" />
      </g>
    </svg>
  );
}