import { useLang } from '../context/LangContext'
import { useData } from '../context/DataContext'
import { isCloudEnabled } from '../config/platform'
import { t } from '../i18n/translations'
import { Badge, Card } from './ui'

export function CloudStatusCard() {
  const { lang } = useLang()
  const { cloudStatus, syncError } = useData()

  if (!isCloudEnabled()) {
    return (
      <Card className="cloud-status-card">
        <h3>{t(lang, 'cloudStatus')}</h3>
        <p className="muted">{t(lang, 'cloudLocalMode')}</p>
      </Card>
    )
  }

  return (
    <Card className="cloud-status-card">
      <h3>{t(lang, 'cloudStatus')}</h3>
      <div className="cloud-status-grid">
        <div>
          <span className="muted">{t(lang, 'cloudSync')}</span>
          <Badge tone={syncError ? 'bad' : 'good'}>
            {syncError ? t(lang, 'cloudSyncError') : t(lang, 'cloudConnected')}
          </Badge>
        </div>
        <div>
          <span className="muted">{t(lang, 'cloudEmail')}</span>
          <Badge tone={cloudStatus?.emailEnabled ? 'good' : 'warn'}>
            {cloudStatus?.emailEnabled ? t(lang, 'cloudLive') : t(lang, 'cloudSimulated')}
          </Badge>
        </div>
        <div>
          <span className="muted">{t(lang, 'cloudAssistant')}</span>
          <Badge tone={cloudStatus?.gptEnabled ? 'good' : 'warn'}>
            {cloudStatus?.gptEnabled ? t(lang, 'cloudGptLive') : t(lang, 'cloudRules')}
          </Badge>
        </div>
        <div>
          <span className="muted">{t(lang, 'cloudPayments')}</span>
          <Badge tone={cloudStatus?.stripeEnabled ? 'good' : 'warn'}>
            {cloudStatus?.stripeEnabled ? t(lang, 'cloudStripeLive') : t(lang, 'cloudSimulated')}
          </Badge>
        </div>
      </div>
      {syncError ? <p className="muted">{syncError}</p> : null}
    </Card>
  )
}
