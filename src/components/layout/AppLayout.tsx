import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <main className="pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
