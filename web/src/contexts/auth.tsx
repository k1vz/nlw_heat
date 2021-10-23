import { createContext, ReactNode, useEffect, useState } from 'react'
import { api } from '../services/api'

type User = {
	id: string
	avatar_url: string
	login: string
	name: string
}

type AuthContextData = {
	user: User | null
	signInUrl: string
	signOut: () => void
}

type AuthResponse = {
	token: string
	user: {
		id: string
		avatar_url: string
		login: string
		name: string
	}
}

type AuthProvider = {
	children: ReactNode
}

export const AuthContext = createContext({} as AuthContextData)

export function AuthProvider(props: AuthProvider) {
	const [user, setUser] = useState<User | null>(null)

	const signInUrl = `https://github.com/login/oauth/authorize?scope=user&client_id=0ccf59c6c4b1ce0afcb6`

	async function signIn(code: string) {
		const response = await api.post<AuthResponse>('authenticate', {
			code: code
		})

		const { token, user } = response.data
		localStorage.setItem('@nlw_heat:token', token)

		api.defaults.headers.common.authorization = `Bearer ${token}`

		setUser(user)
	}

	function signOut() {
		setUser(null)
		localStorage.removeItem('@nlw_heat:token')
	}

	useEffect(() => {
		const url = window.location.href
		const hasGithubCode = url.includes('?code=')

		if (hasGithubCode) {
			const [urlWithoutCode, githubCode] = url.split('?code=')

			window.history.pushState({}, '', urlWithoutCode)
			signIn(githubCode)
		}

	}, [])

	useEffect(() => {
		const token = localStorage.getItem('@nlw_heat:token')

		if (token) {
			api.defaults.headers.common.authorization = `Bearer ${token}`

			api.get<User>('profile').then(response => {
				setUser(response.data)
			})
		}
	}, [])



	return (
		<AuthContext.Provider value={{ signInUrl, user, signOut }}>
			{props.children}
		</AuthContext.Provider>
	)
}