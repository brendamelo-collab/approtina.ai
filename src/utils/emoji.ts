// Emojis sempre como emojis: alguns itens antigos guardaram o NOME de um ícone ("wrench", "bed",
// "sparkles") em vez do emoji, e alguns campos cortavam emojis compostos (👨‍👩‍👧) pela metade.
// Aqui fica a regra única: mostrar, gravar e falar emojis sem virar letras ou códigos.

const PICTO = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u;

/** Nomes de ícones (inglês e português) que já apareceram nos dados → emoji equivalente. */
const ICON_WORDS: Record<string, string> = {
  wrench: '🔧',
  tool: '🔧',
  tools: '🛠️',
  hammer: '🔨',
  bed: '🛏️',
  cama: '🛏️',
  sparkles: '✨',
  sparkle: '✨',
  star: '⭐',
  home: '🏠',
  house: '🏠',
  casa: '🏠',
  heart: '❤️',
  heartpulse: '🩺',
  stethoscope: '🩺',
  pill: '💊',
  pills: '💊',
  medicine: '💊',
  remedio: '💊',
  car: '🚗',
  carro: '🚗',
  bike: '🚲',
  shirt: '👕',
  shoe: '👟',
  shoes: '👟',
  leaf: '🌿',
  plant: '🪴',
  flower: '🌸',
  sun: '☀️',
  moon: '🌙',
  coffee: '☕',
  cup: '☕',
  utensils: '🍽️',
  food: '🍽️',
  apple: '🍎',
  book: '📖',
  bookopen: '📖',
  books: '📚',
  school: '🎒',
  backpack: '🎒',
  graduationcap: '🎓',
  calendar: '📅',
  calendardays: '📅',
  clock: '🕒',
  alarm: '⏰',
  alarmclock: '⏰',
  bell: '🔔',
  trash: '🗑️',
  trash2: '🗑️',
  broom: '🧹',
  brush: '🪥',
  toothbrush: '🪥',
  bath: '🛁',
  shower: '🚿',
  droplet: '💧',
  droplets: '💧',
  water: '💧',
  dumbbell: '🏋️',
  activity: '🏃',
  run: '🏃',
  baby: '👶',
  user: '👤',
  users: '👨‍👩‍👧',
  family: '👨‍👩‍👧',
  dog: '🐶',
  cat: '🐱',
  paw: '🐾',
  pawprint: '🐾',
  wallet: '👛',
  dollar: '💰',
  dollarsign: '💰',
  money: '💰',
  piggybank: '🐷',
  shoppingcart: '🛒',
  cart: '🛒',
  gift: '🎁',
  phone: '📱',
  smartphone: '📱',
  laptop: '💻',
  briefcase: '💼',
  work: '💼',
  music: '🎵',
  film: '🎬',
  tv: '📺',
  gamepad: '🎮',
  gamepad2: '🎮',
  ball: '⚽',
  soccer: '⚽',
  target: '🎯',
  trophy: '🏆',
  check: '✅',
  checkcircle: '✅',
  checksquare: '✅',
  list: '📋',
  clipboard: '📋',
  clipboardlist: '📋',
  repeat: '🔁',
  refresh: '🔁',
  refreshcw: '🔁',
  rotateccw: '🔁',
  zap: '⚡',
  battery: '🔋',
  thermometer: '🌡️',
  snowflake: '❄️',
  wind: '🌬️',
  scissors: '✂️',
  smile: '🙂',
  bot: '🤖',
  lightbulb: '💡',
  key: '🔑',
  lock: '🔒',
  mail: '✉️',
  package: '📦',
  box: '📦',
  truck: '🚚',
  plane: '✈️',
  map: '🗺️',
  mappin: '📍',
  pin: '📌',
  church: '⛪',
  bible: '📖',
  pray: '🙏'
};

/** True se o texto tem pelo menos um emoji/pictograma. */
export const hasEmoji = (s: unknown): s is string => typeof s === 'string' && PICTO.test(s);

/** Primeiro "caractere visível" inteiro (mantém 👨‍👩‍👧, ☀️, 🧖‍♀️ e bandeiras juntos). */
export const firstGrapheme = (s: string): string => {
  if (!s) return '';
  try {
    const Seg = (Intl as any).Segmenter;
    if (Seg) {
      const it = new Seg('pt', { granularity: 'grapheme' }).segment(s)[Symbol.iterator]();
      const first = it.next();
      return first.done ? '' : (first.value.segment as string);
    }
  } catch {
    // sem Intl.Segmenter: usa o caminho abaixo
  }
  const m = s.match(/(?:\p{Regional_Indicator}{2})|(?:\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?(?:‍\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?)*)/u);
  return m ? m[0] : Array.from(s)[0] || '';
};

/** Converte o nome de um ícone ("wrench", "BookOpen", "check-circle") no emoji; '' se não conhecer. */
export const emojiForWord = (s: string): string => {
  const k = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  return ICON_WORDS[k] || '';
};

/**
 * O que mostrar como ícone: o emoji gravado (inteiro), o emoji do nome do ícone, ou o reserva.
 * Nunca devolve letras soltas, nomes de ícones ou pedaços de emoji.
 */
export const displayEmoji = (icon: unknown, fallback = '✨'): string => {
  if (typeof icon !== 'string') return fallback;
  const t = icon.trim();
  if (!t) return fallback;
  if (hasEmoji(t)) {
    const start = t.search(PICTO);
    const g = firstGrapheme(t.slice(Math.max(0, start)));
    return g && hasEmoji(g) ? g : fallback;
  }
  return emojiForWord(t) || fallback;
};

/** Para gravar: mantém só um emoji inteiro (ou '' para usar o padrão). */
export const cleanEmojiInput = (s: string): string => {
  const t = (s || '').trim();
  if (!t) return '';
  if (hasEmoji(t)) return displayEmoji(t, '');
  return emojiForWord(t);
};

/** Ícones antigos gravados como nome ("wrench") viram o emoji; o resto fica igual. */
export const fixStoredIcon = <T extends { icon?: string }>(item: T): T => {
  if (!item || typeof item.icon !== 'string' || !item.icon.trim() || hasEmoji(item.icon)) return item;
  const e = emojiForWord(item.icon);
  return e ? { ...item, icon: e } : item;
};

/** Texto falado sem emojis (a voz não lê "rosto sorridente" no meio do lembrete). */
export const stripEmojis = (s: string): string =>
  (s || '')
    .replace(/\p{Regional_Indicator}|\p{Extended_Pictographic}|️|‍|\p{Emoji_Modifier}/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

/** "💧 " antes de um título, ou nada (nunca o nome do ícone). */
export const iconPrefix = (icon: unknown): string => {
  const e = displayEmoji(icon, '');
  return e ? `${e} ` : '';
};
