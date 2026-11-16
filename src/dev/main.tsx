import '../presentation/bootstrapPresentation'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppErrorBoundary } from '../components/ui/AppErrorBoundary'
import { DevApp } from './DevApp'
import '../index.css'
import '../ui-system/tokens.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary><DevApp /></AppErrorBoundary>
  </React.StrictMode>
)
