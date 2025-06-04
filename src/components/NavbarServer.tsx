// components/NavbarServer.tsx
import { cookies } from 'next/headers'
import { getServerSideUser } from '@/lib/payload-utils'
import Navbar from './Navbar'

const NavbarServer = async () => {
  const nextCookies = cookies()
  const { user } = await getServerSideUser(nextCookies)

  return <Navbar user={user} />
}

export default NavbarServer
