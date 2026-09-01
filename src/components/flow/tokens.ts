// Shared drawing tokens for the hand-drawn flow diagram components.
export const INK = '#1a1a1a'
export const STROKE = 2
export const TEXT_SIZE = 14
export const LINE_HEIGHT = 22

// Excalidraw's Virgil, with handwriting fallbacks.
export const HAND_FONT = "'Virgil', 'Caveat', 'Comic Sans MS', cursive"

/**
 * Wraps a label into lines that fit `maxChars` characters, breaking on words.
 * Rough but predictable — good enough for short flow labels.
 */
export function wrapLabel(label: string, maxChars: number): string[] {
  const words = label.split(' ')
  const lines: string[] = []
  let line = ''

  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (next.length > maxChars && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)

  return lines
}
