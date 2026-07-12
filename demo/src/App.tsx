import { HashRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './lib/theme'
import { BottomNav } from './components/layout/BottomNav'
import { Home } from './screens/Home'
import { QBank } from './screens/QBank'
import { Battle } from './screens/Battle'
import { Flashcards } from './screens/Flashcards'
import { Profile } from './screens/Profile'

export default function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <div className="min-h-svh w-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/qbank" element={<QBank />} />
            <Route path="/battle" element={<Battle />} />
            <Route path="/flashcards" element={<Flashcards />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
          <BottomNav />
        </div>
      </HashRouter>
    </ThemeProvider>
  )
}
