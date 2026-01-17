import React, { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { SignIn, useUser } from '@clerk/clerk-react'
import { assets } from '../assets/assets'

const Layout = () => {
  const [sidebar, setSidebar] = useState(false)
  const {user} = useUser()
  const navigate = useNavigate()
  return user ? (
    <div className='flex flex-col items-start justify-start h-screen'>
      <nav className='w-full px-8 min-h-14 flex items-center justify-between border-b border-gray-200'>
        <img className='cursor-pointer w-32 sm:w-44' src={assets.logo} alt="" onClick={()=>navigate('/')}/>
        <div className='sm:hidden'>
          {
            sidebar ? <X onClick={()=> setSidebar(false)} className='w-6 h-6 text-gray-600'/>
            : <Menu onClick={()=> setSidebar(true)} className='w-6 h-6 text-gray-600'/>
          }
        </div>
      </nav>

      <div className='flex-1 w-full flex h-screen sm:h-[calc(100vh-56px)]'>
        <Sidebar sidebar={sidebar} setSidebar={setSidebar}/>
        <div className='flex-1 bg-[#F4F7FB]'>
          <Outlet />
        </div>
      </div>
    </div>
  ) : (
    <div className='flex items-center justify-center h-screen'>
       <SignIn />
    </div>
  )
}

export default Layout
