/** Outline icons (never emoji), drawn the same way as in the mockups: 24×24, round line ends. */
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/lib/theme';

const shapes = {
  back: <Path d="M15 6l-6 6 6 6" />,
  chevron: <Path d="M9 6l6 6-6 6" />,
  down: <Path d="M6 9l6 6 6-6" />,
  eye: (
    <>
      <Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <Circle cx={12} cy={12} r={3} />
    </>
  ),
  eyeOff: (
    <>
      <Path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.2 3.2M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
      <Path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <Path d="M3 3l18 18" />
    </>
  ),
  pill: (
    <>
      <Rect x={3} y={9} width={18} height={6} rx={3} />
      <Path d="M12 9v6" />
    </>
  ),
  calendar: (
    <>
      <Rect x={3} y={5} width={18} height={16} rx={3} />
      <Path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  close: <Path d="M6 6l12 12M18 6L6 18" />,
  plus: <Path d="M12 5v14M5 12h14" />,
  check: <Path d="M5 12l5 5 9-10" />,
  alert: (
    <>
      <Path d="M12 3l9 16H3z" />
      <Path d="M12 10v4" />
      <Path d="M12 17h.01" />
    </>
  ),
  home: (
    <>
      <Path d="M3 11l9-7 9 7" />
      <Path d="M5 10v10h14V10" />
    </>
  ),
  phone: (
    <Path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
  ),
  settings: (
    <>
      <Circle cx={12} cy={12} r={3} />
      <Path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </>
  ),
  trash: (
    <>
      <Path d="M4 7h16" />
      <Path d="M10 11v6M14 11v6" />
      <Path d="M6 7l1 13h10l1-13" />
      <Path d="M9 7V4h6v3" />
    </>
  ),
  people: (
    <>
      <Circle cx={9} cy={8} r={3} />
      <Path d="M3 20c0-3 3-5 6-5s6 2 6 5" />
      <Circle cx={17} cy={9} r={2.5} />
      <Path d="M16 15c3 0 5 2 5 5" />
    </>
  ),
};

export type IconName = keyof typeof shapes;

export function Icon({
  name,
  size = 20,
  color = colors.ink,
  strokeWidth = 2,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round">
      {shapes[name]}
    </Svg>
  );
}
