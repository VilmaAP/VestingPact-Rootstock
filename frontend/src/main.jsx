import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import './styles/index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)

console.log(
  "%c₿ VestingPact",
  "color: #f7931a; font-size: 20px; font-weight: bold;"
);
console.log(
  "%cSi estás leyendo esto, sos el tipo de socio que queremos.",
  "color: #94a3b8; font-size: 12px;"
);
