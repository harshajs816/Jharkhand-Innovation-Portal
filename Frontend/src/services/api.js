import api from './axiosInstance'

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data)   => api.post('/auth/register', data).then(r => r.data),
  login:    (data)   => api.post('/auth/login',    data).then(r => r.data),
  logout:   ()       => api.post('/auth/logout').then(r => r.data),
  refresh:  ()       => api.post('/auth/refresh').then(r => r.data),
  getMe:    ()       => api.get('/auth/me').then(r => r.data),
}

// ── Challenges ────────────────────────────────────────────────────────────────
export const challengeAPI = {
  getMyChallenges:   (params) => api.get('/challenges/my', { params }).then(r => r.data),
  getPublicFeed:     (params) => api.get('/challenges/public', { params }).then(r => r.data),
  getById:           (id)     => api.get(`/challenges/${id}`).then(r => r.data),
  getStats:          ()       => api.get('/challenges/stats').then(r => r.data),

  create: (formData) => api.post('/challenges', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data),

  endorse:      (id)           => api.post(`/challenges/${id}/endorse`).then(r => r.data),
  updateStatus: (id, body)     => api.patch(`/challenges/${id}/status`, body).then(r => r.data),
  delete:       (id)           => api.delete(`/challenges/${id}`).then(r => r.data),
}

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationAPI = {
  getAll:      (params) => api.get('/notifications', { params }).then(r => r.data),
  markRead:    (id)     => api.patch(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: ()       => api.patch('/notifications/read-all').then(r => r.data),
  delete:      (id)     => api.delete(`/notifications/${id}`).then(r => r.data),
}

// ── Success Stories ───────────────────────────────────────────────────────────
export const successStoryAPI = {
  getAll: (params) => api.get('/success-stories', { params }).then(r => r.data),
  getOne: (id)     => api.get(`/success-stories/${id}`).then(r => r.data),
}

// ── Pilot Feedback ────────────────────────────────────────────────────────────
export const pilotFeedbackAPI = {
  getPending:        ()     => api.get('/pilot-feedback/pending').then(r => r.data),
  getForChallenge:   (id)   => api.get(`/pilot-feedback/challenge/${id}`).then(r => r.data),
  submit:            (data) => api.post('/pilot-feedback', data).then(r => r.data),
}

// ── Profile ───────────────────────────────────────────────────────────────────
export const profileAPI = {
  get:            ()     => api.get('/profile').then(r => r.data),
  update:         (data) => api.patch('/profile', data).then(r => r.data),
  changePassword: (data) => api.patch('/profile/password', data).then(r => r.data),
}
