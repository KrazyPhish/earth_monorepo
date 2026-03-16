import { NavLink, Outlet, useNavigate } from "react-router"
import { createElement, useEffect, useState, type FC } from "react"
import { Layout, Menu } from "@arco-design/web-react"
import { menu } from "./menu"

const Sider = Layout.Sider
const Content = Layout.Content
const Item = Menu.Item
const SubMenu = Menu.SubMenu

const Nav: FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const nav = useNavigate()

  useEffect(() => {
    nav("/Test", { replace: true })
  }, [])

  return (
    <>
      <div className="w-full h-full">
        <Layout className={["w-full", "h-full"]}>
          <Sider
            className={["h-full"]}
            collapsed={collapsed}
            collapsible={true}
            defaultCollapsed={false}
            onCollapse={setCollapsed}
          >
            <Menu accordion={true} collapse={collapsed}>
              {menu.map(({ title, key, icon, children }) => {
                return (
                  <SubMenu
                    key={key}
                    title={
                      <>
                        {createElement(icon)}
                        {title}
                      </>
                    }
                  >
                    {children.map(({ title: cTitle, key: cKey, path }) => {
                      return (
                        <Item key={`${key}_${cKey}`}>
                          <NavLink to={`/${path}`}>{cTitle}</NavLink>
                        </Item>
                      )
                    })}
                  </SubMenu>
                )
              })}
            </Menu>
          </Sider>
          <Content className={["w-full", "h-full", "relative", "overflow-hidden"]}>
            <Outlet />
          </Content>
        </Layout>
      </div>
    </>
  )
}

export default Nav
