interface Props {
  title: string
  action?: React.ReactNode
}

export default function PageHeader({ title, action }: Props) {
  return (
    <header className="sticky top-0 bg-background/95 backdrop-blur border-b z-40 px-4 py-3 flex items-center justify-between">
      <h1 className="text-lg font-semibold">{title}</h1>
      {action && <div>{action}</div>}
    </header>
  )
}
