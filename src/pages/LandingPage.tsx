import { useLang } from '../context/LangContext'
import { t } from '../i18n/translations'
import { LanguageToggle } from '../components/LanguageToggle'
import { DemoLoginsCard } from '../components/DemoLoginsCard'
import { BrandMark, Button, Card } from '../components/ui'

export function LandingPage({
  onSignup,
  onLogin,
  onTechnicianLogin,
}: {
  onSignup: () => void
  onLogin: () => void
  onTechnicianLogin: () => void
}) {
  const { lang } = useLang()

  const features = [
    { title: t(lang, 'feature1Title'), desc: t(lang, 'feature1Desc') },
    { title: t(lang, 'feature2Title'), desc: t(lang, 'feature2Desc') },
    { title: t(lang, 'feature3Title'), desc: t(lang, 'feature3Desc') },
    { title: t(lang, 'feature4Title'), desc: t(lang, 'feature4Desc') },
  ]

  const steps = [
    { title: t(lang, 'step1Title'), desc: t(lang, 'step1Desc') },
    { title: t(lang, 'step2Title'), desc: t(lang, 'step2Desc') },
    { title: t(lang, 'step3Title'), desc: t(lang, 'step3Desc') },
  ]

  return (
    <div className="landing">
      <header className="landing-top">
        <div className="brand-row">
          <BrandMark />
          <span className="brand-name">{t(lang, 'brand')}</span>
        </div>
        <LanguageToggle />
      </header>

      <section className="hero">
        <DemoLoginsCard />
        <div className="hero-copy">
          <p className="eyebrow">{t(lang, 'websiteEyebrow')}</p>
          <h1>{t(lang, 'tagline')}</h1>
          <p className="hero-lead">{t(lang, 'websiteLead')}</p>
          <div className="hero-actions">
            <Button onClick={onSignup}>{t(lang, 'companySignup')}</Button>
            <Button variant="ghost" onClick={onLogin}>
              {t(lang, 'login')}
            </Button>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <h2>{t(lang, 'howItWorks')}</h2>
        <div className="steps-grid">
          {steps.map((step, index) => (
            <Card key={step.title} className="step-card">
              <span className="step-number">{index + 1}</span>
              <h3>{step.title}</h3>
              <p className="muted">{step.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="features">
        <h2>{t(lang, 'features')}</h2>
        <div className="feature-grid">
          {features.map((f) => (
            <Card key={f.title}>
              <h3>{f.title}</h3>
              <p className="muted">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="landing-cta">
        <Card className="cta-card">
          <h2>{t(lang, 'ctaTitle')}</h2>
          <p className="muted">{t(lang, 'ctaDesc')}</p>
          <div className="hero-actions">
            <Button onClick={onSignup}>{t(lang, 'getStarted')}</Button>
            <Button variant="soft" onClick={onLogin}>
              {t(lang, 'login')}
            </Button>
          </div>
        </Card>
      </section>

      <footer className="landing-footer">
        <p className="muted">{t(lang, 'websiteFooter')}</p>
        <button type="button" className="text-link" onClick={onTechnicianLogin}>
          {t(lang, 'technicianLogin')}
        </button>
      </footer>
    </div>
  )
}
