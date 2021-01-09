import { db } from 'firebaseService/initialize'
import React, { useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'Gallery/style.less'
import Title from 'antd/lib/typography/Title'
import { Divider, Modal, Spin, Tooltip } from 'antd'
import { DISABLED_COLOR } from 'constants/colors'

import { Link } from 'react-router-dom'
import { LeftOutlined, LoadingOutlined, RightOutlined } from '@ant-design/icons'
import { ApiPicture, Picture } from 'Gallery/types'
import { PICTURE_ID_PARAM } from 'Gallery/constants'
import { getMaposaicURLParamsFromPicture, showMaposaicLink } from 'Gallery/utils'
import link from 'assets/link.svg'

const displayedName = (picture: Picture): string => {
  return picture.pictureName ?? picture.placeName ?? 'no name'
}
let xDown: null | number = null
let yDown: null | number = null

const Gallery = () => {
  const [pictures, setPictures] = useState<Picture[]>([])
  const [displayedIndex, setDisplayedIndex] = useState<number | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isModalPictureLoaded, setIsModalPictureLoaded] = useState(false)

  const fetchData = async (initialPictureId: string | null) => {
    try {
      const snapshot = await db.collection('pictures').orderBy('timestamp', 'desc').get()
      const newPictures: Picture[] = []
      let pictureIndex: null | number = null
      snapshot.forEach((doc) => {
        const apiPicture = doc.data() as ApiPicture
        if (!apiPicture.downloadURL) {
          return
        }
        pictureIndex = pictureIndex !== null ? pictureIndex + 1 : 0
        if (initialPictureId && doc.id === initialPictureId) {
          setDisplayedIndex(pictureIndex)
          setIsModalVisible(true)
        }
        const pic = {
          id: doc.id,
          pictureName: apiPicture.pictureName,
          downloadURL: apiPicture.downloadURL,
          placeName: apiPicture.placeName,
          thumbnailDownloadURL: apiPicture.thumbnailDownloadURL,
          colorConfig: apiPicture.colorConfig,
          mapCenter: apiPicture.mapCenter
            ? new mapboxgl.LngLat(apiPicture.mapCenter[0], apiPicture.mapCenter[1])
            : undefined,
          mapZoom: apiPicture.mapZoom,
          mapboxStyle: apiPicture.mapboxStyle,
        }
        newPictures.push(pic)
      })
      setPictures(newPictures)
    } catch (e) {
      console.log(e)
    }
  }
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const initialPictureId = urlParams.get(PICTURE_ID_PARAM)
    fetchData(initialPictureId)
  }, [])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const pictureId = displayedIndex !== null ? pictures[displayedIndex]?.id : null
    if (!pictureId) {
      urlParams.delete(PICTURE_ID_PARAM)
    } else {
      urlParams.set(PICTURE_ID_PARAM, pictureId)
    }
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`)
  }, [displayedIndex, pictures])

  const incrementPictureIndex = (increment: -1 | 1) => {
    if (
      null === displayedIndex ||
      (increment < 0 && displayedIndex === 0) ||
      (increment > 0 && displayedIndex === pictures.length - 1)
    ) {
      return
    }
    setIsModalPictureLoaded(false)
    setDisplayedIndex(Math.min(Math.max(0, displayedIndex + increment), pictures.length - 1))
  }

  const onKeyDown = ({ key }: { key: string }) => {
    if (key === 'ArrowLeft') {
      incrementPictureIndex(-1)
    } else if (key === 'ArrowRight') {
      incrementPictureIndex(1)
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const onThumbnailClick = (index: number) => {
    if (index !== displayedIndex) {
      setIsModalPictureLoaded(false)
    }
    setDisplayedIndex(index)
    setIsModalVisible(true)
  }
  useEffect(() => {
    if (!isModalVisible) {
      return
    }
    document.addEventListener('touchstart', handleTouchStart, false)
    document.addEventListener('touchmove', handleTouchMove, false)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
    }
    // eslint-disable-next-line
  }, [isModalVisible, displayedIndex, pictures])

  function handleTouchStart(evt: TouchEvent) {
    const firstTouch = evt.touches[0]
    xDown = firstTouch.clientX
    yDown = firstTouch.clientY
  }

  function handleTouchMove(evt: TouchEvent) {
    if (!xDown || !yDown) {
      return
    }
    const xUp = evt.touches[0].clientX
    const yUp = evt.touches[0].clientY

    const xDiff = xDown - xUp
    const yDiff = yDown - yUp

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      if (xDiff > 0) {
        incrementPictureIndex(1)
      } else {
        incrementPictureIndex(-1)
      }
    } else {
      setIsModalVisible(false)
    }
    xDown = null
    yDown = null
  }

  const diveInMaposaics = (picture: Picture) => {
    const urlParams = getMaposaicURLParamsFromPicture(picture)
    if (!showMaposaicLink(picture) || !urlParams) {
      return
    }
    window.open(`${window.location.origin}/?${urlParams}`)
  }

  return (
    <div className="gallery">
      <Title level={2}>Gallery</Title>
      <Link to="/">from maposaic</Link>
      <Divider />
      <div className="gallery__pictures">
        {pictures.map((pic, index) => {
          return (
            <div onClick={() => onThumbnailClick(index)} className="gallery__picture" key={pic.id}>
              <img
                className="gallery__picture__image"
                alt={`pic-${displayedName(pic)}`}
                src={pic.thumbnailDownloadURL ?? pic.downloadURL}
              />
              <div className="gallery__picture__name">{displayedName(pic)}</div>
            </div>
          )
        })}
      </div>
      <Modal
        closable={false}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        bodyStyle={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        footer={null}
        style={{ maxWidth: '90vw', paddingBottom: '0', top: 0 }}
        width="fit-content"
      >
        {displayedIndex !== null && pictures.length > displayedIndex && displayedIndex >= 0 && (
          <div className="modal-content">
            <img
              className="modal-content__picture"
              alt={`pic-${displayedName(pictures[displayedIndex])}`}
              src={pictures[displayedIndex].downloadURL}
              onLoad={() => setIsModalPictureLoaded(true)}
            />
            <div className="modal-content__nav">
              {showMaposaicLink(pictures[displayedIndex]) ? (
                <Tooltip title="Explore maposaics from this picture">
                  <div className="modal-content__name" onClick={() => diveInMaposaics(pictures[displayedIndex])}>
                    <div>{isModalPictureLoaded ? displayedName(pictures[displayedIndex]) : '...'}</div>
                    <img alt="new-window" className="modal-content__name__icon" src={link} width="18px" />
                  </div>
                </Tooltip>
              ) : (
                <div>{isModalPictureLoaded ? displayedName(pictures[displayedIndex]) : '...'}</div>
              )}
            </div>
            {!isModalPictureLoaded && (
              <Spin
                className="modal-content__loader"
                indicator={<LoadingOutlined style={{ fontSize: '24px', color: 'white' }} />}
              />
            )}
          </div>
        )}
      </Modal>
      {isModalVisible && displayedIndex && displayedIndex > 0 && (
        <LeftOutlined
          className="gallery__arrow gallery__arrow--left"
          style={{ fontSize: '28px', color: DISABLED_COLOR }}
          onClick={() => incrementPictureIndex(-1)}
        />
      )}
      {isModalVisible && displayedIndex !== null && displayedIndex + 1 < pictures.length && (
        <RightOutlined
          className="gallery__arrow gallery__arrow--right"
          style={{ fontSize: '28px', color: DISABLED_COLOR }}
          onClick={() => incrementPictureIndex(1)}
        />
      )}
    </div>
  )
}

export default Gallery
