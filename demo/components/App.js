// @flow
import React from 'react'

import AuthButtons from './AuthButtons'
import Copy from './Copy'
import PersonalInfo from './PersonalInfo'
import Footer from './Footer'

const App = () => (
  <div>
    <nav>
      <h1>Solid Auth Client Demo</h1>
      <AuthButtons />
    </nav>
    <Copy />
    <PersonalInfo />
    <Footer />
  </div>
)

export default App
