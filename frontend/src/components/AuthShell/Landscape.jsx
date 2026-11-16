import { useId } from 'react';

const WAVE_PERIOD = 80;

// Màu nền trời nằm ở AuthShell.css (.auth-visual--day/sunset/night), các màu còn lại ở đây
const palettes = {
  day: {
    light: { x: 286, y: 150, r: 28, fill: '#ffc233' },
    halo: ['#ffffff', '#fff3c4'],
    cloud: '#ffffff',
    bird: '#e6f0fc',
    far: '#4a90e2',
    snow: '#ffffff',
    mid: '#2563b8',
    near: '#0f4a95',
    pine: '#0b3a78',
    waveBack: '#0b63ce',
    waveFront: '#5aa2f5',
    reflection: '#ffffff',
  },
  sunset: {
    light: { x: 286, y: 182, r: 30, fill: '#ff6a13' },
    halo: ['#ffd2b0', '#ffb27d'],
    bands: ['#6b4a9c', '#b5577f', '#e9805a'],
    cloud: '#f7b6a3',
    bird: '#2b2455',
    far: '#7c5aa6',
    snow: '#ffd9c7',
    mid: '#553f8f',
    near: '#2f2a6b',
    pine: '#241f55',
    waveBack: '#4a3f93',
    waveFront: '#7b62b8',
    reflection: '#ffb27d',
  },
  night: {
    light: { x: 290, y: 140, r: 22, fill: '#f4efd6' },
    halo: ['#f4efd6', '#f4efd6'],
    cloud: '#5a6f99',
    far: '#1f3563',
    snow: '#9fb3d6',
    mid: '#172a52',
    near: '#0f1f40',
    pine: '#0a1630',
    waveBack: '#12264d',
    waveFront: '#1d3a6e',
    reflection: '#f4efd6',
  },
};

// Sóng dài hơn khung vẽ một chu kỳ ở mỗi bên để khi trượt ngang (CSS) không lộ mép
const wavePath = (y, height) => {
  const crests = Array.from({ length: 7 }, () => `q20 -${height} 40 0t40 0`).join('');
  return `M-${WAVE_PERIOD} ${y}${crests}V300H-${WAVE_PERIOD}Z`;
};

const pines = [
  [34, 214, 1],
  [48, 208, 1.25],
  [62, 212, 1],
  [80, 216, 0.85],
  [328, 224, 0.9],
  [342, 219, 1.15],
  [356, 223, 0.95],
];

const reflections = [
  { y: 246, width: 46 },
  { y: 253, width: 32 },
  { y: 260, width: 20 },
];

// Đặt vị trí bằng thẻ <g> bọc ngoài, chuyển động CSS gắn ở thẻ bên trong để transform không ghi đè nhau
const Cloud = ({ x, y, scale, className }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <g className={`landscape__cloud ${className}`}>
      <ellipse cx="0" cy="0" rx="26" ry="9" />
      <circle cx="-8" cy="-6" r="10" />
      <circle cx="8" cy="-9" r="13" />
    </g>
  </g>
);

const Bird = ({ x, y, delay }) => (
  <g transform={`translate(${x} ${y})`}>
    <path className="landscape__bird" style={{ animationDelay: delay }} d="M-7 0Q-3.5-5 0 0Q3.5-5 7 0" />
  </g>
);

const Plane = ({ isNight }) => (
  <g transform="translate(0 78)">
    <g className="landscape__plane">
      {!isNight && <rect x="-64" y="-0.6" width="54" height="1.2" rx="0.6" fill="#ffffff" opacity="0.35" />}
      <path d="M-9 0H7L10-1.5 8.5 1.5H-9Z M-2 0-6 -5H-3.5L2 0Z M-2 0-6 5H-3.5L2 0Z M-8 0-10-3.5H-8.5L-6 0Z" fill="#ffffff" />
      {isNight && <circle className="landscape__blink" cx="-6" cy="-4.5" r="1.3" fill="#ff5a5a" />}
    </g>
  </g>
);

const Balloon = () => (
  <g transform="translate(40 84)">
    <g className="landscape__balloon">
      <path d="M0-14C8-14 11-8 11-3 11 4 4 8 2 11H-2C-4 8-11 4-11-3-11-8-8-14 0-14Z" fill="#ff6a13" />
      <path d="M0-14C3-14 4-8 4-3 4 4 1 8 1 11H-1C-1 8-4 4-4-3-4-8-3-14 0-14Z" fill="#ffc233" />
      <path d="M-2 11V15M2 11V15" stroke="#7a4a2a" strokeWidth="0.8" />
      <rect x="-2.5" y="15" width="5" height="4" rx="0.8" fill="#7a4a2a" />
    </g>
  </g>
);

// Hải đăng đứng trên đỉnh đồi bên phải; ban đêm đèn sáng và có luồng sáng
const Lighthouse = ({ isNight }) => (
  <g transform="translate(386 222)">
    {isNight && <path className="landscape__beam" d="M0-29-58-40V-18Z" fill="#ffe59a" />}
    <path d="M-4.5 0-3-24H3L4.5 0Z" fill={isNight ? '#c9d4e8' : '#f4f6f9'} />
    <path d="M-4-8H4L4.3-4H-4.3ZM-3.4-18H3.4L3.6-14H-3.6Z" fill={isNight ? '#8a2a3a' : '#d62f2f'} />
    <rect x="-3.5" y="-30" width="7" height="6" rx="1" fill={isNight ? '#ffe59a' : '#9fb3d6'} />
    <path d="M-4.5-30H4.5L0-34Z" fill={isNight ? '#8a2a3a' : '#d62f2f'} />
  </g>
);

