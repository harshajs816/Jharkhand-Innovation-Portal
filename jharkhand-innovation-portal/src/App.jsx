import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AppProvider }  from './context/AppContext'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/layout/ProtectedRoute'

import Login           from './pages/Login'
import Register        from './pages/Register'
import Dashboard       from './pages/Dashboard'
import SubmitChallenge from './pages/SubmitChallenge'
import MyChallenges    from './pages/MyChallenges'
import PublicFeed      from './pages/PublicFeed'
import SuccessStories  from './pages/SuccessStories'
import PilotFeedback   from './pages/PilotFeedback'
import Notifications   from './pages/Notifications'
import Profile         from './pages/Profile'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:          1000 * 60 * 2,   // 2 min
      retry:              1,
      refetchOnWindowFocus: false,
    },
  },
})

// Wrap all protected pages
const P = ({ children }) => <ProtectedRoute>{children}</ProtectedRoute>

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login"    element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes */}
              <Route path="/"                  element={<P><Dashboard /></P>} />
              <Route path="/submit"            element={<P><SubmitChallenge /></P>} />
              <Route path="/my-challenges"     element={<P><MyChallenges /></P>} />
              <Route path="/my-challenges/:id" element={<P><MyChallenges /></P>} />
              <Route path="/public-feed"       element={<P><PublicFeed /></P>} />
              <Route path="/success-stories"   element={<P><SuccessStories /></P>} />
              <Route path="/pilot-feedback"    element={<P><PilotFeedback /></P>} />
              <Route path="/notifications"     element={<P><Notifications /></P>} />
              <Route path="/profile"           element={<P><Profile /></P>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </AppProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
