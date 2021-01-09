import { db, firebaseStorage } from 'firebaseService/initialize'
import firebase from 'firebase/app'
import { v4 as uuidv4 } from 'uuid'

const PICTURE_COLLECTION_ID = 'pictures'

export const PICTURE_BASE_PATH = 'maposaic_pictures'
export const THUMBNAILS_PATH = 'thumbnails'

export const getPicturePathFromFileId = (id: string) => {
  return `${PICTURE_BASE_PATH}/${id}`
}
export const getThumbnailPathFromFileId = (id: string) => {
  return `${PICTURE_BASE_PATH}/${THUMBNAILS_PATH}/${id}_250x250`
}

export const uploadBlob = ({ blob }: { blob: Blob }) => {
  const uuid = uuidv4()
  const filePath = getPicturePathFromFileId(uuid)
  const storageRef = firebaseStorage.ref(filePath)
  const uploadTask = storageRef.put(blob)

  return { fileId: uuid, uploadTask }
}

export const postOrUpdatePicturesDocument = async ({
  documentId,
  payload,
  anonymousUid,
}: {
  documentId: string | null
  payload: Record<string, any>
  anonymousUid: string | null
}) => {
  // undefined value in payload is not accepted by firestore
  const sanethizedPayload = sanethizePayload(payload)

  if (documentId) {
    const docRef = db.collection(PICTURE_COLLECTION_ID).doc(documentId)
    docRef.update(sanethizedPayload)

    return documentId
  }

  try {
    const response = await db
      .collection(PICTURE_COLLECTION_ID)
      .add({ ...sanethizedPayload, anonymousUid, timestamp: firebase.firestore.FieldValue.serverTimestamp() })
    return response.id
  } catch (e) {
    console.log(e)
    return null
  }
}

const sanethizePayload = (payload: any) => {
  const res: any = {}
  Object.keys(payload).forEach((key) => {
    const value = payload[key]
    if (value !== undefined) {
      res[key] = value
    }
  })

  return res
}
