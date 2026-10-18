import { useState } from 'react'

import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <button className='flex-1 bg-amber-300 rounded hover:bg-amber-100 m-4 p-2 cursor-pointer'>hey</button>
  )
}

export default App
