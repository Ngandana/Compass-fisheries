import React, { useState, useEffect } from 'react';
import { 
  Fish, 
  ShoppingCart, 
  ChevronRight, 
  Plus, 
  Minus, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  Search,
  Package,
  History,
  LayoutDashboard,
  Settings,
  LogOut,
  X,
  User,
  Phone,
  MessageSquare,
  Utensils,
  Store,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

// --- Types ---
type Category = 'Chips' | 'Fish' | 'Combo';
type OrderStatus = 'Order Received' | 'Being Prepared' | 'Ready for Collection' | 'Collected' | 'Cancelled';

interface MenuItem {
  id: string;
  name: string;
  category: Category;
  price: number;
  description: string;
  image: string;
  available: boolean;
  sizes?: { name: string; price: number }[];
}

interface CartItem extends MenuItem {
  cartId: string;
  quantity: number;
  notes: string;
  selectedSize?: string;
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

// --- Mock Data ---
const INITIAL_MENU: MenuItem[] = [
  {
    id: 'c1',
    name: 'Small Chips',
    category: 'Chips',
    price: 15,
    description: 'Fresh & hot, perfect for one',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=1000&auto=format&fit=crop',
    available: true
  },
  {
    id: 'c2',
    name: 'Medium Chips',
    category: 'Chips',
    price: 25,
    description: 'Our most popular size',
    image: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?q=80&w=1000&auto=format&fit=crop',
    available: true
  },
  {
    id: 'c3',
    name: 'Large Chips',
    category: 'Chips',
    price: 45,
    description: 'Enough for the whole family',
    image: 'https://images.unsplash.com/photo-1630384066242-17a17833f347?q=80&w=1000&auto=format&fit=crop',
    available: true
  },
  {
    id: 'f1',
    name: 'Medium Fried Fish',
    category: 'Fish',
    price: 40,
    description: 'Crispy battered hake',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=1000&auto=format&fit=crop',
    available: true
  },
  {
    id: 'b1',
    name: 'Small Fish + Small Chips',
    category: 'Combo',
    price: 50,
    description: 'Perfect lunch deal',
    image: 'https://images.unsplash.com/photo-1579208570378-8c970854bc23?q=80&w=1000&auto=format&fit=crop',
    available: true
  },
  {
    id: 'b2',
    name: 'Medium Fish + Medium Chips',
    category: 'Combo',
    price: 75,
    description: 'The hungry man\'s favorite',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=1000&auto=format&fit=crop',
    available: true
  }
];

// --- Shared Components ---
const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, icon: Icon, type = "button" }: any) => {
  const baseStyles = "flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100";
  const variants = {
    primary: "bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-100",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
    outline: "border-2 border-gray-200 text-gray-700 hover:border-orange-500 hover:text-orange-500",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    success: "bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-100"
  };

  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyles} ${variants[variant as keyof typeof variants]} ${className}`}
    >
      {Icon && <Icon size={22} />}
      {children}
    </button>
  );
};

// --- Main App Component ---
export default function App() {
  const [view, setView] = useState<'landing' | 'menu' | 'customize' | 'cart' | 'checkout' | 'confirmation' | 'track' | 'admin-login' | 'admin-dashboard'>('landing');
  const [menu, setMenu] = useState<MenuItem[]>(INITIAL_MENU);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);

  // Persistence Mock
  useEffect(() => {
    const savedOrders = localStorage.getItem('compas_fish_chips_orders');
    if (savedOrders) setOrders(JSON.parse(savedOrders));
  }, []);

  const saveOrders = (newOrders: Order[]) => {
    setOrders(newOrders);
    localStorage.setItem('compas_fish_chips_orders', JSON.stringify(newOrders));
  };

  const addToCart = (item: CartItem) => {
    setCart([...cart, { ...item, cartId: Math.random().toString(36).substr(2, 9) }]);
    setView('menu');
    toast.success(`${item.name} added to order!`, { icon: '🔥' });
  };

  const placeOrder = (customerData: { name: string; phone: string; notes: string }) => {
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      orderNumber: `CP-${Math.floor(100 + Math.random() * 899)}`,
      customerName: customerData.name,
      phone: customerData.phone,
      items: cart,
      total: cart.reduce((acc, item) => acc + (item.price * item.quantity), 0),
      status: 'Order Received',
      createdAt: new Date().toISOString(),
      notes: customerData.notes
    };

    const updatedOrders = [newOrder, ...orders];
    saveOrders(updatedOrders);
    setActiveOrder(newOrder);
    setCart([]);
    setView('confirmation');
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status } : o);
    saveOrders(updatedOrders);
    if (activeOrder?.id === orderId) {
      setActiveOrder({ ...activeOrder, status });
    }
    toast.info(`Order is now: ${status}`);
  };

  // --- Views ---

  const LandingPage = () => (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-orange-50"
    >
      <div className="w-28 h-28 mb-8 bg-orange-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-200 rotate-3">
        <Store className="text-white" size={56} />
      </div>
      <h1 className="text-4xl font-black text-gray-900 mb-2">Compas Fisheries</h1>
      <h2 className="text-2xl font-bold text-orange-600 mb-4">Hot Chips & Fish, Easy Order</h2>
      <p className="text-lg text-gray-600 mb-12 max-w-xs font-medium">Order your chips and fish straight from here. Mojo!</p>
      
      <div className="space-y-4 w-full max-w-xs">
        <Button onClick={() => setView('menu')} className="w-full text-xl py-5">
          Order Now
        </Button>
        <p className="text-sm text-gray-400 font-bold">No app needed 👍</p>
      </div>

      <button 
        onClick={() => setView('admin-login')}
        className="mt-24 text-gray-400 hover:text-orange-500 transition-colors text-xs font-bold uppercase tracking-widest"
      >
        Shop Owner Portal
      </button>
    </motion.div>
  );

  const MenuPage = () => {
    const chips = menu.filter(m => m.category === 'Chips');
    const fish = menu.filter(m => m.category === 'Fish');
    const combos = menu.filter(m => m.category === 'Combo');

    return (
      <div className="min-h-screen bg-gray-50 pb-32">
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-lg px-6 py-5 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Store className="text-white" size={20} />
            </div>
            <span className="font-black text-xl tracking-tight">Compas Fisheries</span>
          </div>
          <button 
            onClick={() => setView('cart')}
            className="relative p-3 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all active:scale-90"
          >
            <ShoppingCart size={24} className="text-gray-700" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[12px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
                {cart.length}
              </span>
            )}
          </button>
        </header>

        <main className="p-6 space-y-10">
          {/* Section: Chips */}
          <section>
            <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
              <span className="w-2 h-8 bg-orange-500 rounded-full" />
              Our Chips
            </h2>
            <div className="space-y-4">
              {chips.map((item) => (
                <MenuCard key={item.id} item={item} />
              ))}
            </div>
          </section>

          {/* Section: Fish */}
          <section>
            <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
              <span className="w-2 h-8 bg-blue-500 rounded-full" />
              Fried Fish
            </h2>
            <div className="space-y-4">
              {fish.map((item) => (
                <MenuCard key={item.id} item={item} />
              ))}
            </div>
          </section>

          {/* Section: Combos */}
          <section>
            <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
              <span className="w-2 h-8 bg-green-500 rounded-full" />
              Best Deals (Combos)
            </h2>
            <div className="space-y-4">
              {combos.map((item) => (
                <MenuCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  };

  const MenuCard = ({ item }: { item: MenuItem }) => (
    <motion.div 
      whileTap={{ scale: 0.97 }}
      className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 flex p-3 gap-4"
      onClick={() => {
        setSelectedItem(item);
        setView('customize');
      }}
    >
      <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0">
        <ImageWithFallback src={item.image} className="w-full h-full object-cover" />
      </div>
      <div className="flex-grow flex flex-col justify-between py-1">
        <div>
          <h3 className="font-black text-lg text-gray-900 leading-tight">{item.name}</h3>
          <p className="text-sm font-medium text-gray-400">{item.description}</p>
        </div>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-orange-600 font-black text-xl">R{item.price}</span>
          <div className="p-2 bg-gray-50 text-orange-600 rounded-xl font-black text-sm uppercase px-4">Add</div>
        </div>
      </div>
    </motion.div>
  );

  const CustomizePage = () => {
    const [qty, setQty] = useState(1);
    const [notes, setNotes] = useState('');

    if (!selectedItem) return null;

    return (
      <div className="min-h-screen bg-white">
        <header className="p-6 flex items-center gap-4">
          <button onClick={() => setView('menu')} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-black">Add to Order</h2>
        </header>

        <div className="px-6 pb-40">
          <div className="rounded-[40px] overflow-hidden aspect-video mb-8 shadow-2xl">
            <ImageWithFallback src={selectedItem.image} className="w-full h-full object-cover" />
          </div>

          <div className="flex justify-between items-start mb-2">
            <h1 className="text-3xl font-black text-gray-900">{selectedItem.name}</h1>
            <span className="text-2xl font-black text-orange-600">R{selectedItem.price}</span>
          </div>
          <p className="text-lg font-medium text-gray-500 mb-10">{selectedItem.description}</p>

          <div className="space-y-10">
            <section className="bg-gray-50 p-6 rounded-[32px]">
              <h3 className="font-black text-lg mb-6 flex items-center justify-between">
                How many?
                <span className="text-orange-500 text-sm">Qty</span>
              </h3>
              <div className="flex items-center justify-center gap-10">
                <button 
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-orange-500 transition-colors active:scale-90"
                >
                  <Minus size={28} />
                </button>
                <span className="text-5xl font-black w-12 text-center">{qty}</span>
                <button 
                  onClick={() => setQty(qty + 1)}
                  className="w-16 h-16 rounded-full bg-orange-500 shadow-lg shadow-orange-100 flex items-center justify-center text-white active:scale-90"
                >
                  <Plus size={28} />
                </button>
              </div>
            </section>

            <section>
              <h3 className="font-black text-lg mb-4 ml-2">Any special requests?</h3>
              <div className="relative">
                <MessageSquare className="absolute left-4 top-4 text-gray-300" size={20} />
                <textarea 
                  placeholder="Extra crispy chips, no salt, extra vinegar..."
                  className="w-full pl-12 pr-6 py-5 rounded-[28px] bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white outline-none transition-all min-h-[140px] font-medium text-gray-700"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </section>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-30">
          <div className="flex items-center gap-4 max-w-lg mx-auto">
            <div className="flex-shrink-0">
              <p className="text-xs font-bold text-gray-400 uppercase ml-1">Total</p>
              <p className="text-2xl font-black text-orange-600">R{selectedItem.price * qty}</p>
            </div>
            <Button 
              onClick={() => addToCart({ ...selectedItem, quantity: qty, notes, cartId: '' })}
              className="flex-grow text-lg"
            >
              Add to Order
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const CartPage = () => {
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    return (
      <div className="min-h-screen bg-gray-50 pb-32">
        <header className="p-6 bg-white flex items-center gap-4 border-b border-gray-100 sticky top-0 z-10">
          <button onClick={() => setView('menu')} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-black">Review Order</h2>
        </header>

        <main className="p-6 space-y-4 max-w-lg mx-auto">
          {cart.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[40px] shadow-sm border border-gray-100">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingCart size={48} className="text-gray-200" />
              </div>
              <p className="text-xl font-bold text-gray-400">Your basket is empty</p>
              <Button onClick={() => setView('menu')} variant="secondary" className="mt-8 px-10">Back to Menu</Button>
            </div>
          ) : (
            <>
              {cart.map((item) => (
                <div key={item.cartId} className="bg-white p-5 rounded-[32px] flex gap-4 border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                    <ImageWithFallback src={item.image} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow flex flex-col justify-center">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-lg text-gray-900 leading-tight">{item.name}</h4>
                        <p className="text-sm font-bold text-gray-400">{item.quantity}× • R{item.price}</p>
                        {item.notes && <p className="text-xs italic text-orange-500 mt-1">"{item.notes}"</p>}
                      </div>
                      <button 
                        onClick={() => {
                          setCart(cart.filter(c => c.cartId !== item.cartId));
                          toast.error("Item removed");
                        }}
                        className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="mt-8 bg-white p-8 rounded-[40px] border border-gray-100 space-y-4 shadow-sm">
                <div className="flex justify-between text-gray-400 font-bold">
                  <span>Subtotal</span>
                  <span>R{total}</span>
                </div>
                <div className="flex justify-between text-gray-400 font-bold">
                  <span>Collection</span>
                  <span className="text-green-500 font-black">FREE</span>
                </div>
                <div className="h-px bg-gray-100 w-full" />
                <div className="flex justify-between items-end">
                  <span className="font-black text-xl">Order Total</span>
                  <span className="text-3xl font-black text-orange-600">R{total}</span>
                </div>
              </div>
              
              <Button onClick={() => setView('checkout')} className="w-full text-xl mt-10 shadow-2xl shadow-orange-100">
                Continue
              </Button>
            </>
          )}
        </main>
      </div>
    );
  };

  const CheckoutPage = () => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!name || !phone) {
        toast.error("Name and Phone are needed!");
        return;
      }
      placeOrder({ name, phone, notes });
    };

    return (
      <div className="min-h-screen bg-white">
        <header className="p-6 flex items-center gap-4">
          <button onClick={() => setView('cart')} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-black">Your Details</h2>
        </header>

        <main className="p-6 max-w-lg mx-auto">
          <div className="mb-10">
            <p className="text-gray-500 font-medium">Please let us know who is collecting this order.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 ml-2 uppercase tracking-wider">Your Name</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={24} />
                  <input 
                    type="text" 
                    placeholder="e.g. Sipho"
                    required
                    className="w-full pl-14 pr-6 py-5 rounded-[28px] bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white outline-none transition-all font-bold text-lg"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 ml-2 uppercase tracking-wider">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={24} />
                  <input 
                    type="tel" 
                    placeholder="071 234 5678"
                    required
                    className="w-full pl-14 pr-6 py-5 rounded-[28px] bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white outline-none transition-all font-bold text-lg"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 ml-2 uppercase tracking-wider">Extra Notes (Optional)</label>
                <div className="relative">
                  <MessageSquare className="absolute left-5 top-5 text-gray-300" size={24} />
                  <textarea 
                    placeholder="Collect at 1PM, extra salt please..."
                    className="w-full pl-14 pr-6 py-5 rounded-[28px] bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white outline-none transition-all min-h-[140px] font-bold text-lg"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Button type="submit" className="w-full text-xl py-6">
                Place Order
              </Button>
              <p className="text-center text-gray-400 font-bold mt-4 text-sm">
                We'll let you know when your order is ready!
              </p>
            </div>
          </form>
        </main>
      </div>
    );
  };

  const ConfirmationPage = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-white">
      <motion.div 
        initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }}
        className="w-32 h-32 bg-green-500 rounded-[40px] flex items-center justify-center mb-10 shadow-2xl shadow-green-100"
      >
        <CheckCircle2 className="text-white" size={64} />
      </motion.div>
      <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Order Sent! 👍</h1>
      <p className="text-lg font-medium text-gray-500 mb-10 max-w-xs">We received your order. Hang tight while we prepare it.</p>
      
      <div className="bg-orange-50 p-8 rounded-[40px] w-full max-w-sm mb-12 border-2 border-orange-100">
        <p className="text-xs text-orange-400 mb-2 uppercase tracking-widest font-black">Collection Number</p>
        <p className="text-5xl font-black text-orange-600">{activeOrder?.orderNumber}</p>
        <p className="mt-4 text-orange-500 font-bold text-sm">Status: <span className="underline">Waiting for shop</span></p>
      </div>

      <div className="space-y-4 w-full max-w-xs">
        <Button onClick={() => setView('track')} className="w-full py-5 text-lg">
          Check Order Status
        </Button>
        <button 
          onClick={() => setView('landing')}
          className="w-full py-4 text-gray-400 font-bold hover:text-orange-500 transition-colors"
        >
          Back to Start
        </button>
      </div>
    </div>
  );

  const TrackPage = () => {
    const steps: OrderStatus[] = ['Order Received', 'Being Prepared', 'Ready for Collection', 'Collected'];
    const currentIdx = steps.indexOf(activeOrder?.status as any);

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="p-6 bg-white flex items-center gap-4 border-b border-gray-100 sticky top-0 z-10">
          <button onClick={() => setView('landing')} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-black">Live Tracking</h2>
        </header>

        <main className="p-6 max-w-lg mx-auto">
          <div className="bg-white p-10 rounded-[48px] shadow-sm border border-gray-100 mb-6">
            <div className="flex justify-between items-start mb-12">
              <div>
                <p className="text-xs font-black text-gray-300 uppercase tracking-widest mb-1">Current Step</p>
                <p className="text-2xl font-black text-orange-600">{activeOrder?.status}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-gray-300 uppercase tracking-widest mb-1">Order #</p>
                <p className="text-xl font-black text-gray-900">{activeOrder?.orderNumber}</p>
              </div>
            </div>

            <div className="space-y-0 relative">
              <div className="absolute left-[17px] top-4 bottom-4 w-1 bg-gray-100" />
              {steps.map((step, idx) => {
                const isCompleted = idx < currentIdx;
                const isCurrent = idx === currentIdx;
                const isFuture = idx > currentIdx;

                return (
                  <div key={step} className="flex items-start gap-8 pb-12 last:pb-2 relative">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 transition-all duration-700 ${
                      isCompleted ? 'bg-green-500 scale-110 shadow-lg shadow-green-100' : isCurrent ? 'bg-orange-500 scale-125 shadow-xl shadow-orange-100 ring-4 ring-orange-50' : 'bg-gray-200'
                    }`}>
                      {isCompleted ? <Check className="text-white" size={20} /> : <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div className="pt-1">
                      <p className={`text-lg font-black transition-all duration-700 ${isFuture ? 'text-gray-300' : isCurrent ? 'text-orange-600' : 'text-gray-900'}`}>{step}</p>
                      {isCurrent && <p className="text-sm text-orange-400 font-bold mt-1">We are doing this now...</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-orange-600 p-8 rounded-[40px] text-white shadow-2xl shadow-orange-200 flex items-center gap-6">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <Clock size={32} />
            </div>
            <div>
              <p className="text-orange-100 text-sm font-bold uppercase tracking-wider">Estimate</p>
              <p className="text-2xl font-black">15 - 20 mins</p>
            </div>
          </div>

          <p className="text-center text-gray-400 font-bold mt-10 text-sm">
            We'll send you an SMS when it's Ready!
          </p>
        </main>
      </div>
    );
  };

  // --- Admin Views ---

  const AdminLogin = () => {
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');

    const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if (user === 'admin' && pass === 'fish') {
        setAdminLoggedIn(true);
        setView('admin-dashboard');
      } else {
        toast.error("Incorrect details (try admin/fish)");
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[48px] shadow-2xl shadow-gray-200 w-full max-w-md">
          <div className="flex flex-col items-center mb-12">
            <div className="w-24 h-24 bg-orange-500 rounded-[32px] flex items-center justify-center mb-6 rotate-6 shadow-xl shadow-orange-100">
              <Store className="text-white" size={40} />
            </div>
            <h1 className="text-3xl font-black text-gray-900">Shop Admin</h1>
            <p className="text-gray-400 font-bold mt-1">Compas Fisheries Staff Only</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Username</label>
              <input 
                type="text" 
                className="w-full px-6 py-5 rounded-[24px] bg-gray-50 border-2 border-transparent focus:border-orange-500 outline-none font-bold"
                value={user}
                onChange={(e) => setUser(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
              <input 
                type="password" 
                className="w-full px-6 py-5 rounded-[24px] bg-gray-50 border-2 border-transparent focus:border-orange-500 outline-none font-bold"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full py-5 mt-6 text-lg">Log In</Button>
            <button type="button" onClick={() => setView('landing')} className="w-full text-gray-400 font-bold text-sm">Back to Customer Side</button>
          </form>
        </div>
      </div>
    );
  };

  const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders');

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
        {/* Sidebar */}
        <div className="w-full md:w-72 bg-white border-r border-gray-100 flex md:flex-col p-6 sticky top-0 md:h-screen z-20">
          <div className="flex items-center gap-3 mb-10 mr-auto md:mr-0">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Store className="text-white" size={20} />
            </div>
            <span className="font-black text-xl tracking-tighter">Compas Admin</span>
          </div>
          
          <nav className="flex md:flex-col gap-2 flex-grow">
            <button 
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-black text-sm uppercase tracking-wider ${activeTab === 'orders' ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              <Package size={20} />
              <span className="hidden sm:inline">Orders</span>
            </button>
            <button 
              onClick={() => setActiveTab('menu')}
              className={`flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-black text-sm uppercase tracking-wider ${activeTab === 'menu' ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              <Utensils size={20} />
              <span className="hidden sm:inline">Menu</span>
            </button>
          </nav>

          <button onClick={() => { setAdminLoggedIn(false); setView('landing'); }} className="flex items-center gap-3 px-5 py-4 text-red-500 font-black text-sm uppercase tracking-wider hover:bg-red-50 rounded-2xl transition-all mt-auto">
            <LogOut size={20} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-grow flex flex-col overflow-hidden">
          <header className="bg-white px-8 py-8 border-b border-gray-100 flex items-center justify-between">
            <h1 className="text-3xl font-black tracking-tight">{activeTab === 'orders' ? 'Current Orders' : 'Menu Setup'}</h1>
            <div className="flex items-center gap-4">
              <div className="bg-orange-100 text-orange-600 px-4 py-2 rounded-full font-black text-xs uppercase">
                {orders.filter(o => o.status !== 'Collected' && o.status !== 'Cancelled').length} Active
              </div>
            </div>
          </header>

          <main className="p-8 overflow-y-auto">
            {activeTab === 'orders' ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {orders.length === 0 ? (
                  <div className="col-span-full py-32 text-center bg-white rounded-[56px] border-4 border-dashed border-gray-100">
                    <History size={64} className="mx-auto text-gray-200 mb-6" />
                    <p className="text-2xl font-black text-gray-300">Waiting for orders...</p>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className={`bg-white p-8 rounded-[40px] shadow-sm border transition-all ${order.status === 'Order Received' ? 'border-orange-500 ring-4 ring-orange-50' : 'border-gray-100'}`}>
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="bg-orange-500 text-white px-4 py-1.5 rounded-xl font-black text-lg">#{order.orderNumber}</span>
                            <span className="text-gray-400 font-bold text-sm">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <h3 className="text-2xl font-black text-gray-900">{order.customerName}</h3>
                          <p className="text-lg font-bold text-orange-600 underline">{order.phone}</p>
                        </div>
                        <div className="text-right">
                          <p className={`px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest ${
                            order.status === 'Order Received' ? 'bg-red-50 text-red-600 animate-pulse' :
                            order.status === 'Being Prepared' ? 'bg-blue-50 text-blue-600' :
                            order.status === 'Ready for Collection' ? 'bg-green-50 text-green-600' :
                            'bg-gray-50 text-gray-400'
                          }`}>
                            {order.status}
                          </p>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-6 rounded-[32px] mb-8 space-y-4">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between items-center">
                            <div>
                              <span className="font-black text-lg text-gray-900">{item.quantity}× {item.name}</span>
                              {item.notes && <p className="text-sm font-bold text-orange-400 italic mt-1 ml-6">"Note: {item.notes}"</p>}
                            </div>
                            <span className="font-black text-gray-400">R{item.price * item.quantity}</span>
                          </div>
                        ))}
                        <div className="pt-4 border-t border-gray-200 flex justify-between items-end">
                          <span className="font-black text-gray-400 uppercase text-xs">Total Amount</span>
                          <span className="text-2xl font-black text-gray-900">R{order.total}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {order.status === 'Order Received' && (
                          <Button onClick={() => updateOrderStatus(order.id, 'Being Prepared')} className="px-8 flex-grow">Accept & Prepare</Button>
                        )}
                        {order.status === 'Being Prepared' && (
                          <Button onClick={() => updateOrderStatus(order.id, 'Ready for Collection')} variant="success" className="px-8 flex-grow">Mark as Ready</Button>
                        )}
                        {order.status === 'Ready for Collection' && (
                          <Button onClick={() => updateOrderStatus(order.id, 'Collected')} variant="secondary" className="px-8 flex-grow font-black">Collected ✅</Button>
                        )}
                        {order.status !== 'Collected' && order.status !== 'Cancelled' && (
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'Cancelled')}
                            className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-colors font-black text-sm uppercase px-6"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="bg-white rounded-[48px] shadow-sm border border-gray-100 overflow-hidden max-w-5xl mx-auto">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                  <h3 className="text-xl font-black">Menu List</h3>
                  <Button icon={Plus} className="px-6 py-3 text-sm">Add New Item</Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-8 py-5 font-black text-xs text-gray-400 uppercase tracking-[0.2em]">Item</th>
                        <th className="px-8 py-5 font-black text-xs text-gray-400 uppercase tracking-[0.2em]">Category</th>
                        <th className="px-8 py-5 font-black text-xs text-gray-400 uppercase tracking-[0.2em]">Price</th>
                        <th className="px-8 py-5 font-black text-xs text-gray-400 uppercase tracking-[0.2em]">Available</th>
                        <th className="px-8 py-5 font-black text-xs text-gray-400 uppercase tracking-[0.2em] text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {menu.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm shrink-0">
                                <ImageWithFallback src={item.image} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <p className="font-black text-gray-900">{item.name}</p>
                                <p className="text-xs text-gray-400 font-bold">{item.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              item.category === 'Chips' ? 'bg-orange-50 text-orange-600' :
                              item.category === 'Fish' ? 'bg-blue-50 text-blue-600' :
                              'bg-green-50 text-green-600'
                            }`}>
                              {item.category}
                            </span>
                          </td>
                          <td className="px-8 py-5 font-black text-gray-900">R{item.price}</td>
                          <td className="px-8 py-5">
                            <button 
                              onClick={() => setMenu(menu.map(m => m.id === item.id ? { ...m, available: !m.available } : m))}
                              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${item.available ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}
                            >
                              <div className={`w-2 h-2 rounded-full ${item.available ? 'bg-green-600' : 'bg-red-600'}`} />
                              {item.available ? 'ON' : 'OFF'}
                            </button>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <button className="text-gray-400 hover:text-orange-500 font-black text-xs uppercase underline">Edit</button>
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

  return (
    <div className="font-sans text-gray-900 selection:bg-orange-100 antialiased">
      <AnimatePresence mode="wait">
        {view === 'landing' && <LandingPage key="landing" />}
        {view === 'menu' && <MenuPage key="menu" />}
        {view === 'customize' && <CustomizePage key="customize" />}
        {view === 'cart' && <CartPage key="cart" />}
        {view === 'checkout' && <CheckoutPage key="checkout" />}
        {view === 'confirmation' && <ConfirmationPage key="confirmation" />}
        {view === 'track' && <TrackPage key="track" />}
        {view === 'admin-login' && <AdminLogin key="login" />}
        {view === 'admin-dashboard' && <AdminDashboard key="dashboard" />}
      </AnimatePresence>
      <Toaster position="top-center" richColors />
    </div>
  );
}
