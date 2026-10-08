/** Outline icons (never emoji), drawn the same way as in the mockups: 24×24, round line ends. */
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useTheme } from '@/lib/theme';

const shapes = {
  back: <Path d="M15 6l-6 6 6 6" />,
  chevron: <Path d="M9 6l6 6-6 6" />,
  down: <Path d="M6 9l6 6 6-6" />,
  share: (
    <>
      <Path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
      <Path d="M16 6l-4-4-4 4" />
      <Path d="M12 2v13" />
    </>
  ),
  wifi: (
    <>
      <Path d="M2 8.5a15 15 0 0 1 20 0" />
      <Path d="M5 12a10.5 10.5 0 0 1 14 0" />
      <Path d="M8.5 15.5a5.5 5.5 0 0 1 7 0" />
      <Path d="M12 19h.01" />
    </>
  ),
  bell: (
    <>
      <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <Path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
    </>
  ),
  key: (
    <>
      <Circle cx={7.5} cy={15.5} r={4.5} />
      <Path d="M10.7 12.3L21 2M17 6l3 3M14 9l2 2" />
    </>
  ),
  aid: (
    <>
      <Rect x={3} y={6} width={18} height={14} rx={3} />
      <Path d="M9 6V4h6v2M12 10v6M9 13h6" />
    </>
  ),
  bolt: <Path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  drop: <Path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />,
  tv: (
    <>
      <Rect x={2} y={6} width={20} height={13} rx={2} />
      <Path d="M8 2l4 4 4-4" />
    </>
  ),
  thermometer: <Path d="M14 14.8V4a2 2 0 0 0-4 0v10.8a4 4 0 1 0 4 0z" />,
  paw: (
    <>
      <Circle cx={6} cy={11} r={1.8} />
      <Circle cx={9.5} cy={6.5} r={1.8} />
      <Circle cx={14.5} cy={6.5} r={1.8} />
      <Circle cx={18} cy={11} r={1.8} />
      <Path d="M8 17c0-3 2-5 4-5s4 2 4 5a2.5 2.5 0 0 1-4 2 2.5 2.5 0 0 1-4-2z" />
    </>
  ),
  lock: (
    <>
      <Rect x={4} y={11} width={16} height={10} rx={2} />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
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
  color,
  strokeWidth = 2,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const { colors } = useTheme();
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? colors.ink}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round">
      {shapes[name]}
    </Svg>
  );
}
