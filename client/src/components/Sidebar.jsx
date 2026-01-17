import { Protect, useClerk, useUser } from '@clerk/clerk-react'
import { FileText, House, SquarePen , Eraser, Hash, Image, Scissors, Users, LogOut} from 'lucide-react'
import React from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [
    {to: '/ai', label: 'Dashboard', Icon: House},
    {to: '/ai/write-article', label: 'Write Article', Icon: SquarePen},
    {to: '/ai/blog-titles', label: 'Blog Titles', Icon: Hash},
    {to: '/ai/generate-images', label: 'Generate Images', Icon: Image},
    {to: '/ai/remove-background', label: 'Remove Background', Icon: Eraser},
    {to: '/ai/remove-object', label: 'Remove Object', Icon: Scissors},
    {to: '/ai/review-resume', label: 'Review Resume', Icon: FileText},
    {to: '/ai/community', label: 'Community', Icon: Users},
]
const Sidebar = ({ sidebar, setSidebar }) => {

    const {user, isLoaded} = useUser()
    const {signOut, openUserProfile} = useClerk()

    if (!isLoaded || !user) {
        return (
            <div className={`w-60 bg-white border-r border-gray-200 flex flex-col max-sm:absolute top-14 bottom-0 ${sidebar ? 'translate-x-0' : 'max-sm:-translate-x-full'} transition-all duration-300 ease-in-out`}>
                <div className='pt-7 w-full'>
                    <div className='text-center'>Loading...</div>
                </div>
            </div>
        )
    }

  return (
    <div className={`w-60 bg-white border-r border-gray-200 flex flex-col h-full max-sm:absolute top-14 bottom-0 ${sidebar ? 'translate-x-0' : 'max-sm:-translate-x-full'} transition-all duration-300 ease-in-out`}>
        {/* User profile section */}
        <div className='px-6 pt-6 w-full'>
            <img src={user.imageUrl} alt="User avatar" className='w-12 h-12 rounded-full mx-auto'/>
            <h1 className='mt-2 text-center text-sm font-medium'>{user.fullName}</h1>
        </div>

        {/* Navigation items */}
        <div className='px-6 mt-5 flex-1 text-sm text-gray-600 font-medium'>
            {navItems.map((item, index)=>(
                <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/ai'}
                    onClick={()=> setSidebar(false)}
                    className={({isActive})=> `px-3.5 py-2.5 flex items-center gap-3 rounded mb-1 ${isActive ? 'bg-gradient-to-r from-[#3C81F6] to-[#9234EA] text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                    {({isActive}) => (
                        <>
                            <item.Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-600'}`}/>
                            <span>{item.label}</span>
                        </>
                    )}
                </NavLink>
            ))}
        </div>

        {/* Bottom section with profile and premium plan */}
        <div className='w-full border-t border-gray-200 p-4 px-6 flex items-center justify-between mt-auto'>
            <div onClick={openUserProfile} className='flex gap-2 items-center cursor-pointer flex-1'>
                <img src={user.imageUrl} className='w-8 h-8 rounded-full' alt="" />
                <div className='flex-1 min-w-0'>
                    <h1 className='text-sm font-medium truncate'>{user.fullName}</h1>
                    <p className='text-xs text-gray-500'>
                        <Protect plan='premium' fallback="Free">Premium</Protect>
                        Plan
                    </p>
                </div>
            </div>
            <LogOut onClick={signOut} className='w-5 h-5 text-gray-400 hover:text-gray-700 transition cursor-pointer flex-shrink-0'/>
        </div>

    </div>
  )
}

export default Sidebar
