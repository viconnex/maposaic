import React, { useEffect, useState } from 'react'

const GameOfLife = () => {
  const [gameResult, setGameResult] = useState<null | string>(null)
  const loadMapConverter = async () => {
    const wasm = await import('map-converter')
    if (wasm.greet) {
      wasm.greet()
    }
    // requestAnimationFrame(renderLoop)
  }

  //   console.log(mapConverter)
  return (
    <div>
      <pre>{gameResult ?? "le jeu n'est pas disponible"}</pre>
      <div>
        <button onClick={loadMapConverter}>Load</button>
      </div>
    </div>
  )
}

export default GameOfLife
