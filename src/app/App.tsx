import React, { useState, useEffect } from 'react';
import {
  Fish,
  ShoppingCart,
  Plus,
  Minus,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Package,
  Utensils,
  LogOut,
  X,
  User,
  Phone,
  MessageSquare,
  Store,
  Check,
  ChefHat,
  Flame,
  Star,
  Bell,
  TrendingUp,
  AlertCircle,
  Eye,
  EyeOff,
  Droplets,
  Leaf,      // for 'Salad' on line 202
  AlertTriangle // for 'Pepper' on line 204 (or use 'Zap', 'Flame', etc.)
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

// ─── Types ────────────────────────────────────────────────────────────────────
type Category = 'Chips' | 'Fish & Chips' | 'Fish Only';
type OrderStatus = 'Order Received' | 'Being Prepared' | 'Ready for Collection' | 'Collected' | 'Cancelled';
type SauceFlavor = 'Plain' | 'Tomato Sauce' | 'Chilli Sauce' | 'Vinegar' | 'All of the above';

interface MenuItem {
  id: string;
  name: string;
  category: Category;
  price: number;
  description: string;
  image: string;
  available: boolean;
  popular?: boolean;
}

interface CartItem extends MenuItem {
  cartId: string;
  quantity: number;
  notes: string;
  sauce: SauceFlavor;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  notes?: string;
}

// ─── Sauce Options ─────────────────────────────────────────────────────────────
const SAUCE_OPTIONS: { value: SauceFlavor; emoji: string; desc: string }[] = [
  { value: 'Plain',           emoji: '🤍', desc: 'No sauce, straight up' },
  { value: 'Tomato Sauce',    emoji: '🍅', desc: 'Classic All Gold vibes' },
  { value: 'Chilli Sauce',    emoji: '🌶️', desc: 'Turn up the heat' },
  { value: 'Vinegar',         emoji: '💧', desc: 'The OG way' },
  { value: 'All of the above',emoji: '🔥', desc: 'Eish, why not all?' },
];

// ─── Menu Data ────────────────────────────────────────────────────────────────
const INITIAL_MENU: MenuItem[] = [
  {
    id: 'c1',
    name: 'Small Chips',
    category: 'Chips',
    price: 20,
    description: 'Crispy & golden, perfect for one',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=800&auto=format&fit=crop',
    available: true,
  },
  {
    id: 'c2',
    name: 'Medium Chips',
    category: 'Chips',
    price: 30,
    description: 'The sweet spot — not too much, not too little',
    image: 'https://images.unsplash.com/photo-1576107232684-1279f5f61b8a?q=80&w=800&auto=format&fit=crop',
    available: true,
    popular: true,
  },
  {
    id: 'c3',
    name: 'Large Chips',
    category: 'Chips',
    price: 60,
    description: 'Enough for the whole squad',
    image: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?q=80&w=800&auto=format&fit=crop',
    available: true,
  },
  {
    id: 'fc1',
    name: '2 Russians & Chips',
    category: 'Fish & Chips',
    price: 45,
    description: '2 juicy russians with a big scoop of chips',
    image: 'https://images.unsplash.com/photo-1432139509613-5c4255815697?q=80&w=800&auto=format&fit=crop',
    available: true,
    popular: true,
  },
  {
    id: 'fc2',
    name: '1 Russian & Chips',
    category: 'Fish & Chips',
    price: 40,
    description: '1 thick russian sausage with chips',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&auto=format&fit=crop',
    available: true,
  },
  {
    id: 'fc3',
    name: '1 Piece Fish & Chips',
    category: 'Fish & Chips',
    price: 70,
    description: '1 piece of crispy battered fish with chips',
    image: 'https://images.unsplash.com/photo-1553648901-e98b5f41a3f3?q=80&w=800&auto=format&fit=crop',
    available: true,
  },
  {
    id: 'fc4',
    name: '2 Pieces Fish & Chips',
    category: 'Fish & Chips',
    price: 90,
    description: '2 pieces of golden battered fish with chips',
    image: 'https://images.unsplash.com/photo-1619158658883-b31f428cbb5e?q=80&w=800&auto=format&fit=crop',
    available: true,
    popular: true,
  },
  {
    id: 'fc5',
    name: '3 Pieces Fish & Chips',
    category: 'Fish & Chips',
    price: 100,
    description: '3 pieces of fish with chips — the family bundle',
    image: 'https://images.unsplash.com/photo-1587565383786-68efc8eb1d32?q=80&w=800&auto=format&fit=crop',
    available: true,
  },
  {
    id: 'fo1',
    name: 'Fish Only (3 Pieces)',
    category: 'Fish Only',
    price: 80,
    description: '3 pieces of battered fish, no chips',
    image: 'https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?q=80&w=800&auto=format&fit=crop',
    available: true,
  },
];

// ─── Animation Variants ───────────────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.18 } },
};

// ─── Category Config ──────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<Category, { color: string; bg: string; icon: React.ReactNode; accent: string; border: string }> = {
  'Chips': {
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    accent: 'bg-amber-500',
    border: 'border-amber-200',
    icon: <Flame size={14} />,
  },
  'Fish & Chips': {
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    accent: 'bg-orange-500',
    border: 'border-orange-200',
    icon: <Fish size={14} />,
  },
  'Fish Only': {
    color: 'text-sky-700',
    bg: 'bg-sky-50',
    accent: 'bg-sky-500',
    border: 'border-sky-200',
    icon: <Fish size={14} />,
  },
};

