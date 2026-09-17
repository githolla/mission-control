import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import Missions from './pages/Missions'
import Teams from './pages/Teams'
import Decisions from './pages/Decisions'
import AIActivity from './pages/AIActivity'
import Knowledge from './pages/Knowledge'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="missions" element={<Missions />} />
        <Route path="teams" element={<Teams />} />
        <Route path="decisions" element={<Decisions />} />
        <Route path="ai-activity" element={<AIActivity />} />
        <Route path="knowledge" element={<Knowledge />} />
        <Route path="*" element={<Overview />} />
      </Route>
    </Routes>
  )
}
