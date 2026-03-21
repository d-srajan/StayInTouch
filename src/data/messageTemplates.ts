export const templates: Record<string, Record<string, string[]>> = {
  general: {
    warm: [
      "Hey {name}, been thinking about you. How are you doing?",
      "Hi {name}! Just wanted to check in and see how you're going.",
      "Thinking of you, {name}. Hope everything's good on your end.",
    ],
    casual: [
      "Yo {name}! What's going on with you lately?",
      "Hey {name}, what have you been up to?",
      "Hey! Haven't caught up in a bit — what's new with you, {name}?",
    ],
    brief: [
      "Hi {name}! Just wanted to say hi.",
      "Hey {name} — hi!",
      "Thinking of you {name}! Hope you're well.",
    ],
    playful: [
      "Randomly thought of you, {name}. Hope life's treating you well!",
      "Hey {name}! My brain decided to think about you today. How are things?",
      "You crossed my mind, {name}! What are you up to?",
    ],
  },
  long_gap: {
    warm: [
      "Hey {name}, it's been too long! Was thinking about you. How's life?",
      "Hi {name}! We haven't spoken in a while — hope you're doing well.",
      "Hey {name}! I've been meaning to reach out. How are you doing?",
    ],
    casual: [
      "{name}! We haven't talked in ages. What are you up to?",
      "Hey {name}, long time! Fill me in on your life.",
    ],
  },
  birthday: {
    warm: [
      "Happy birthday {name}! Hope your day is as wonderful as you are.",
      "Wishing you the happiest birthday, {name}! Hope it's a great one.",
      "Happy birthday! Thinking of you today, {name} — hope it's a lovely day.",
    ],
    casual: [
      "Happy birthday!! Hope it's a great one {name} :)",
      "HAPPY BIRTHDAY {name}!! Hope you have an amazing day!",
    ],
    brief: [
      "Happy birthday {name}!",
      "Happy birthday! Hope it's a good one :)",
    ],
  },
  occasion: {
    warm: [
      "Thinking of you today, {name}. Hope it's a beautiful one.",
      "Just wanted to say hi and wish you a wonderful day, {name}.",
    ],
  },
  family: {
    warm: [
      "Hi {name}! Just wanted to check in. Miss you — hope everything is good.",
      "Hey {name}, thinking of you. How is everything going?",
      "Hi {name}! Just checking in — hope all is well with you.",
    ],
  },
  professional: {
    formal: [
      "Hi {name}, hope you're doing well. Wanted to check in and see how things are going on your end.",
      "Hi {name}, hope all is well. Just wanted to touch base — let me know if you'd like to catch up.",
    ],
    casual: [
      "Hey {name}! Hope work's going well. Would love to catch up sometime.",
    ],
  },
};

// Ultimate fallback — never fails
export const FALLBACK_MESSAGE = "Hi {name}!";

// Session rotation index to avoid repeats
let sessionIndex = 0;

export function getTemplate(
  context: string,
  tone: string,
  name: string
): string {
  const pool =
    templates[context]?.[tone] ??
    templates[context]?.["warm"] ??
    templates["general"]["warm"];

  const template = pool[sessionIndex % pool.length];
  sessionIndex++;
  return (template ?? FALLBACK_MESSAGE).replace(/\{name\}/g, name);
}
