import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layout/AppLayout'
import Overview from './pages/Overview'
import Forecast from './pages/Forecast'
import Ingredients from './pages/Ingredients'
import Override from './pages/Override'
import PrepSheet from './pages/PrepSheet'
import Assistant from './pages/Assistant'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Overview />} />
        <Route path="/forecast" element={<Forecast />} />
        <Route path="/ingredients" element={<Ingredients />} />
        <Route path="/override" element={<Override />} />
        <Route path="/prep" element={<PrepSheet />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
