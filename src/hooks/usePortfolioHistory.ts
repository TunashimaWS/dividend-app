import { useCallback } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { setDocument } from '@/lib/firestore'
import { useAuthStore } from '@/stores/authStore'
import { showToast } from '@/stores/toastStore'
import type { PortfolioSnapshot } from '@/types'

export function usePortfolioHistory() {
  const { user } = useAuthStore()

  // 今日のスナップショットを保存（1日1回、上書き）
  const saveSnapshot = useCallback(async (totalValueJPY: number) => {
    if (!user || totalValueJPY <= 0) return
    const today = new Date().toISOString().split('T')[0]
    try {
      await setDocument<Omit<PortfolioSnapshot, 'updatedAt'>>(
        user.uid,
        'portfolioSnapshots',
        today,
        { date: today, totalValueJPY },
      )
    } catch {
      // スナップショット保存失敗はユーザーに通知しない（バックグラウンド処理）
    }
  }, [user])

  // 全スナップショットを日付昇順で取得
  const loadSnapshots = useCallback(async (): Promise<PortfolioSnapshot[]> => {
    if (!user) return []
    try {
      const snap = await getDocs(collection(db, 'users', user.uid, 'portfolioSnapshots'))
      return snap.docs
        .map(d => d.data() as PortfolioSnapshot)
        .sort((a, b) => a.date.localeCompare(b.date))
    } catch {
      showToast('資産推移データの読み込みに失敗しました')
      return []
    }
  }, [user])

  return { saveSnapshot, loadSnapshots }
}
