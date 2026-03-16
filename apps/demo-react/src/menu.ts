import { parents, routes, type RootMenu } from "./routes"

type ChildMenu = {
  title: string
  key: string
  path: string
}

const menuMap = new Map<string, Omit<RootMenu, "title"> & { children: ChildMenu[] }>()

for (const entry in parents) {
  const { title, icon, key } = parents[entry]
  menuMap.set(title, { key, icon, children: [] })
}

for (const { parentName, navName, keyName, path } of routes[0].children!) {
  if (!parentName) continue
  const rootMenu = menuMap.get(parentName!)!
  rootMenu.children.push({
    title: navName!,
    key: keyName!,
    path: path!,
  })
}

const menu: (RootMenu & { children: ChildMenu[] })[] = []

for (const [title, value] of menuMap) {
  menu.push({
    title,
    icon: value.icon,
    key: value.key,
    children: value.children,
  })
}

export { menu }
