import en from '@/locales/en.json'
import zh from '@/locales/zh.json'

export type Locale = 'en' | 'zh'

const dictionaries = { en, zh }

export function getDictionary(locale: Locale) {
  return dictionaries[locale] || dictionaries.en
}

export function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.')
  let result: unknown = obj

  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key]
    } else {
      return path
    }
  }

  return typeof result === 'string' ? result : path
}

export type Dictionary = typeof en
