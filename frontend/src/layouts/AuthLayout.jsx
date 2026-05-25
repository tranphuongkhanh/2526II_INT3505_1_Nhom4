import { Link, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { springs } from '../lib/animations';
import ThemeToggle from '../components/ui/ThemeToggle';

// ── Animated illustration ───────────────────────────────────
const SPARKLES = Array.from({ length: 14 }).map(() => ({
  x: 20 + Math.random() * 360,
  y: 8 + Math.random() * 130,
  r: 1 + Math.random() * 2,
  delay: Math.random() * 2.5,
  dur: 2 + Math.random() * 2.5,
}));

function Window({ x, y, w = 14, h = 14, delay = 0 }) {
  return (
    <motion.rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={2}
      fill="#F7C95F"
      initial={{ opacity: 0.25 }}
      animate={{ opacity: [0.25, 1, 0.25] }}
      transition={{
        duration: 2.8 + Math.random() * 1.5,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={{ willChange: 'opacity' }}
    />
  );
}

function FloatingBuilding({ x, y, dur, delay = 0, children }) {
  return (
    <motion.g
      transform={`translate(${x}, ${y})`}
      animate={{ y: [y, y - 8, y] }}
      transition={{
        duration: dur,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={{ willChange: 'transform' }}
    >
      {children}
    </motion.g>
  );
}

function AuthIllustration() {
  return (
    <svg
      viewBox="0 0 400 360"
      className="relative z-10 mt-6 w-full max-w-md self-center"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="roof-amber" x1="0" x2="1">
          <stop offset="0%" stopColor="#F0A500" />
          <stop offset="100%" stopColor="#F7C95F" />
        </linearGradient>
        <radialGradient id="sun-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#F7C95F" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#F7C95F" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* twinkling sparkles */}
      {SPARKLES.map((s, i) => (
        <motion.circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill="#ffffff"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.9, 0], scale: [0.5, 1, 0.5] }}
          transition={{
            duration: s.dur,
            delay: s.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ transformOrigin: `${s.x}px ${s.y}px`, willChange: 'opacity, transform' }}
        />
      ))}

      {/* glowing sun */}
      <motion.circle
        cx={340}
        cy={50}
        r={48}
        fill="url(#sun-glow)"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '340px 50px' }}
      />
      <motion.circle
        cx={340}
        cy={50}
        r={20}
        fill="#F7C95F"
        animate={{ opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* floating love bubble — heart over the middle building */}
      <motion.g
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ willChange: 'transform' }}
      >
        <ellipse cx={200} cy={68} rx={26} ry={18} fill="#ffffff" opacity={0.95} />
        <polygon points="190,82 208,82 198,93" fill="#ffffff" opacity={0.95} />
        <motion.path
          d="M 200 62 m -7 -2 c -3 -3 -8 -2 -8 3 c 0 5 8 9 8 9 c 0 0 8 -4 8 -9 c 0 -5 -5 -6 -8 -3 z"
          fill="#EF4444"
          animate={{ scale: [1, 1.18, 1] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '200px 68px' }}
        />
      </motion.g>

      {/* wifi signal arcs above the tall building */}
      {[16, 22, 28].map((r, i) => (
        <motion.path
          key={r}
          d={`M ${90 - r * 0.7} 158 A ${r} ${r} 0 0 1 ${90 + r * 0.7} 158`}
          fill="none"
          stroke="#F7C95F"
          strokeWidth={2}
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{
            duration: 2,
            delay: i * 0.25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* ── Buildings ── */}

      {/* Tall apartment (left) */}
      <FloatingBuilding x={55} y={195} dur={5}>
        {/* flat roof slab */}
        <rect x={-6} y={-10} width={82} height={10} rx={2} fill="#063D3D" />
        {/* antenna */}
        <line x1={35} y1={-10} x2={35} y2={-26} stroke="#ffffff" strokeOpacity={0.5} strokeWidth={1.5} />
        <motion.circle
          cx={35}
          cy={-28}
          r={2.5}
          fill="#F0A500"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* body */}
        <rect x={0} y={0} width={70} height={140} rx={3} fill="#0D6E6E" stroke="#ffffff" strokeOpacity={0.25} />
        {/* 4 rows × 2 cols windows */}
        {[0, 1, 2, 3].map((row) =>
          [0, 1].map((col) => (
            <Window
              key={`a-${row}-${col}`}
              x={10 + col * 30}
              y={14 + row * 32}
              w={20}
              h={20}
              delay={(row * 0.4 + col * 0.7) % 2.5}
            />
          ))
        )}
      </FloatingBuilding>

      {/* House with peaked roof (middle, biggest) */}
      <FloatingBuilding x={150} y={170} dur={4} delay={0.4}>
        {/* peaked roof */}
        <polygon points="-10,30 60,-10 130,30" fill="url(#roof-amber)" />
        {/* chimney */}
        <rect x={88} y={2} width={14} height={20} fill="#063D3D" />
        {/* smoke puffs */}
        {[0, 1, 2].map((i) => (
          <motion.circle
            key={`smoke-${i}`}
            cx={95}
            cy={2}
            r={3}
            fill="#ffffff"
            opacity={0.4}
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: -28, opacity: [0, 0.6, 0], x: [0, 4, 0] }}
            transition={{
              duration: 3,
              delay: i * 1,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        ))}
        {/* body */}
        <rect x={0} y={30} width={120} height={110} rx={3} fill="#14919B" stroke="#ffffff" strokeOpacity={0.3} />
        {/* door */}
        <rect x={50} y={85} width={20} height={55} rx={2} fill="#ffffff" opacity={0.95} />
        <circle cx={66} cy={114} r={1.6} fill="#063D3D" />
        {/* windows */}
        <Window x={15} y={50} w={22} h={22} delay={0.3} />
        <Window x={83} y={50} w={22} h={22} delay={0.9} />
        {/* welcome mat */}
        <rect x={47} y={140} width={26} height={3} fill="#F0A500" opacity={0.7} />
      </FloatingBuilding>

      {/* Small townhouse (right) */}
      <FloatingBuilding x={295} y={215} dur={6} delay={0.9}>
        <polygon points="-6,25 38,-5 82,25" fill="url(#roof-amber)" />
        <rect x={0} y={25} width={76} height={95} rx={3} fill="#ffffff" opacity={0.94} />
        <rect x={32} y={70} width={14} height={50} rx={1.5} fill="#0D6E6E" />
        <circle cx={43} cy={97} r={1.4} fill="#063D3D" />
        <Window x={10} y={40} w={14} h={14} delay={0.2} />
        <Window x={52} y={40} w={14} h={14} delay={1.1} />
      </FloatingBuilding>

      {/* dashed marching ground line */}
      <motion.line
        x1={0}
        y1={342}
        x2={400}
        y2={342}
        stroke="#ffffff"
        strokeOpacity={0.25}
        strokeWidth={1.5}
        strokeDasharray="6 8"
        animate={{ strokeDashoffset: [0, -14] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
      />
    </svg>
  );
}

// ── Layout ──────────────────────────────────────────────────
function IllustrationPanel() {
  return (
    <div className="relative hidden lg:flex w-[45%] flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-700 to-primary-500 p-12 text-white">
      <div className="relative z-10">
        <Link to="/" className="font-display text-2xl font-bold">
          RoomHub
        </Link>
        <p className="mt-12 max-w-md font-display text-4xl font-bold leading-tight">
          Tìm phòng trọ minh bạch — ở yên tâm.
        </p>
        <p className="mt-4 max-w-md text-primary-100 text-base leading-relaxed">
          Hàng ngàn phòng trọ chất lượng, giá cả công khai, chủ trọ uy tín đang chờ bạn.
        </p>
      </div>

      <AuthIllustration />

      <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute -top-10 -right-10 h-56 w-56 rounded-full bg-accent-500/20 blur-3xl" />

      <p className="relative z-10 text-xs text-primary-100/70">
        © {new Date().getFullYear()} RoomHub
      </p>
    </div>
  );
}

export function AuthLayout() {
  return (
    <div className="min-h-screen flex bg-base">
      <IllustrationPanel />

      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 lg:px-10">
          <Link to="/" className="font-display text-xl font-bold text-primary-500 lg:hidden">
            RoomHub
          </Link>
          <span className="hidden lg:block" />
          <ThemeToggle />
        </header>

        <motion.main
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.smooth}
          className="flex-1 flex items-center justify-center px-6 py-8"
        >
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </motion.main>
      </div>
    </div>
  );
}

export default AuthLayout;
