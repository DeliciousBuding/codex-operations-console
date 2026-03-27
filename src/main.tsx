import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../node_modules/@douyinfe/semi-ui/dist/css/semi.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
