import { memo } from 'react';
import { EMOJIS, type NombreEmoji } from '../emojis';

/** Emoticono vectorial (Fluent Emoji de Microsoft, MIT). */
export const Emoji = memo(function Emoji({ n, size = 32, className }: { n: NombreEmoji; size?: number; className?: string }) {
  const e = EMOJIS[n];
  return (
    <svg className={className} width={size} height={size} viewBox={`0 0 ${e.w} ${e.h}`} aria-hidden="true" focusable="false"
      dangerouslySetInnerHTML={{ __html: e.body }} />
  );
});

/** Para usar dentro de un <svg> (por ejemplo, los ejes de un gráfico). */
export function EmojiSvg({ n, x, y, size = 24 }: { n: NombreEmoji; x: number; y: number; size?: number }) {
  const e = EMOJIS[n];
  return <svg x={x} y={y} width={size} height={size} viewBox={`0 0 ${e.w} ${e.h}`} dangerouslySetInnerHTML={{ __html: e.body }} />;
}