const ShootingStar = () => (
  <g transform="translate(60 58) rotate(22)">
    <path className="landscape__shooting-star" d="M0 0H26" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
  </g>
);

const DistantBoat = ({ isNight }) => (
  <g transform="translate(232 242)">
    <g className="landscape__distant-boat">
      <path d="M-5 0H5L3.5 2H-3.5Z" fill="#13263b" />
      <path d="M0.5-1V-8L5-1Z" fill={isNight ? '#9fb0cf' : '#ffffff'} />
    </g>
  </g>
);

const Landscape = ({ scene }) => {
  const colors = palettes[scene];
  const { light } = colors;
  const isNight = scene === 'night';
  // Trang có thể có nhiều SVG nên id của mask phải duy nhất
  const moonMaskId = `moon-${useId().replace(/[^\w-]/g, '')}`;

  return (
    <svg className="landscape" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      {colors.bands?.map((fill, index) => (
        <rect key={fill} x="-10" y={110 + index * 38} width="420" height="140" fill={fill} />
      ))}

      <g className="landscape__light">
        <circle className="landscape__halo" cx={light.x} cy={light.y} r={light.r * 2.1} fill={colors.halo[0]} opacity="0.08" />
        <circle
          className="landscape__halo landscape__halo--inner"
          cx={light.x}
          cy={light.y}
          r={light.r * 1.5}
          fill={colors.halo[1]}
          opacity="0.16"
        />
        {isNight && (
          <mask id={moonMaskId}>
            <rect width="400" height="300" fill="#fff" />
            <circle cx={light.x + 9} cy={light.y - 6} r={light.r - 2} fill="#000" />
          </mask>
        )}
        <circle
          cx={light.x}
          cy={light.y}
          r={light.r}
          fill={light.fill}
          mask={isNight ? `url(#${moonMaskId})` : undefined}
        />
      </g>

      {isNight && <ShootingStar />}
      <Plane isNight={isNight} />
      {!isNight && <Balloon />}

      <g fill={colors.cloud}>
        <Cloud x={92} y={130} scale={1} className="landscape__cloud--slow" />
        <Cloud x={238} y={120} scale={0.7} className="landscape__cloud--fast" />
      </g>

      {colors.bird && (
        <g fill="none" stroke={colors.bird} strokeWidth="1.6" strokeLinecap="round">
          <Bird x={198} y={138} delay="0s" />
          <Bird x={214} y={130} delay="0.3s" />
          <Bird x={186} y={128} delay="0.6s" />
        </g>
      )}

      <path d="M-10 236 40 172 82 204 142 128 204 212 252 160 300 204 352 148 410 214V240H-10Z" fill={colors.far} />
      <path d="M142 128 129 145 136 142 142 149 148 141 156 146ZM352 148 341 162 347 159 352 165 357 158 364 162Z" fill={colors.snow} />
      <path d="M-10 240 56 190 96 214 164 166 226 222 266 202 322 232 410 206V244H-10Z" fill={colors.mid} />
      <path d="M-10 250 70 202 122 234 172 212 236 250ZM248 250Q330 206 410 226V250Z" fill={colors.near} />

      <Lighthouse isNight={isNight} />

      <g fill={colors.pine}>
        {pines.map(([x, y, s]) => (
          <path key={x} transform={`translate(${x} ${y}) scale(${s})`} d="M0-18-7-3H-3L-8 6H8L3-3H7ZM-1 6H1V9H-1Z" />
        ))}
      </g>

      <path className="landscape__wave landscape__wave--back" d={wavePath(240, 6)} fill={colors.waveBack} />

      <DistantBoat isNight={isNight} />

      <g fill={colors.reflection}>
        {reflections.map(({ y, width }, index) => (
          <rect
            key={y}
            className="landscape__reflection"
            style={{ animationDelay: `${index * 0.5}s` }}
            x={light.x - width / 2}
            y={y}
            width={width}
            height="2.5"
            rx="1.25"
          />
        ))}
      </g>

      <g transform="translate(140 258)">
        <g className="landscape__boat">
          <path d="M-16 0H16L10 7H-10Z" fill="#13263b" />
          <path d="M0-1V-30" stroke="#13263b" strokeWidth="1.4" />
          <path d="M1.5-3V-28L15-4Z" fill={isNight ? '#c9d4e8' : '#ffffff'} />
          <path d="M-1.5-3V-22L-12-4Z" fill={isNight ? '#9fb0cf' : '#dcebfd'} />
          {isNight && (
            <>
              <circle className="landscape__lantern-glow" cx="-13" cy="-3" r="7" fill="#ffcf5a" opacity="0.25" />
              <circle cx="-13" cy="-3" r="2.4" fill="#ffcf5a" />
            </>
          )}
        </g>
      </g>

      <path className="landscape__wave landscape__wave--front" d={wavePath(270, 7)} fill={colors.waveFront} />
    </svg>
  );
};

export default Landscape;
