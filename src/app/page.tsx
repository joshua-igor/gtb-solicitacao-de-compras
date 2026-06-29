'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Store, Product, MOCK_STORES } from '@/lib/supabase';
import { Combobox } from '@/components/ui/combobox';
import { submitOrderToInvGate } from '@/app/actions/submit-order';
import { ShoppingBag, Trash2, Info, AlertCircle, Loader2, CheckCircle2, LogOut } from 'lucide-react';
import { getSSOBypassStatus } from '@/app/actions/bypass';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function OrderPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Database states
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // User Choices state
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productQuantities, setProductQuantities] = useState<{ [productId: string]: string }>({});

  // Form submission status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertState, setAlertState] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: ''
  });

  // Verify Supabase SSO user authentication
  useEffect(() => {
    async function checkAuth() {
      const bypassStatus = await getSSOBypassStatus();
      if (bypassStatus.bypassSSO) {
        console.log(`SSO Bypass is active. Logged in as: ${bypassStatus.bypassEmail}`);
        setUser({ email: bypassStatus.bypassEmail });
        setLoadingUser(false);
        return;
      }

      // Clear bypass indicator if bypass not active
      localStorage.removeItem('sso_bypass_user');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Enforce SSO login redirect
        router.push('/login');
      } else {
        setUser(session.user);
      }
      setLoadingUser(false);
    }
    checkAuth();
  }, [router]);

  // Retrieve stores and products from Supabase
  useEffect(() => {
    async function fetchData() {
      try {
        setLoadingData(true);
        // Querying the databases
        const { data: storesDb } = await supabase.from('stores').select('*');
        const { data: productsDb } = await supabase.from('products').select('*');

        if (storesDb && storesDb.length > 0) {
          setStores(storesDb);
        } else {
          setStores(MOCK_STORES);
        }

        if (productsDb && productsDb.length > 0) {
          setProducts(productsDb);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.warn('Erro ao carregar dados do Supabase. Usando fallback se aplicável.');
        setStores(MOCK_STORES);
        setProducts([]);
      } finally {
        setLoadingData(false);
      }
    }
    fetchData();
  }, []);

  // Sync manual input values
  const handleQtyInputChange = (productId: string, val: string) => {
    // Only accept positive integer patterns or blank spaces
    if (val === '' || /^[0-9]\d*$/.test(val)) {
      setProductQuantities(prev => ({ ...prev, [productId]: val }));
    }
  };

  // Triggered when item quantity loses focus (or Enter is pressed)
  const handleQtyBlur = (product: Product, rawVal: string) => {
    const qty = parseInt(rawVal, 10);
    if (!isNaN(qty) && qty > 0) {
      updateCartItem(product, qty);
    } else {
      removeCartItem(product.id);
    }
  };

  // Update or Insert items within current cart session
  const updateCartItem = (product: Product, qty: number) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.product.id === product.id);
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx].quantity = qty;
        return next;
      } else {
        return [...prev, { product, quantity: qty }];
      }
    });
    setProductQuantities(prev => ({ ...prev, [product.id]: String(qty) }));
  };

  const removeCartItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    setProductQuantities(prev => ({ ...prev, [productId]: '' }));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('sso_bypass_user');
    router.push('/login');
  };

  // Math Calculations
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalOrderValue = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const handleOrderSubmission = async () => {
    if (!selectedStore) {
      setAlertState({
        type: 'error',
        message: 'Por favor, selecione uma unidade antes de prosseguir.'
      });
      return;
    }

    if (cart.length === 0) {
      setAlertState({
        type: 'error',
        message: 'Seu carrinho está vazio. Adicione pelo menos um item.'
      });
      return;
    }

    setIsSubmitting(true);
    setAlertState({ type: null, message: '' });

    const response = await submitOrderToInvGate({
      storeId: selectedStore.id,
      storeName: selectedStore.name,
      cartItems: cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        weight: item.product.weight * item.quantity,
        price: item.product.price * item.quantity
      })),
      totalEstimated: totalOrderValue,
      totalOrder: totalOrderValue,
      totalProduct: totalOrderValue,
      freight: 0,
      userEmail: user?.email || 'usuario@ogrupothebest.com.br'
    });

    setIsSubmitting(false);

    if (response.success) {
      if ((response as any).bypassActive) {
        console.log("InvGate API Request Bypass is active. Request was not sent, simulated HTTP 200/Success.");
      }
      setAlertState({
        type: 'success',
        message: `Pedido solicitado com sucesso! Chamado ${response.ticketId} aberto no InvGate.`
      });
      // Clear cart on success
      setCart([]);
      setProductQuantities({});
    } else {
      setAlertState({
        type: 'error',
        message: response.message || 'Erro ao submeter pedido.'
      });
    }
  };

  if (loadingUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const shortName = user?.email ? user.email.split('@')[0] : 'Usuário';

  return (
    <div className="flex flex-col h-screen bg-[#F8F9FA] overflow-hidden font-sans">
      {/* Top Header */}
      <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-8 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-yellow-500 to-orange-600 p-1 shadow-md">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-[#151718] text-sm font-black text-orange-500">
              TB
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 tracking-wide">O GRUPO</h2>
            <p className="text-[10px] uppercase font-bold tracking-widest text-orange-500">The Best</p>
          </div>
        </div>

        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Novo Pedido</h1>

        {/* User Panel at Top Right */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
              {shortName.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-gray-800 leading-none truncate max-w-[120px]">
                {shortName}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </div>
      </header>

      {/* Dynamic Grid Body */}
      <main className="flex flex-1 overflow-hidden p-6 gap-6">
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          
          {/* Store Picker & Selector controls */}
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <div className="w-1/2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Unidade Corporativa
              </label>
              <Combobox
                items={stores}
                placeholder="Selecione a Loja..."
                searchPlaceholder="Pesquisar loja..."
                getLabel={(s) => `${s.code} - ${s.name}`}
                getValue={(s) => s.id}
                onSelect={(s) => setSelectedStore(s)}
              />
            </div>
          </div>

          {/* Dynamic Alert Messages */}
          {alertState.type && (
            <div className={`mx-5 mt-4 p-4 rounded-lg flex items-start gap-3 border ${
              alertState.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {alertState.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <p className="text-xs font-medium leading-relaxed">{alertState.message}</p>
            </div>
          )}

          {/* Main Products Grid Form List */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Selecionar Itens</h3>
            <div className="overflow-hidden border border-gray-100 rounded-lg">
              <table className="w-full text-left text-xs text-gray-600 border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 font-bold uppercase border-b border-gray-100">
                    <th className="py-3 px-4">Item</th>
                    <th className="py-3 px-2">Sugestão</th>
                    <th className="py-3 px-2 text-center">Peso</th>
                    <th className="py-3 px-2 text-right">Valor</th>
                    <th className="py-3 px-2 text-center">Estoque</th>
                    <th className="py-3 px-2 text-center">Consumo (15 Dias)</th>
                    <th className="py-3 px-4 text-center w-24">Quantidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingData ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-500" />
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-400 font-semibold">
                        Nenhum produto cadastrado no banco de dados.
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => {
                      const currentInputVal = productQuantities[p.id] !== undefined ? productQuantities[p.id] : '';
                      return (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-gray-950 text-sm">{p.name}</td>
                          <td className="py-3.5 px-2">
                            <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
                          </td>
                          <td className="py-3.5 px-2 text-center font-medium">{p.weight.toFixed(2)} KG</td>
                          <td className="py-3.5 px-2 text-right font-semibold text-gray-800">
                            R$ {p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-2 text-center font-bold text-amber-600">{p.stock}</td>
                          <td className="py-3.5 px-2 text-center text-gray-400">{p.consumption_15_days || 'Sem Info.'}</td>
                          <td className="py-3.5 px-4 text-center">
                            <input
                              type="text"
                              value={currentInputVal}
                              onChange={(e) => handleQtyInputChange(p.id, e.target.value)}
                              onBlur={() => handleQtyBlur(p, currentInputVal)}
                              placeholder="0"
                              className="w-16 rounded-md border border-gray-200 py-1.5 text-center text-sm font-bold text-gray-800 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 shadow-sm"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Shopping Cart Drawer panel */}
        <div className="w-80 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between overflow-hidden shrink-0">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-wider uppercase text-gray-500">Carrinho do Pedido</h3>
            <ShoppingBag className="h-5 w-5 text-gray-400" />
          </div>

          {/* List of current items inside cart */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Carrinho Vazio</p>
                <p className="text-[11px] text-gray-400 mt-1">Preencha as quantidades ao lado para adicionar itens.</p>
              </div>
            ) : (
              cart.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 group relative">
                  <div className="flex-1 space-y-0.5">
                    <p className="text-sm font-bold text-gray-900 leading-tight">{product.name}</p>
                    <p className="text-[11px] text-gray-500">Quantidade: <span className="font-bold text-gray-700">{quantity}</span></p>
                    <p className="text-[11px] text-gray-500">Peso Total: <span className="font-bold text-gray-700">{(product.weight * quantity).toFixed(2)} KG</span></p>
                    <p className="text-[11px] text-gray-500">Valor Total: <span className="font-bold text-orange-600">R$ {(product.price * quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                  </div>
                  <button
                    onClick={() => removeCartItem(product.id)}
                    className="absolute right-3 bottom-3 text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remover
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Pricing Summary inside right Panel */}
          <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Total</p>
                <p className="text-lg font-black text-gray-900">
                  R$ {totalOrderValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Quantidade</p>
                <p className="text-lg font-black text-orange-600">{totalQty}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Global sticky totals footer controls */}
      <footer className="h-20 bg-white border-t border-gray-200 px-8 flex items-center justify-between shrink-0">
        <div className="flex gap-8">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              Quantidade
            </p>
            <p className="text-base font-extrabold text-orange-600">
              {totalQty}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              Total do Pedido
            </p>
            <p className="text-base font-extrabold text-gray-900">
              R$ {totalOrderValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setCart([]);
              setProductQuantities({});
              setSelectedStore(null);
              setAlertState({ type: null, message: '' });
            }}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleOrderSubmission}
            disabled={isSubmitting}
            className="bg-[#ff7a59] hover:bg-[#e66746] text-white px-8 py-2.5 rounded-lg text-sm font-bold shadow-md shadow-orange-500/10 transition-colors flex items-center gap-2 disabled:bg-gray-300 disabled:shadow-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Continuar Pedido'
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
