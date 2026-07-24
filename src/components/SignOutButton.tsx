import { useLang } from '../context/LangContext'
import { t } from '../i18n/translations'
import { Button } from './ui'

export function SignOutButton({ onSignOut }: { onSignOut: () => void }) {
  const { lang } = useLang()
  return (
    <Button variant="ghost" className="sign-out-btn" onClick={onSignOut}>
      {t(lang, 'signOut')}
    </Button>
  )
}
