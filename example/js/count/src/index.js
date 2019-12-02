import { init } from '@prematch/core'
import createView from './View'

const count = {
	state: 0,
	reducers: {
		addOne: state => state + 1,
	},
}

const store = init({
	models: { count },
})

createView(store)
