import { PortfolioScene } from './components/3d/Scene/PortfolioScene'
import './App.css'

function App() {
  const handleSceneReady = () => {
    console.log('3D Scene is ready!')
  }

  return (
    <PortfolioScene 
      onSceneReady={handleSceneReady}
      performanceMode="auto"
    />
  )
}

export default App
