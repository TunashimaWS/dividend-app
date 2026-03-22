import { useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useBenefitStore } from '@/stores/benefitStore'
import { fetchCollection, addDocument, updateDocument, deleteDocument } from '@/lib/firestore'
import type { Benefit } from '@/types'

export function useBenefits() {
  const { user } = useAuthStore()
  const { benefits, setBenefits, addBenefit, updateBenefit, removeBenefit } = useBenefitStore()

  const loadBenefits = useCallback(async () => {
    if (!user) return
    const data = await fetchCollection<Benefit>(user.uid, 'benefits')
    setBenefits(data)
  }, [user, setBenefits])

  const createBenefit = useCallback(
    async (data: Omit<Benefit, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!user) return
      const id = await addDocument(user.uid, 'benefits', data)
      addBenefit({ ...data, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    },
    [user, addBenefit],
  )

  const editBenefit = useCallback(
    async (id: string, data: Partial<Benefit>) => {
      if (!user) return
      await updateDocument(user.uid, 'benefits', id, data)
      updateBenefit(id, data)
    },
    [user, updateBenefit],
  )

  const deleteBenefit = useCallback(
    async (id: string) => {
      if (!user) return
      await deleteDocument(user.uid, 'benefits', id)
      removeBenefit(id)
    },
    [user, removeBenefit],
  )

  return { benefits, loadBenefits, createBenefit, editBenefit, deleteBenefit }
}
