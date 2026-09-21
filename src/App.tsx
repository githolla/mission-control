import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import ControlRoom from './pages/ControlRoom'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Missions from './pages/Missions'
import MissionDetail from './pages/MissionDetail'
import Teams from './pages/Teams'
import Decisions from './pages/Decisions'
import AIActivity from './pages/AIActivity'
import Knowledge from './pages/Knowledge'
import Analysis from './pages/Analysis'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="control-room" element={<ControlRoom />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="missions" element={<Missions />} />
        <Route path="missions/:id" element={<MissionDetail />} />
        <Route path="teams" element={<Teams />} />
        <Route path="decisions" element={<Decisions />} />
        <Route path="analysis" element={<Analysis />} />
        <Route path="network" element={<Navigate to="/control-room" replace />} />
        <Route path="ai-activity" element={<AIActivity />} />
        <Route path="knowledge" element={<Knowledge />} />
        <Route path="*" element={<Overview />} />
      </Route>
    </Routes>
  )
}
