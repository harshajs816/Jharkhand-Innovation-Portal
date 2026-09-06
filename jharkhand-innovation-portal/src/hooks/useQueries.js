import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  challengeAPI, notificationAPI,
  successStoryAPI, pilotFeedbackAPI, profileAPI,
} from '../services/api'

// ── Query keys ────────────────────────────────────────────────────────────────
export const QK = {
  myChallenges:     (p) => ['myChallenges', p],
  challenge:        (id) => ['challenge', id],
  publicChallenges: (p) => ['publicChallenges', p],
  successStories:   (p) => ['successStories', p],
  notifications:    () => ['notifications'],
  pilotFeedbacks:   () => ['pilotFeedbacks'],
  profile:          () => ['profile'],
  stats:            () => ['stats'],
}

// ── Challenge queries ─────────────────────────────────────────────────────────
export const useMyChallenges = (params = {}) =>
  useQuery({
    queryKey: QK.myChallenges(params),
    queryFn:  () => challengeAPI.getMyChallenges(params),
    select:   (d) => d.data,
  })

export const useChallengeById = (id) =>
  useQuery({
    queryKey: QK.challenge(id),
    queryFn:  () => challengeAPI.getById(id),
    enabled:  !!id,
    select:   (d) => d.data.challenge,
  })

export const usePublicChallenges = (params = {}) =>
  useQuery({
    queryKey: QK.publicChallenges(params),
    queryFn:  () => challengeAPI.getPublicFeed(params),
    select:   (d) => d.data,
  })

export const useDashboardStats = () =>
  useQuery({
    queryKey: QK.stats(),
    queryFn:  () => challengeAPI.getStats(),
    select:   (d) => d.data,
  })

// ── Success stories ───────────────────────────────────────────────────────────
export const useSuccessStories = (params = {}) =>
  useQuery({
    queryKey: QK.successStories(params),
    queryFn:  () => successStoryAPI.getAll(params),
    select:   (d) => d.data,
  })

// ── Notifications ─────────────────────────────────────────────────────────────
export const useNotifications = () =>
  useQuery({
    queryKey: QK.notifications(),
    queryFn:  () => notificationAPI.getAll(),
    select:   (d) => d.data,
    refetchInterval: 30_000,   // poll every 30 s
  })

// ── Pilot feedback ────────────────────────────────────────────────────────────
export const usePilotFeedbacks = () =>
  useQuery({
    queryKey: QK.pilotFeedbacks(),
    queryFn:  () => pilotFeedbackAPI.getPending(),
    select:   (d) => d.data.feedbacks,
  })

// ── Profile ───────────────────────────────────────────────────────────────────
export const useProfile = () =>
  useQuery({
    queryKey: QK.profile(),
    queryFn:  () => profileAPI.get(),
    select:   (d) => d.data.user,
  })

// ── Mutations ─────────────────────────────────────────────────────────────────
export const useSubmitChallenge = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: challengeAPI.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myChallenges'] })
      qc.invalidateQueries({ queryKey: QK.stats() })
    },
  })
}

export const useEndorseChallenge = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: challengeAPI.endorse,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['publicChallenges'] })
    },
  })
}

export const useDeleteChallenge = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: challengeAPI.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myChallenges'] })
      qc.invalidateQueries({ queryKey: QK.stats() })
    },
  })
}

export const useMarkNotificationRead = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: notificationAPI.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.notifications() }),
  })
}

export const useMarkAllNotificationsRead = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: notificationAPI.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.notifications() }),
  })
}

export const useDeleteNotification = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: notificationAPI.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.notifications() }),
  })
}

export const useSubmitPilotFeedback = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: pilotFeedbackAPI.submit,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.pilotFeedbacks() })
      qc.invalidateQueries({ queryKey: ['myChallenges'] })
    },
  })
}

export const useUpdateProfile = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: profileAPI.update,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.profile() }),
  })
}

export const useChangePassword = () =>
  useMutation({ mutationFn: profileAPI.changePassword })
