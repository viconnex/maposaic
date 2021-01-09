import { Universe } from 'map-converter'
import React, { useEffect, useState } from 'react'

const GameOfLife = () => {
  const [gameResult, setGameResult] = useState<null | string>(null)
  const loadMapConverter = () => {
    const universe = Universe.new()

    const renderLoop = () => {
      setGameResult(universe.render())
      universe.tick()

      requestAnimationFrame(renderLoop)
    }

    requestAnimationFrame(renderLoop)
  }
  useEffect(() => {
    loadMapConverter()
  }, [])

  //   console.log(mapConverter)
  return (
    <div>
      <pre>{gameResult ?? "le jeu n'est pas disponible"}</pre>
    </div>
  )
}

export default GameOfLife
