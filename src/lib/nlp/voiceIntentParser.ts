/**
 * VoltFlow English Language NLP Intent Parser
 * Recognizes natural, colloquial, and conversational English voice commands
 * for smart lighting, PWM ceiling fan regulator, timers, and energy modes.
 */

export interface ParsedVoiceIntent {
  device: 'light' | 'fan';
  action: 'on' | 'off' | 'eco' | 'normal' | 'speed' | 'set_timer';
  value?: number;
  duration_seconds?: number;
  timer_action?: 'on' | 'off';
  humanDescription: string;
  confidence: number;
}

export interface VoiceContext {
  lightOn?: boolean;
  fanSpeed?: number;
}

// English written number to digit map
const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  ninety: 90,
  hundred: 100,
};

/**
 * Normalizes input text by converting written English numbers to digits
 * and stripping unnecessary filler punctuation.
 */
export function normalizeEnglishText(input: string): string {
  let text = input
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Replace phrases like "half an hour" with "30 minutes"
  text = text.replace(/\bhalf\s+an?\s+hour\b/g, '30 minutes');
  text = text.replace(/\ba\s+couple\s+of\s+minutes\b/g, '2 minutes');
  text = text.replace(/\ba\s+couple\s+of\s+seconds\b/g, '2 seconds');
  text = text.replace(/\ba\s+few\s+minutes\b/g, '3 minutes');
  text = text.replace(/\ba\s+few\s+seconds\b/g, '10 seconds');
  text = text.replace(/\ban?\s+hour\b/g, '60 minutes');
  text = text.replace(/\ba\s+minute\b/g, '1 minute');
  text = text.replace(/\ba\s+second\b/g, '1 second');

  // Convert word numbers to digits
  const tokens = text.split(' ');
  const normalizedTokens = tokens.map((t) => (NUMBER_WORDS[t] !== undefined ? String(NUMBER_WORDS[t]) : t));

  return normalizedTokens.join(' ');
}

/**
 * Extracts duration in seconds from normalized text (e.g. "5 minutes", "30s", "1 hour")
 */
function extractDurationInSeconds(text: string): number | null {
  // Pattern 1: e.g. "5 minutes", "10 min", "45 seconds", "2 hrs"
  const match = text.match(/\b(\d+)\s*(hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s)\b/i);
  if (match) {
    const val = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    if (unit.startsWith('h')) return val * 3600;
    if (unit.startsWith('m')) return val * 60;
    return val;
  }

  // Pattern 2: e.g. "for 10" in a timer context -> default to minutes if small, seconds if large
  const forMatch = text.match(/\b(?:for|in|after)\s+(\d+)\b/i);
  if (forMatch) {
    const num = parseInt(forMatch[1], 10);
    return num <= 120 ? num * 60 : num;
  }

  return null;
}

/**
 * Main English Natural Language Processing (NLP) Parser
 * Accepts any natural English sentence or phrase and returns parsed intents.
 */
