import { loadingAnimation } from 'components/Loader/styled'
import deprecatedStyled from 'lib/styled-components'
import { lighten } from 'polished'

/* Loading state bubbles (animation style from: src/components/Loader/styled.tsx) */
export const LoadingBubble = deprecatedStyled.div<{
  height?: string
  width?: string
  round?: boolean
  delay?: string
  margin?: string
}>`
  border-radius: 12px;
  border-radius: ${({ round }) => (round ? '50%' : '12px')};
  ${({ margin }) => margin && `margin: ${margin}`};
  height: ${({ height }) => height ?? '24px'};
  width: 50%;
  width: ${({ width }) => width ?? '50%'};
  animation: ${loadingAnimation} 1.5s infinite;
  ${({ delay }) => delay && `animation-delay: ${delay};`}
  animation-fill-mode: both;
  background: linear-gradient(
    to left,
    ${({ theme }) => theme.surface3} 25%,
    // Default color values prevent undefined argument error
    ${({ theme }) => lighten(0.075, theme.surface3 ?? '#FFFFFF12')} 50%,
    ${({ theme }) => theme.surface3} 75%
  );
  will-change: background-position;
  background-size: 400%;
`
