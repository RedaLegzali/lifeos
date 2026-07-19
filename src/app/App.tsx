import { Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Layout } from './Layout'
import { HomePage } from '@/pages/HomePage'
import { SettingsPage } from '@/pages/SettingsPage'
import { WidgetPage } from '@/pages/WidgetPage'
import { OnboardingPage } from '@/pages/onboarding/OnboardingPage'
import { widgets } from '@/core/widgets/registry'
import { useSettings } from '@/core/settings/store'

export default function App() {
  const onboarded = useSettings((s) => s.onboarded)

  // Première ouverture (ou relance depuis les Réglages) : l'assistant.
  if (!onboarded) return <OnboardingPage />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        {/* Pages des widgets : la vraie page si le module l'a construite,
            sinon la page « programme » générique. */}
        {widgets.map((w) => (
          <Route
            key={w.id}
            path={w.route}
            element={
              w.Page ? (
                <Suspense fallback={null}>
                  <w.Page />
                </Suspense>
              ) : (
                <WidgetPage widget={w} />
              )
            }
          />
        ))}
        <Route path="/reglages" element={<SettingsPage />} />
        <Route path="*" element={<HomePage />} />
      </Route>
    </Routes>
  )
}
