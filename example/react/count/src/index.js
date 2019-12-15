import React from 'react'
import ReactDOM from 'react-dom'
import { init } from '@prematch/core'
import App from './App'
import * as models from './models'

const store = init({
	models,
})

// Use react-redux's <Provider /> and pass it the store.
ReactDOM.render(
	<App />,
	document.getElementById('root')
)
