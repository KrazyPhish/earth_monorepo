import type { FC } from "react"
import { RouterProvider, createBrowserRouter, type RouteObject } from "react-router-dom"
import { routes } from "./routes.js"

const router = createBrowserRouter(routes as RouteObject[])

const App: FC = () => {
  return <RouterProvider router={router} />
}

export default App
