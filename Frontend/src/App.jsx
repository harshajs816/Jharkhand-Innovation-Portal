import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AppProvider }  from './context/AppContext'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/layout/ProtectedRoute'

import Login           from './pages/Login'
import Register        from './pages/Citizen/Register'
import Dashboard       from './pages/Citizen/Dashboard'
import SubmitChallenge from './pages/Citizen/SubmitChallenge'
import MyChallenges    from './pages/Citizen/MyChallenges'
import PublicFeed      from './pages/Citizen/PublicFeed'
import SuccessStories  from './pages/Citizen/SuccessStories'
import PilotFeedback   from './pages/Citizen/PilotFeedback'
import Notifications   from './pages/Citizen/Notifications'
import Profile         from './pages/Citizen/Profile'

import UniversityDashboard  from "./pages/University/Dashboard";
import GovernmentDashboard  from "./pages/Government/GovernmentDashboard";
import ChallengeReview      from "./pages/Government/ChallengeReview";
import AssignedChallenges   from "./pages/University/AssignedChallenges";
import UniversityLogin      from "./pages/University/login";
import UniversityRegister   from "./pages/University/Register";
import UniversityProfile    from "./pages/University/Profile";

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
              <Route path="/"                   element={<Navigate to="/login" replace />} />
              <Route path="/login"              element={<Login />} />
              <Route path="/register"           element={<Register />} />
              <Route path="/university/login"   element={<UniversityLogin />} />
              <Route path="/university/register" element={<UniversityRegister />} />

              {/* Protected routes */}
              <Route path="/citizen/dashboard"                  element={<P><Dashboard /></P>} />
              <Route path="/submit"            element={<P><SubmitChallenge /></P>} />
              <Route path="/my-challenges"     element={<P><MyChallenges /></P>} />
              <Route path="/my-challenges/:id" element={<P><MyChallenges /></P>} />
              <Route path="/public-feed"       element={<P><PublicFeed /></P>} />
              <Route path="/success-stories"   element={<P><SuccessStories /></P>} />
              <Route path="/pilot-feedback"    element={<P><PilotFeedback /></P>} />
              <Route path="/notifications"     element={<P><Notifications /></P>} />
              <Route path="/profile"           element={<P><Profile /></P>} />
              <Route path="/university/dashboard"         element={<P><UniversityDashboard/></P>} />
              <Route path="/university/profile"           element={<P><UniversityProfile /></P>} />
              <Route path="/government-dashboard"         element={<P><GovernmentDashboard /></P>} />
              <Route path="/government/review"            element={<P><ChallengeReview /></P>} />
              <Route path="/assigned-challenges"          element={<P><AssignedChallenges /></P>} />
                

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
