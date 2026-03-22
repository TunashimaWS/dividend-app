import { NavLink } from 'react-router-dom'
import { LayoutDashboard, TrendingUp, DollarSign, Gift, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'ホーム' },
  { to: '/portfolio', icon: TrendingUp, label: '株' },
  { to: '/dividends', icon: DollarSign, label: '配当' },
  { to: '/benefits', icon: Gift, label: '優待' },
  { to: '/settings', icon: Settings, label: '設定' },
] as const

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t z-50 pb-safe">
      <div className="flex">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs min-h-[56px] transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            <Icon size={22} strokeWidth={1.75} />
            <span className="font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
