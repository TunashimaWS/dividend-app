import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from './firebase'

export const userCollection = (userId: string, collectionName: string) =>
  collection(db, 'users', userId, collectionName)

export const userDoc = (userId: string, collectionName: string, docId: string) =>
  doc(db, 'users', userId, collectionName, docId)

export async function fetchCollection<T>(userId: string, name: string): Promise<T[]> {
  const q = query(userCollection(userId, name), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as T))
}

export async function addDocument<T extends object>(
  userId: string,
  collectionName: string,
  data: T,
): Promise<string> {
  const now = new Date().toISOString()
  const ref = await addDoc(userCollection(userId, collectionName), {
    ...data,
    createdAt: now,
    updatedAt: now,
  })
  return ref.id
}

export async function updateDocument<T extends object>(
  userId: string,
  collectionName: string,
  docId: string,
  data: Partial<T>,
): Promise<void> {
  await updateDoc(userDoc(userId, collectionName, docId), {
    ...data,
    updatedAt: new Date().toISOString(),
  })
}

// 指定IDのドキュメントを上書き保存（スナップショットのupsertに使用）
export async function setDocument<T extends object>(
  userId: string,
  collectionName: string,
  docId: string,
  data: T,
): Promise<void> {
  await setDoc(
    doc(db, 'users', userId, collectionName, docId),
    { ...data, updatedAt: new Date().toISOString() },
    { merge: true },
  )
}

export async function deleteDocument(
  userId: string,
  collectionName: string,
  docId: string,
): Promise<void> {
  await deleteDoc(userDoc(userId, collectionName, docId))
}
