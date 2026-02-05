'use client'

export default function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(0,245,255,0.08)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(255,0,255,0.06)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(139,92,246,0.04)_0%,transparent_70%)]" />
      </div>

      {/* Grid */}
      <div
        className="absolute inset-0 animate-grid-move"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Floating orbs */}
      <div className="absolute -top-48 -left-24 w-96 h-96 bg-cyan-400 rounded-full opacity-10 blur-[80px] animate-float" />
      <div className="absolute -bottom-36 -right-12 w-72 h-72 bg-fuchsia-500 rounded-full opacity-[0.08] blur-[80px] animate-float" style={{ animationDelay: '-5s' }} />
      <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-purple-500 rounded-full opacity-10 blur-[80px] animate-float" style={{ animationDelay: '-10s' }} />
    </div>
  )
}
