import { CompassOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import React, { useEffect, useRef, useState } from 'react'

import 'PlaceName/placeName.style.less'

const PlaceName = ({
  placeName,
  showPlaceNameTrigger,
}: {
  placeName: string | null
  showPlaceNameTrigger: boolean
}) => {
  const [isTextDisplayed, setIsTextDisplayed] = useState(false)
  const [isFirstRender, setIsFirstRender] = useState(true)

  useEffect(() => {
    if (showPlaceNameTrigger) {
      setIsFirstRender(false)
    }
  }, [isFirstRender, showPlaceNameTrigger])

  const showPlaceNameTriggerRef = useRef<undefined | boolean>()
  useEffect(() => {
    if (!showPlaceNameTriggerRef.current && showPlaceNameTrigger) {
      if (isTextDisplayed) {
        return
      }
      setIsTextDisplayed(true)
      setTimeout(() => setIsTextDisplayed(false), 3000)
    }

    showPlaceNameTriggerRef.current = showPlaceNameTrigger
    // eslint-disable-next-line
  }, [showPlaceNameTrigger])

  const onCompassClick = () => {
    setIsTextDisplayed(!isTextDisplayed)
  }

  const getAdditionalPlaceNameClass = () => {
    if (isTextDisplayed) {
      return 'place-name--displayed'
    }
    if (isFirstRender) {
      return 'place-name--hidden'
    }
    return 'place-name--hidden place-name--hidden--animation'
  }

  return (
    <div className={`place-name ${getAdditionalPlaceNameClass()}`} onClick={onCompassClick}>
      <Button className="show-place-name" shape="circle" onClick={onCompassClick} icon={<CompassOutlined />} />
      <div className="place-name__text">{placeName ?? '...'}</div>
    </div>
  )
}

export default PlaceName