export function parseEnglishVoiceIntent(
  rawText: string,
  context: VoiceContext = {}
): ParsedVoiceIntent[] | null {
  if (!rawText || !rawText.trim()) return null;

  const normalized = normalizeEnglishText(rawText);

  // --------------------------------------------------------------------------
  // 1. GLOBAL / ALL APPLIANCES INTENTS
  // --------------------------------------------------------------------------
  const isTurnOffEverything =
    normalized.includes('turn off everything') ||
    normalized.includes('switch off everything') ||
    normalized.includes('shut down everything') ||
    normalized.includes('kill everything') ||
    normalized.includes('turn off all') ||
    normalized.includes('switch off all') ||
    normalized.includes('good night') ||
    normalized.includes('goodnight') ||
    normalized.includes('leaving home') ||
    normalized.includes('leaving the house') ||
    normalized.includes('going to sleep');

  if (isTurnOffEverything) {
    return [
      {
        device: 'light',
        action: 'off',
        value: 0,
        humanDescription: 'Turn Smart Light OFF (Good Night / All Off)',
        confidence: 0.95,
      },
      {
        device: 'fan',
        action: 'off',
        value: 0,
        humanDescription: 'Turn Ceiling Fan OFF (Good Night / All Off)',
        confidence: 0.95,
      },
    ];
  }

  // --------------------------------------------------------------------------
  // 2. CONTEXTUAL / INFERENCE INTENTS (No explicit device mentioned)
  // --------------------------------------------------------------------------
  // "it's too dark", "can't see anything", "pitch black", "illuminate the room"
  if (
    normalized.includes('too dark') ||
    normalized.includes('so dark') ||
    normalized.includes('cant see') ||
    normalized.includes('cannot see') ||
    normalized.includes('pitch black') ||
    normalized.includes('illuminate')
  ) {
    return [
      {
        device: 'light',
        action: 'on',
        value: 1,
        humanDescription: 'Turn Smart Light ON (Detected low visibility)',
        confidence: 0.9,
      },
    ];
  }

  // "it's too hot", "sweating", "need air", "warm in here" -> Fan high
  if (
    normalized.includes('too hot') ||
    normalized.includes('sweating') ||
    normalized.includes('so warm') ||
    normalized.includes('need air') ||
    normalized.includes('need breeze')
  ) {
    return [
      {
        device: 'fan',
        action: 'speed',
        value: 255,
        humanDescription: 'Set Fan to Speed 3 (High - Detected warm environment)',
        confidence: 0.9,
      },
    ];
  }

  // "it's cold", "freezing", "chilly" -> Fan OFF
  if (
    normalized.includes('too cold') ||
    normalized.includes('freezing') ||
    normalized.includes('chilly') ||
    normalized.includes('shivering')
  ) {
    return [
      {
        device: 'fan',
        action: 'off',
        value: 0,
        humanDescription: 'Turn Ceiling Fan OFF (Detected cold environment)',
        confidence: 0.9,
      },
    ];
  }

  // --------------------------------------------------------------------------
  // 3. TARGET ENTITY DETECTION
  // --------------------------------------------------------------------------
  const hasLightEntity = /\b(light|lights|lighting|led|lamp|lamps|bulb|bulbs|tubelight|tube|illumination)\b/i.test(
    normalized
  );
  const hasFanEntity = /\b(fan|fans|ceiling\s+fan|cooler|blower|regulator|ventilation|air|blade|blades)\b/i.test(
    normalized
  );

  // --------------------------------------------------------------------------
  // 4. TIMER CANCELLATION / DELETION INTENTS
  // --------------------------------------------------------------------------
  const isCancelTimer = /\b(cancel|delete|remove|clear|stop|abort|kill|drop)\b.*\b(timer|timers|countdown)\b/i.test(
    normalized
  );

  if (isCancelTimer) {
    const results: ParsedVoiceIntent[] = [];
    if (hasLightEntity || (!hasLightEntity && !hasFanEntity)) {
      results.push({
        device: 'light',
        action: 'set_timer',
        duration_seconds: 0,
        timer_action: 'off',
        humanDescription: 'Delete & Cancel Smart Light Timer',
        confidence: 0.95,
      });
    }
    if (hasFanEntity || (!hasLightEntity && !hasFanEntity)) {
      results.push({
        device: 'fan',
        action: 'set_timer',
        duration_seconds: 0,
        timer_action: 'off',
        humanDescription: 'Delete & Cancel Ceiling Fan Timer',
        confidence: 0.95,
      });
    }
    return results.length > 0 ? results : null;
  }

  // --------------------------------------------------------------------------
  // 5. TIMER ARMING INTENTS
  // e.g. "turn off light in 5 minutes", "fan timer 30 seconds", "shut down fan after 2 minutes"
  // --------------------------------------------------------------------------
  const isTimerContext =
    /\b(timer|countdown|after|in)\b/i.test(normalized) &&
    /\b(\d+|hour|hours|minute|minutes|second|seconds|min|sec)\b/i.test(normalized);

  if (isTimerContext) {
    const duration = extractDurationInSeconds(normalized);
    if (duration && duration > 0) {
      const isTargetOff =
        /\b(off|stop|shut|disable|kill|down|extinguish)\b/i.test(normalized) ||
        (!/\b(on|start|enable|spin)\b/i.test(normalized) &&
          ((hasLightEntity && context.lightOn) || (hasFanEntity && (context.fanSpeed || 0) > 0)));

      const targetAction = isTargetOff ? 'off' : 'on';
      const targetDevice = hasFanEntity ? 'fan' : 'light';

      return [
        {
          device: targetDevice,
          action: 'set_timer',
          duration_seconds: duration,
          timer_action: targetAction,
          value: targetDevice === 'fan' ? (targetAction === 'off' ? 0 : 150) : targetAction === 'off' ? 0 : 1,
          humanDescription: `Arm ${targetDevice.toUpperCase()} Timer: Auto-${targetAction.toUpperCase()} in ${duration >= 60 ? `${Math.round(duration / 60)} min` : `${duration}s`}`,
          confidence: 0.92,
        },
      ];
    }
  }

  // --------------------------------------------------------------------------
  // 6. ECO / MOTION MODE INTENTS (Lighting)
  // e.g. "save power", "conserve energy", "activate eco mode", "motion sensing mode"
  // --------------------------------------------------------------------------
  const isEcoIntent =
    /\b(eco|economy|energy\s+saving|save\s+power|save\s+electricity|motion\s+mode|pir|motion\s+sensor|green\s+mode)\b/i.test(
      normalized
    );

  if (isEcoIntent) {
    return [
      {
        device: 'light',
        action: 'eco',
        value: 1,
        humanDescription: 'Enable Smart Light ECO Mode (PIR Sensor Automation)',
        confidence: 0.95,
      },
    ];
  }

  const isNormalModeIntent =
    /\b(normal\s+mode|manual\s+mode|regular\s+mode|standard\s+mode|disable\s+eco)\b/i.test(normalized);

  if (isNormalModeIntent) {
    return [
      {
        device: 'light',
        action: 'normal',
        value: 0,
        humanDescription: 'Switch Smart Light to Normal Manual Mode',
        confidence: 0.95,
      },
    ];
  }

  // --------------------------------------------------------------------------
  // 7. LIGHT SPECIFIC ON / OFF INTENTS
  // e.g. "turn on the light", "brighten the led", "switch off lamp", "kill the bulb"
  // --------------------------------------------------------------------------
  const isPowerOnLight =
    hasLightEntity &&
    /\b(on|start|open|enable|illuminate|brighten|fire|power\s+on|switch\s+on|turn\s+on|light\s+up)\b/i.test(
      normalized
    );

  if (isPowerOnLight) {
    return [
      {
        device: 'light',
        action: 'on',
        value: 1,
        humanDescription: 'Turn Smart Light ON',
        confidence: 0.95,
      },
    ];
  }

  const isPowerOffLight =
    hasLightEntity &&
    /\b(off|stop|shut|disable|extinguish|kill|power\s+off|switch\s+off|turn\s+off|cut\s+off|close)\b/i.test(
      normalized
    );

  if (isPowerOffLight) {
    return [
      {
        device: 'light',
        action: 'off',
        value: 0,
        humanDescription: 'Turn Smart Light OFF',
        confidence: 0.95,
      },
    ];
  }

  // --------------------------------------------------------------------------
  // 8. FAN SPEED & ON/OFF INTENTS
  // e.g. "fan to max", "slow down the fan", "speed 1", "turn on the fan", "shut off fan"
  // --------------------------------------------------------------------------
  const isFanOff =
    hasFanEntity &&
    /\b(off|stop|shut|halt|kill|zero|disable|turn\s+off|switch\s+off|power\s+off|cut\s+off)\b/i.test(
      normalized
    );

  if (isFanOff) {
    return [
      {
        device: 'fan',
        action: 'off',
        value: 0,
        humanDescription: 'Turn Ceiling Fan OFF (0 PWM)',
        confidence: 0.95,
      },
    ];
  }

  // High speed synonyms: 3, high, max, maximum, fastest, turbo, boost, full, top, crank up, full blast
  const isFanHigh =
    (hasFanEntity || normalized.includes('speed')) &&
    /\b(3|three|third|high|max|maximum|fastest|turbo|boost|full|top|blast|faster|speed\s+up|crank\s+up)\b/i.test(
      normalized
    );

  if (isFanHigh) {
    return [
      {
        device: 'fan',
        action: 'speed',
        value: 255,
        humanDescription: 'Set Ceiling Fan to Speed 3 (High, 255 PWM)',
        confidence: 0.95,
      },
    ];
  }

  // Low speed synonyms: 1, low, slow, minimum, min, gentle, breeze, lowest, slower, slow down
  const isFanLow =
    (hasFanEntity || normalized.includes('speed')) &&
    /\b(1|one|first|low|slow|minimum|min|gentle|breeze|lowest|slower|slow\s+down)\b/i.test(
      normalized
    );

  if (isFanLow) {
    return [
      {
        device: 'fan',
        action: 'speed',
        value: 80,
        humanDescription: 'Set Ceiling Fan to Speed 1 (Low, 80 PWM)',
        confidence: 0.95,
      },
    ];
  }

  // Medium speed synonyms: 2, medium, med, moderate, normal, standard, half, middle, start, turn on fan
  const isFanMedOrStart =
    hasFanEntity &&
    /\b(2|two|second|medium|med|moderate|standard|half|middle|on|start|spin|turn\s+on|switch\s+on)\b/i.test(
      normalized
    );

  if (isFanMedOrStart) {
    return [
      {
        device: 'fan',
        action: 'speed',
        value: 150,
        humanDescription: 'Set Ceiling Fan to Speed 2 (Medium, 150 PWM)',
        confidence: 0.92,
      },
    ];
  }

  // Fallback: If user said "turn on" without explicit target -> Toggle light or fan
  if (/\b(turn\s+on|switch\s+on|power\s+on)\b/i.test(normalized)) {
    return [
      {
        device: 'light',
        action: 'on',
        value: 1,
        humanDescription: 'Turn Smart Light ON (Default target)',
        confidence: 0.7,
      },
    ];
  }

  if (/\b(turn\s+off|switch\s+off|power\s+off|shut\s+off)\b/i.test(normalized)) {
    return [
      {
        device: 'light',
        action: 'off',
        value: 0,
        humanDescription: 'Turn Smart Light OFF (Default target)',
        confidence: 0.7,
      },
    ];
  }

  return null;
}