// ─── Sauce Icon ───────────────────────────────────────────────────────────────
const SauceIcon = ({ flavor }: { flavor: SauceFlavor }) => {
  const map: Record<SauceFlavor, React.ReactNode> = {
    'Plain': <Leaf size={12} />,
    'Tomato Sauce': <Droplets size={12} className="text-red-500" />,
    'Chilli Sauce': <AlertTriangle size={12} className="text-red-600" />,
    'Vinegar': <Droplets size={12} className="text-blue-400" />,
    'All of the above': <Flame size={12} className="text-orange-500" />,
  };
  return <>{map[flavor]}</>;
};

// ─── Shared Button ────────────────────────────────────────────────────────────
const Btn = ({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button' }: any) => {
  const base = 'inline-flex items-center justify-center gap-2 font-bold transition-all active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none select-none';
  const variants: Record<string, string> = {
    primary: 'bg-orange-500 text-white hover:bg-orange-600 rounded-2xl px-6 py-4 shadow-lg shadow-orange-100',
    secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-2xl px-6 py-4',
    success: 'bg-emerald-500 text-white hover:bg-emerald-600 rounded-2xl px-6 py-4 shadow-lg shadow-emerald-100',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 rounded-2xl px-6 py-4',
    ghost: 'text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-xl px-4 py-2',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: OrderStatus }) => {
  const map: Record<OrderStatus, string> = {
    'Order Received': 'bg-red-50 text-red-600 ring-1 ring-red-200',
    'Being Prepared': 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    'Ready for Collection': 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    'Collected': 'bg-gray-100 text-gray-500',
    'Cancelled': 'bg-gray-100 text-gray-400 line-through',
  };
  return (
    <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${map[status]}`}>
      {status}
    </span>
  );
};

// ─── Sauce Picker Component ────────────────────────────────────────────────────
const SaucePicker = ({ value, onChange }: { value: SauceFlavor; onChange: (v: SauceFlavor) => void }) => (
  <div className="bg-gray-50 p-5 rounded-[28px]">
    <p className="font-black text-sm text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
      <Droplets size={14} className="text-orange-400" /> Choose your sauce
    </p>
    <div className="grid grid-cols-1 gap-2">
      {SAUCE_OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all font-medium text-sm border-2 ${
            value === opt.value
              ? 'border-orange-400 bg-orange-50 text-orange-700'
              : 'border-transparent bg-white text-gray-600 hover:border-gray-200'
          }`}
        >
          <span className="text-lg w-6 text-center">{opt.emoji}</span>
          <div>
            <p className={`font-black text-sm ${value === opt.value ? 'text-orange-700' : 'text-gray-800'}`}>{opt.value}</p>
            <p className={`text-xs font-medium ${value === opt.value ? 'text-orange-500' : 'text-gray-400'}`}>{opt.desc}</p>
          </div>
          {value === opt.value && (
            <div className="ml-auto w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
              <Check size={12} className="text-white" />
            </div>
          )}
        </button>
      ))}
    </div>
  </div>
);

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  type ViewType = 'landing' | 'menu' | 'customize' | 'cart' | 'checkout' | 'confirmation' | 'track' | 'admin-login' | 'admin-dashboard';
  const [view, setView] = useState<ViewType>('landing');
  const [menu, setMenu] = useState<MenuItem[]>(INITIAL_MENU);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | Category>('all');

  useEffect(() => {
    const saved = localStorage.getItem('compas_orders_v3');
    if (saved) setOrders(JSON.parse(saved));
  }, []);

  const saveOrders = (o: Order[]) => {
    setOrders(o);
    localStorage.setItem('compas_orders_v3', JSON.stringify(o));
  };

  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const addToCart = (item: CartItem) => {
    setCart(prev => [...prev, { ...item, cartId: Math.random().toString(36).slice(2, 9) }]);
    setView('menu');
    toast.success(`${item.name} added to your order! 🔥`, { duration: 1800 });
  };

  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(c => c.cartId !== cartId));
    toast.error('Removed from order', { duration: 1500 });
  };

  const placeOrder = (data: { name: string; phone: string; notes: string }) => {
    const newOrder: Order = {
      id: Math.random().toString(36).slice(2),
      orderNumber: `CP-${Math.floor(100 + Math.random() * 899)}`,
      customerName: data.name,
      phone: data.phone,
      items: cart,
      total: cartTotal,
      status: 'Order Received',
      createdAt: new Date().toISOString(),
      notes: data.notes,
    };
    saveOrders([newOrder, ...orders]);
    setActiveOrder(newOrder);
    setCart([]);
    setView('confirmation');
  };

  const updateStatus = (orderId: string, status: OrderStatus) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, status } : o);
    saveOrders(updated);
    if (activeOrder?.id === orderId) setActiveOrder(prev => prev ? { ...prev, status } : null);
    toast.success(`Updated to: ${status}`);
  };

  // ── Landing ──────────────────────────────────────────────────────────────────
  const LandingPage = () => (
    <motion.div {...pageVariants} className="min-h-screen flex flex-col bg-white overflow-hidden">
      {/* Hero — full bleed with warm texture feel */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 pt-14 pb-10 text-center overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-28 -right-28 w-80 h-80 rounded-full bg-orange-50 opacity-70" />
          <div className="absolute top-1/2 -left-20 w-48 h-48 rounded-full bg-amber-50 opacity-80" />
          <div className="absolute -bottom-16 right-10 w-56 h-56 rounded-full bg-red-50 opacity-40" />
        </div>

        {/* Logo mark */}
        <motion.div
          initial={{ scale: 0.4, rotate: -20, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 18, delay: 0.1 }}
          className="relative mb-7"
        >
          <div className="w-24 h-24 rounded-[32px] overflow-hidden shadow-2xl shadow-orange-200 rotate-3">
            <img 
              src="/logo.png" 
              alt="Compas Fisheries Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: 'spring' }}
            className="absolute -bottom-2 -right-2 w-9 h-9 bg-amber-400 rounded-2xl flex items-center justify-center shadow-lg rotate-12"
          >
            <Flame className="text-white" size={18} />
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-none mb-1">
            Compas<br />
            <span className="text-orange-500">Fisheries</span>
          </h1>
          <p className="text-gray-500 font-semibold mt-3 text-base">Hot & fresh from the fryer.</p>
          <p className="text-gray-400 font-medium text-sm mt-1">Order now, skip the queue 🎯</p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="flex gap-5 mt-8 mb-10"
        >
          {[
            { val: '9', label: 'Items on menu' },
            { val: '~15min', label: 'Ready time' },
            { val: 'R20', label: 'Starts from' },
          ].map(s => (
            <div key={s.label} className="text-center px-3">
              <p className="text-2xl font-black text-gray-900">{s.val}</p>
              <p className="text-[11px] font-bold text-gray-400 mt-0.5 uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Sauce teaser — kasi flavour */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.46 }}
          className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 mb-8 flex items-center gap-2 text-sm font-bold text-amber-700"
        >
          <span className="text-base">🍅</span>
          Pick your sauce: tomato, chilli, vinegar or all of the above — eish!
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.54 }}
          className="w-full max-w-xs space-y-3"
        >
          <Btn onClick={() => setView('menu')} className="w-full text-base py-5">
            <ShoppingCart size={20} /> Order Now
          </Btn>
          <button
            onClick={() => setView('track')}
            className="w-full py-3.5 text-gray-400 font-bold hover:text-orange-500 transition-colors text-sm"
          >
            Track my order →
          </button>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-7 flex justify-center">
        <button
          onClick={() => setView('admin-login')}
          className="text-[11px] font-bold text-gray-300 hover:text-orange-400 uppercase tracking-widest transition-colors"
        >
          Staff Portal
        </button>
      </div>
    </motion.div>
  );

  // ── Menu ─────────────────────────────────────────────────────────────────────
  const MenuPage = () => {
    const categories: Array<'all' | Category> = ['all', 'Chips', 'Fish & Chips', 'Fish Only'];
    const filtered = activeCategory === 'all' ? menu : menu.filter(m => m.category === activeCategory);

    return (
      <motion.div {...pageVariants} className="min-h-screen bg-gray-50 pb-36">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setView('landing')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <ArrowLeft size={20} className="text-gray-500" />
              </button>
              <div>
                <h1 className="font-black text-lg tracking-tight leading-none">What's cooking 🔥</h1>
                <p className="text-[11px] text-gray-400 font-medium mt-0.5">Compas Fisheries</p>
              </div>
            </div>
            <button
              onClick={() => setView('cart')}
              className="relative flex items-center gap-1.5 bg-orange-500 text-white px-3.5 py-2 rounded-2xl font-bold text-sm hover:bg-orange-600 transition-colors shadow-md shadow-orange-100 active:scale-95"
            >
              <ShoppingCart size={16} />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="bg-white text-orange-600 text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${activeCategory === cat
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
              >
                {cat === 'all' ? 'All Items' : cat}
              </button>
            ))}
          </div>
        </header>

        <main className="px-4 pt-4 space-y-7">
          {categories.filter(c => c !== 'all').map(cat => {
            const items = filtered.filter(m => m.category === cat);
            if (items.length === 0) return null;
            const cfg = CATEGORY_CONFIG[cat as Category];
            return (
              <section key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-1 h-6 ${cfg.accent} rounded-full`} />
                  <h2 className="text-lg font-black text-gray-900">{cat}</h2>
                  <span className={`ml-auto text-[11px] font-bold px-2.5 py-1 rounded-lg ${cfg.bg} ${cfg.color}`}>
                    {items.length} item{items.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {items.map(item => <MenuCard key={item.id} item={item} />)}
                </div>
              </section>
            );
          })}
        </main>

        {/* Floating cart bar */}
        {cartCount > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-5 left-4 right-4 z-30"
          >
            <button
              onClick={() => setView('cart')}
              className="w-full bg-gray-900 text-white py-4 px-5 rounded-[22px] flex items-center justify-between shadow-2xl active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="bg-orange-500 rounded-xl w-7 h-7 flex items-center justify-center font-black text-sm">
                  {cartCount}
                </div>
                <span className="font-bold text-sm">View Order</span>
              </div>
              <span className="font-black text-orange-400 text-lg">R{cartTotal}</span>
            </button>
          </motion.div>
        )}
      </motion.div>
    );
  };

  const MenuCard = ({ item }: { item: MenuItem }) => (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => { if (!item.available) return; setSelectedItem(item); setView('customize'); }}
      className={`bg-white rounded-[20px] overflow-hidden border border-gray-100 flex shadow-sm transition-shadow hover:shadow-md ${!item.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {/* Image - square left panel */}
      <div className="relative w-24 h-24 shrink-0 bg-gray-100">
        <ImageWithFallback src={item.image} alt={item.name} className="w-full h-full object-cover" />
        {!item.available && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-[10px] font-black text-gray-500 uppercase">Sold out</span>
          </div>
        )}
        {item.popular && item.available && (
          <div className="absolute top-1.5 left-1.5 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
            <Star size={7} fill="white" /> 🔥
          </div>
        )}
      </div>
      {/* Info */}
      <div className="flex-1 px-3.5 py-3 flex flex-col justify-between">
        <div>
          <h3 className="font-black text-sm text-gray-900 leading-snug">{item.name}</h3>
          <p className="text-[11px] font-medium text-gray-400 mt-0.5 leading-relaxed">{item.description}</p>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-orange-600 font-black text-lg">R{item.price}</span>
          {item.available && (
            <div className="bg-orange-500 text-white w-7 h-7 rounded-xl flex items-center justify-center font-black text-base shadow-sm">
              +
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  // ── Customize ────────────────────────────────────────────────────────────────
  const CustomizePage = () => {
    const [qty, setQty] = useState(1);
    const [notes, setNotes] = useState('');
    const [sauce, setSauce] = useState<SauceFlavor>('Plain');
    if (!selectedItem) return null;
    const cfg = CATEGORY_CONFIG[selectedItem.category];

    return (
      <motion.div {...pageVariants} className="min-h-screen bg-white">
        <header className="px-4 pt-4 pb-2 flex items-center gap-3">
          <button onClick={() => setView('menu')} className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="font-black text-lg">Customise Your Order</h2>
        </header>

        <div className="px-4 pb-40">
          {/* Food image */}
          <div className="rounded-[28px] overflow-hidden h-52 mt-3 mb-5 relative bg-gray-100">
            <ImageWithFallback src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" />
            {selectedItem.popular && (
              <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-black px-3 py-1 rounded-xl flex items-center gap-1">
                <Star size={10} fill="white" /> Popular pick
              </div>
            )}
          </div>

          {/* Item info */}
          <div className="flex items-start justify-between mb-1">
            <h1 className="text-2xl font-black text-gray-900 leading-tight flex-1 pr-4">{selectedItem.name}</h1>
            <div className="text-right">
              <p className="text-2xl font-black text-orange-500">R{selectedItem.price * qty}</p>
              {qty > 1 && <p className="text-[11px] text-gray-400 font-bold">R{selectedItem.price} each</p>}
            </div>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${cfg.bg} ${cfg.color} mb-1.5`}>
            {cfg.icon} {selectedItem.category}
          </div>
          <p className="text-sm text-gray-400 font-medium mb-6">{selectedItem.description}</p>

          {/* Quantity */}
          <div className="bg-gray-50 p-5 rounded-[24px] mb-5">
            <p className="font-black text-xs text-gray-500 uppercase tracking-wider mb-4">How many?</p>
            <div className="flex items-center justify-center gap-7">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-orange-500 hover:border-orange-300 transition-all active:scale-90 shadow-sm"
              >
                <Minus size={20} />
              </button>
              <span className="text-4xl font-black w-10 text-center">{qty}</span>
              <button
                onClick={() => setQty(q => q + 1)}
                className="w-12 h-12 rounded-full bg-orange-500 shadow-lg shadow-orange-200 flex items-center justify-center text-white active:scale-90 transition-transform"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Sauce picker */}
          <div className="mb-5">
            <SaucePicker value={sauce} onChange={setSauce} />
          </div>

          {/* Notes */}
          <div>
            <p className="font-black text-xs text-gray-500 uppercase tracking-wider mb-2.5 ml-1">Special Requests</p>
            <div className="relative">
              <MessageSquare className="absolute left-4 top-4 text-gray-300" size={18} />
              <textarea
                placeholder="Extra crispy, no salt, well done..."
                className="w-full pl-11 pr-4 py-3.5 rounded-[20px] bg-gray-50 border-2 border-transparent focus:border-orange-400 focus:bg-white outline-none transition-all min-h-[100px] font-medium text-gray-700 resize-none text-sm"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Sticky add button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 p-4 z-30">
          <div className="flex items-center gap-3 max-w-lg mx-auto">
            <div className="shrink-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Total</p>
              <p className="text-xl font-black text-orange-500">R{selectedItem.price * qty}</p>
            </div>
            <Btn
              onClick={() => addToCart({ ...selectedItem, quantity: qty, notes, sauce, cartId: '' })}
              className="flex-1 text-base py-4"
            >
              Add to Order
            </Btn>
          </div>
        </div>
      </motion.div>
    );
  };

  // ── Cart ─────────────────────────────────────────────────────────────────────
  const CartPage = () => (
    <motion.div {...pageVariants} className="min-h-screen bg-gray-50 pb-36">
      <header className="sticky top-0 z-10 bg-white px-4 py-3.5 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => setView('menu')} className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-black text-lg flex-1">Your Order</h2>
        {cart.length > 0 && (
          <span className="text-xs font-black text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl">
            {cartCount} item{cartCount !== 1 ? 's' : ''}
          </span>
        )}
      </header>

      <main className="p-4 max-w-lg mx-auto">
        {cart.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[36px] border border-gray-100 mt-2">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart size={36} className="text-gray-200" />
            </div>
            <p className="text-lg font-black text-gray-300 mb-1">Nothing here yet, homie</p>
            <p className="text-sm text-gray-400 font-medium mb-7">Go browse the menu and add something nice</p>
            <Btn onClick={() => setView('menu')} variant="secondary" className="px-7">Browse Menu</Btn>
          </div>
        ) : (
          <>
            <div className="space-y-2.5 mt-2">
              {cart.map(item => (
                <motion.div
                  key={item.cartId}
                  layout
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  className="bg-white p-3.5 rounded-[20px] flex gap-3 border border-gray-100"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                    <ImageWithFallback src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-sm text-gray-900 leading-snug truncate">{item.name}</h4>
                        <p className="text-[11px] font-bold text-gray-400">{item.quantity}× · R{item.price} each</p>
                        {/* Sauce badge */}
                        <div className="flex items-center gap-1 mt-0.5">
                          <SauceIcon flavor={item.sauce} />
                          <span className="text-[10px] font-bold text-orange-500">{item.sauce}</span>
                        </div>
                        {item.notes && (
                          <p className="text-[11px] italic text-gray-400 mt-0.5 font-medium truncate">"{item.notes}"</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.cartId)}
                        className="p-1.5 bg-red-50 text-red-400 rounded-xl hover:bg-red-100 transition-colors shrink-0"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="flex justify-end mt-1">
                      <span className="font-black text-base text-gray-900">R{item.price * item.quantity}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Order summary */}
            <div className="mt-4 bg-white p-5 rounded-[24px] border border-gray-100 space-y-2.5">
              <div className="flex justify-between text-sm font-bold text-gray-400">
                <span>Subtotal</span><span>R{cartTotal}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-400">
                <span>Collection</span><span className="text-emerald-500 font-black">Free</span>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex justify-between items-end">
                <span className="font-black text-lg">Total</span>
                <span className="font-black text-3xl text-orange-500">R{cartTotal}</span>
              </div>
            </div>

            <Btn onClick={() => setView('checkout')} className="w-full mt-4 text-base py-5">
              Continue to Checkout →
            </Btn>
          </>
        )}
      </main>
    </motion.div>
  );

  // ── Checkout ─────────────────────────────────────────────────────────────────
  const CheckoutPage = () => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [notes, setNotes] = useState('');

    return (
      <motion.div {...pageVariants} className="min-h-screen bg-white">
        <header className="px-4 pt-4 pb-3.5 flex items-center gap-3 border-b border-gray-100">
          <button onClick={() => setView('cart')} className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="font-black text-lg">Your Details</h2>
        </header>

        <main className="px-4 py-5 max-w-lg mx-auto">
          {/* Summary pill */}
          <div className="bg-orange-50 border border-orange-100 rounded-[18px] px-4 py-3.5 mb-7 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-wider">Order total</p>
              <p className="text-2xl font-black text-orange-600">R{cartTotal}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-wider">Items</p>
              <p className="text-2xl font-black text-orange-600">{cartCount}</p>
            </div>
          </div>

          <form
            onSubmit={e => {
              e.preventDefault();
              if (!name.trim() || !phone.trim()) { toast.error('Name and phone are required'); return; }
              placeOrder({ name, phone, notes });
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1">Your Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input
                  type="text" required placeholder="e.g. Sipho, Thabo, Lerato..."
                  className="w-full pl-11 pr-4 py-4 rounded-[18px] bg-gray-50 border-2 border-transparent focus:border-orange-400 focus:bg-white outline-none transition-all font-bold text-base"
                  value={name} onChange={e => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1">
                Phone Number <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input
                  type="tel" required placeholder="071 234 5678"
                  className="w-full pl-11 pr-4 py-4 rounded-[18px] bg-gray-50 border-2 border-transparent focus:border-orange-400 focus:bg-white outline-none transition-all font-bold text-base"
                  value={phone} onChange={e => setPhone(e.target.value)}
                />
              </div>
              <p className="text-[11px] text-gray-400 font-medium ml-1">We'll let you know when your order is ready 📲</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1">Notes (Optional)</label>
              <div className="relative">
                <MessageSquare className="absolute left-4 top-4 text-gray-300" size={18} />
                <textarea
                  placeholder="Collect at 1PM, call me when ready..."
                  className="w-full pl-11 pr-4 py-3.5 rounded-[18px] bg-gray-50 border-2 border-transparent focus:border-orange-400 focus:bg-white outline-none transition-all min-h-[100px] font-medium resize-none text-sm"
                  value={notes} onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-1">
              <Btn type="submit" className="w-full text-base py-5">
                Place Order 🐟
              </Btn>
              <p className="text-center text-gray-400 font-medium mt-3 text-xs">
                Collection only · Cash on pickup
              </p>
            </div>
          </form>
        </main>
      </motion.div>
    );
  };

  // ── Confirmation ─────────────────────────────────────────────────────────────
  const ConfirmationPage = () => (
    <motion.div {...pageVariants} className="min-h-screen flex flex-col items-center justify-center p-7 text-center bg-white">
      <motion.div
        initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 16 }}
        className="w-24 h-24 bg-emerald-500 rounded-[36px] flex items-center justify-center mb-7 shadow-2xl shadow-emerald-100"
      >
        <CheckCircle2 className="text-white" size={52} strokeWidth={1.8} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h1 className="text-4xl font-black text-gray-900 mb-2">Order Placed! 🎉</h1>
        <p className="text-gray-400 font-medium text-base max-w-xs mx-auto">
          Siyabonga! We're on it — your food is coming up.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 }}
        className="bg-orange-50 border-2 border-orange-100 rounded-[28px] px-9 py-7 w-full max-w-xs mt-8 mb-8"
      >
        <p className="text-[11px] font-black text-orange-400 uppercase tracking-widest mb-1.5">Your Collection Number</p>
        <p className="text-6xl font-black text-orange-500 tracking-tight">{activeOrder?.orderNumber}</p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
          <p className="text-xs font-bold text-orange-400">Waiting to be confirmed</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="w-full max-w-xs space-y-3"
      >
        <Btn onClick={() => setView('track')} className="w-full py-5">
          Track My Order →
        </Btn>
        <button
          onClick={() => { setActiveOrder(null); setView('landing'); }}
          className="w-full py-3 text-gray-400 font-bold hover:text-orange-500 transition-colors text-sm"
        >
          Back to home
        </button>
      </motion.div>
    </motion.div>
  );

  // ── Track ────────────────────────────────────────────────────────────────────
  const TrackPage = () => {
    const steps: OrderStatus[] = ['Order Received', 'Being Prepared', 'Ready for Collection', 'Collected'];
    const currentIdx = activeOrder ? steps.indexOf(activeOrder.status) : -1;
    const isCancelled = activeOrder?.status === 'Cancelled';
    const stepIcons = [Bell, ChefHat, CheckCircle2, ShoppingCart];
    const stepLabels = ['Order In 📋', 'Busy Cooking 👨‍🍳', 'Ready! 🎉', 'Collected ✅'];

    return (
      <motion.div {...pageVariants} className="min-h-screen bg-gray-50">
        <header className="sticky top-0 z-10 bg-white px-4 py-3.5 flex items-center gap-3 border-b border-gray-100">
          <button onClick={() => setView('landing')} className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="font-black text-lg flex-1">Live Tracking</h2>
          {activeOrder && <StatusBadge status={activeOrder.status} />}
        </header>

        <main className="p-4 max-w-lg mx-auto">
          {!activeOrder ? (
            <div className="text-center py-20 bg-white rounded-[36px] border border-gray-100 mt-2">
              <Package size={44} className="mx-auto text-gray-200 mb-4" />
              <p className="text-lg font-black text-gray-300 mb-1">No active order</p>
              <p className="text-sm text-gray-400 font-medium mb-7">Place an order first to track it here</p>
              <Btn onClick={() => setView('menu')} variant="secondary" className="px-7">Order Now</Btn>
            </div>
          ) : (
            <>
              {/* Order card */}
              <div className="bg-white rounded-[28px] border border-gray-100 p-5 mb-4 mt-2">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Order</p>
                    <p className="text-3xl font-black text-orange-500">{activeOrder.orderNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Total</p>
                    <p className="text-2xl font-black text-gray-900">R{activeOrder.total}</p>
                  </div>
                </div>

                {isCancelled ? (
                  <div className="bg-red-50 rounded-[18px] p-4 flex items-center gap-3">
                    <AlertCircle className="text-red-400 shrink-0" size={22} />
                    <div>
                      <p className="font-black text-red-600">Order Cancelled</p>
                      <p className="text-sm text-red-400 font-medium">Please contact the shop for help</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-0 relative">
                    <div className="absolute left-[16px] top-5 bottom-5 w-0.5 bg-gray-100 z-0" />
                    {steps.map((step, idx) => {
                      const done = idx < currentIdx;
                      const current = idx === currentIdx;
                      const Icon = stepIcons[idx];
                      return (
                        <div key={step} className="flex items-center gap-4 py-2.5 relative z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${done ? 'bg-emerald-500' : current ? 'bg-orange-500 ring-4 ring-orange-100' : 'bg-gray-100'}`}>
                            {done ? <Check className="text-white" size={15} /> : <Icon size={14} className={current ? 'text-white' : 'text-gray-300'} />}
                          </div>
                          <div className="flex-1">
                            <p className={`font-black text-sm ${done ? 'text-gray-900' : current ? 'text-orange-600' : 'text-gray-300'}`}>
                              {stepLabels[idx]}
                            </p>
                            {current && <p className="text-[11px] font-bold text-orange-400">Happening now...</p>}
                            {done && <p className="text-[11px] font-bold text-emerald-500">Done ✓</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ETA card */}
              {!isCancelled && currentIdx < 3 && (
                <div className="bg-orange-500 text-white rounded-[20px] p-4 flex items-center gap-4 shadow-xl shadow-orange-100">
                  <div className="bg-white/20 rounded-xl w-11 h-11 flex items-center justify-center shrink-0">
                    <Clock size={22} />
                  </div>
                  <div>
                    <p className="text-orange-100 text-[10px] font-black uppercase tracking-wider">Estimated time</p>
                    <p className="text-xl font-black">15 – 20 mins</p>
                  </div>
                </div>
              )}

              {currentIdx === 3 && (
                <div className="bg-emerald-500 text-white rounded-[20px] p-4 flex items-center gap-4 shadow-xl shadow-emerald-100">
                  <div className="bg-white/20 rounded-xl w-11 h-11 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <p className="text-emerald-100 text-[10px] font-black uppercase tracking-wider">Status</p>
                    <p className="text-xl font-black">Collected — Enjoy! 🎉</p>
                  </div>
                </div>
              )}

              <p className="text-center text-gray-400 font-medium text-xs mt-5">
                We'll SMS {activeOrder.phone} when your order is ready.
              </p>
            </>
          )}
        </main>
      </motion.div>
    );
  };

  // ── Admin Login ───────────────────────────────────────────────────────────────
  const AdminLogin = () => {
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [showPass, setShowPass] = useState(false);

    return (
      <motion.div {...pageVariants} className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-[36px] p-7 w-full max-w-sm shadow-2xl">
          <div className="flex flex-col items-center mb-7">
            <div className="w-18 h-18 bg-gray-900 rounded-[24px] p-4 flex items-center justify-center mb-4 shadow-xl rotate-3">
              <Store className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-black text-gray-900">Staff Login</h1>
            <p className="text-gray-400 font-medium mt-1 text-sm">Compas Fisheries — Admin Only</p>
          </div>

          <form
            onSubmit={e => {
              e.preventDefault();
              if (user === 'admin' && pass === 'fish') {
                setAdminLoggedIn(true); setView('admin-dashboard');
              } else { toast.error('Wrong credentials. Hint: admin / fish'); }
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Username</label>
              <input
                type="text" placeholder="admin"
                className="w-full px-4 py-3.5 rounded-[16px] bg-gray-50 border-2 border-transparent focus:border-orange-400 outline-none font-bold transition-all"
                value={user} onChange={e => setUser(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} placeholder="••••"
                  className="w-full px-4 py-3.5 rounded-[16px] bg-gray-50 border-2 border-transparent focus:border-orange-400 outline-none font-bold transition-all pr-11"
                  value={pass} onChange={e => setPass(e.target.value)}
                />
                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-2.5 text-xs text-gray-400 font-medium text-center">
              Demo: <span className="font-black text-gray-600">admin</span> / <span className="font-black text-gray-600">fish</span>
            </div>
            <Btn type="submit" className="w-full py-4 mt-1">Sign In →</Btn>
            <button type="button" onClick={() => setView('landing')} className="w-full py-3 text-gray-400 font-bold hover:text-orange-500 transition-colors text-sm">
              ← Back to customer side
            </button>
          </form>
        </div>
      </motion.div>
    );
  };

  // ── Admin Dashboard ───────────────────────────────────────────────────────────
  const AdminDashboard = () => {
    const [tab, setTab] = useState<'orders' | 'menu'>('orders');
    const activeOrders = orders.filter(o => o.status !== 'Collected' && o.status !== 'Cancelled');
    const todayTotal = orders.filter(o => o.status === 'Collected').reduce((s, o) => s + o.total, 0);

    const nextStatusMap: Partial<Record<OrderStatus, OrderStatus>> = {
      'Order Received': 'Being Prepared',
      'Being Prepared': 'Ready for Collection',
      'Ready for Collection': 'Collected',
    };
    const nextLabelMap: Partial<Record<OrderStatus, string>> = {
      'Order Received': 'Accept & Prepare',
      'Being Prepared': 'Mark Ready',
      'Ready for Collection': 'Mark Collected',
    };

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
        {/* Sidebar */}
        <div className="w-full md:w-60 bg-gray-900 text-white md:h-screen md:sticky md:top-0 flex md:flex-col p-4 gap-3 z-20">
          <div className="flex items-center gap-3 md:mb-8 mr-auto md:mr-0">
            <div className="p-2 bg-orange-500 rounded-xl">
              <Store size={16} />
            </div>
            <span className="font-black text-base">Compas Admin</span>
          </div>

          <nav className="flex md:flex-col gap-2 flex-1">
            {[
              { id: 'orders', label: 'Orders', Icon: Package },
              { id: 'menu', label: 'Menu', Icon: Utensils },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id as any)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-black transition-all ${tab === id ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </nav>

          <button
            onClick={() => { setAdminLoggedIn(false); setView('landing'); }}
            className="flex items-center gap-3 px-3.5 py-2.5 text-red-400 hover:bg-red-900/30 rounded-xl text-sm font-black transition-colors mt-auto"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        {/* Main */}
        <div className="flex-1 overflow-auto">
          <header className="bg-white px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
            <h1 className="text-xl font-black">
              {tab === 'orders' ? 'Current Orders' : 'Menu Management'}
            </h1>
            <div className="flex items-center gap-3">
              {tab === 'orders' && (
                <>
                  <div className="text-right hidden sm:block">
                    <p className="text-[11px] font-black text-gray-400 uppercase">Today's sales</p>
                    <p className="text-lg font-black text-emerald-600">R{todayTotal}</p>
                  </div>
                  {activeOrders.length > 0 && (
                    <div className="bg-red-50 text-red-600 border border-red-100 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      {activeOrders.length} active
                    </div>
                  )}
                </>
              )}
            </div>
          </header>

          <main className="p-5">
            {tab === 'orders' ? (
              <>
                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  {[
                    { label: 'New orders', val: orders.filter(o => o.status === 'Order Received').length, color: 'text-red-600', bg: 'bg-red-50' },
                    { label: 'Preparing', val: orders.filter(o => o.status === 'Being Prepared').length, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Ready', val: orders.filter(o => o.status === 'Ready for Collection').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Collected', val: orders.filter(o => o.status === 'Collected').length, color: 'text-gray-700', bg: 'bg-gray-100' },
                  ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-[18px] p-4`}>
                      <p className={`text-3xl font-black ${s.color}`}>{s.val}</p>
                      <p className="text-xs font-bold text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-28 bg-white rounded-[36px] border-2 border-dashed border-gray-100">
                    <TrendingUp size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-xl font-black text-gray-200">Waiting for orders...</p>
                    <p className="text-gray-300 font-medium mt-2 text-sm">New orders will appear here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {orders.map(order => (
                      <motion.div
                        key={order.id}
                        layout
                        className={`bg-white rounded-[28px] border-2 p-5 transition-all ${order.status === 'Order Received' ? 'border-orange-400 shadow-lg shadow-orange-50' : 'border-gray-100'}`}
                      >
                        {/* Order header */}
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="bg-orange-500 text-white font-black text-sm px-2.5 py-0.5 rounded-lg">
                                {order.orderNumber}
                              </span>
                              <span className="text-xs font-bold text-gray-400">
                                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <h3 className="text-lg font-black text-gray-900">{order.customerName}</h3>
                            <a href={`tel:${order.phone}`} className="text-orange-500 font-bold text-sm hover:underline">{order.phone}</a>
                          </div>
                          <StatusBadge status={order.status} />
                        </div>

                        {/* Items */}
                        <div className="bg-gray-50 rounded-[18px] p-4 mb-4 space-y-2">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between items-start">
                              <div className="flex-1 pr-3">
                                <span className="font-black text-sm text-gray-900">{item.quantity}× {item.name}</span>
                                {/* Show sauce choice */}
                                {item.sauce && item.sauce !== 'Plain' && (
                                  <p className="text-[11px] font-bold text-orange-500 mt-0.5 ml-3">
                                    {SAUCE_OPTIONS.find(s => s.value === item.sauce)?.emoji} {item.sauce}
                                  </p>
                                )}
                                {item.notes && (
                                  <p className="text-[11px] text-orange-400 italic font-medium mt-0.5 ml-3">"{item.notes}"</p>
                                )}
                              </div>
                              <span className="font-black text-gray-500 shrink-0 text-sm">R{item.price * item.quantity}</span>
                            </div>
                          ))}
                          {order.notes && (
                            <div className="pt-2 border-t border-gray-200">
                              <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-1">Customer note</p>
                              <p className="text-sm font-medium text-gray-600 italic">"{order.notes}"</p>
                            </div>
                          )}
                          <div className="pt-2.5 border-t border-gray-200 flex justify-between">
                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Total</span>
                            <span className="text-xl font-black text-gray-900">R{order.total}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          {nextStatusMap[order.status] && (
                            <Btn
                              onClick={() => updateStatus(order.id, nextStatusMap[order.status]!)}
                              variant={order.status === 'Being Prepared' ? 'success' : 'primary'}
                              className="flex-1 py-3 text-sm"
                            >
                              {nextLabelMap[order.status]}
                            </Btn>
                          )}
                          {order.status !== 'Collected' && order.status !== 'Cancelled' && (
                            <Btn
                              onClick={() => updateStatus(order.id, 'Cancelled')}
                              variant="danger"
                              className="py-3 px-4 text-sm"
                            >
                              <X size={15} /> Cancel
                            </Btn>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* Menu management */
              <div className="bg-white rounded-[28px] border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="font-black text-base">All Menu Items</h3>
                  <span className="text-[11px] font-black text-gray-400 bg-gray-100 px-3 py-1 rounded-lg">
                    {menu.filter(m => m.available).length} available
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-5 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-[0.12em]">Item</th>
                        <th className="text-left px-5 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-[0.12em]">Category</th>
                        <th className="text-left px-5 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-[0.12em]">Price</th>
                        <th className="text-left px-5 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-[0.12em]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {menu.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                                <ImageWithFallback src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <p className="font-black text-sm text-gray-900">{item.name}</p>
                                {item.popular && (
                                  <span className="text-[10px] font-black text-orange-500 flex items-center gap-1">
                                    <Star size={8} fill="#f97316" /> Popular
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black ${CATEGORY_CONFIG[item.category].bg} ${CATEGORY_CONFIG[item.category].color}`}>
                              {item.category}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-black text-gray-900 text-sm">R{item.price}</td>
                          <td className="px-5 py-3.5">
                            <button
                              onClick={() => setMenu(menu.map(m => m.id === item.id ? { ...m, available: !m.available } : m))}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${item.available ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full ${item.available ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              {item.available ? 'Available' : 'Sold Out'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="font-sans text-gray-900 antialiased selection:bg-orange-100 max-w-[480px] mx-auto md:max-w-none">
      <AnimatePresence mode="wait">
        {view === 'landing'          && <LandingPage key="landing" />}
        {view === 'menu'             && <MenuPage key="menu" />}
        {view === 'customize'        && <CustomizePage key="customize" />}
        {view === 'cart'             && <CartPage key="cart" />}
        {view === 'checkout'         && <CheckoutPage key="checkout" />}
        {view === 'confirmation'     && <ConfirmationPage key="confirmation" />}
        {view === 'track'            && <TrackPage key="track" />}
        {view === 'admin-login'      && <AdminLogin key="admin-login" />}
        {view === 'admin-dashboard'  && <AdminDashboard key="admin-dashboard" />}
      </AnimatePresence>
      <Toaster position="top-center" richColors expand={false} />
    </div>
  );
}
