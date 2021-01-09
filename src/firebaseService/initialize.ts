import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/analytics'
import 'firebase/storage'
import 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyAuounsVwHYGk-hZ_0EBsLi0aQLhYepYJk',
  authDomain: 'maposaic-99785.firebaseapp.com',
  databaseURL: 'https://maposaic-99785.firebaseio.com',
  projectId: 'maposaic-99785',
  storageBucket: 'maposaic-99785.appspot.com',
  messagingSenderId: '702337108747',
  appId: '1:702337108747:web:488c6903c51e09917ff00e',
  measurementId: 'G-GCGS9CE9RL',
}

firebase.initializeApp(firebaseConfig)
firebase.analytics()

export const db = firebase.firestore()
export const firebaseStorage = firebase.storage()
export const firebaseAuth = firebase.auth()
