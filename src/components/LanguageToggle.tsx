import { useLang } from '../context/LangContext'
import { t } from '../i18n/translations'

export function LanguageToggle() {
  const { lang, setLang } = useLang()

  return (
    <div className="lang-toggle" role="group" aria-label={t(lang, 'language')}>
      <button
        type="button"
        className={lang === 'en' ? 'active' : ''}
        onClick={() => setLang('en')}
      >
        EN
      </button>
      <button
        type="button"
        className={lang === 'ar' ? 'active' : ''}
        onClick={() => setLang('ar')}
      >
        AR
      </button>
    </div>
  )
}
