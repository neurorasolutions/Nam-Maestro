import React, { useState } from 'react';

// --- DATI REALI NAM EDIZIONI (HARDCODED) ---

interface NamProduct {
  id: number;
  title: string;
  author: string;
  price: number;
  stock: number;
  category: string;
}

const REAL_INVENTORY: NamProduct[] = [
  { id: 1, title: "Pianoforte per Giovanissimi", author: "V. Caprì", price: 15.00, stock: 45, category: "Didattica Base" },
  { id: 2, title: "Maxxified - Sviluppo per il batterista", author: "M. Furian", price: 25.00, stock: 8, category: "Batteria" }, // LOW STOCK (<10)
  { id: 3, title: "Fonotecnica - Arte del Sound Designer", author: "S. Cattaneo", price: 18.00, stock: 20, category: "Audio Pro" },
  { id: 4, title: "Dritti al Suono - Teoria Smart", author: "G. Bernardi", price: 25.00, stock: 15, category: "Teoria" },
  { id: 5, title: "Comporre Musica Elettronica", author: "Bernardi/Flaminio", price: 18.00, stock: 12, category: "Produzione" },
  { id: 6, title: "Capire l’Armonia Moderna (Ed. 2024)", author: "C. Flaminio", price: 28.00, stock: 30, category: "Armonia" },
];

interface Order {
  id: string;
  date: string;
  customer: string;
  itemsDescription: string;
  subtotal: number;
  shippingCost: number;
  channel: 'instagram' | 'web' | 'office';
  deliveryType: 'shipping' | 'pickup' | 'counter';
  status: 'pending' | 'ready' | 'shipped' | 'delivered';
}

const REAL_ORDERS: Order[] = [
  { 
    id: '#ORD-101', 
    date: '2026-02-14', 
    customer: 'Luigi Verdi', 
    itemsDescription: '1x Maxxified', 
    subtotal: 25.00, 
    shippingCost: 5.00, 
    channel: 'web', 
    deliveryType: 'shipping', 
    status: 'pending' 
  },
  { 
    id: '#ORD-102', 
    date: '2026-02-14', 
    customer: 'Anna Rossi', 
    itemsDescription: 'Armonia + Dritti al Suono + Fonotecnica', 
    subtotal: 71.00, 
    shippingCost: 0.00, // GRATIS > 55€
    channel: 'web', 
    deliveryType: 'shipping', 
    status: 'pending' 
  },
  { 
    id: '#ORD-103', 
    date: '2026-02-13', 
    customer: 'Marco Batterista', 
    itemsDescription: '1x Maxxified', 
    subtotal: 25.00, 
    shippingCost: 0.00, // Ritiro Sede
    channel: 'instagram', 
    deliveryType: 'pickup', 
    status: 'ready' 
  },
  { 
    id: '#ORD-104', 
    date: '2026-02-13', 
    customer: 'Allievo Interno', 
    itemsDescription: '1x Pianoforte per Giovanissimi', 
    subtotal: 15.00, 
    shippingCost: 0.00, // Vendita diretta
    channel: 'office', 
    deliveryType: 'counter', 
    status: 'delivered' 
  },
];

const WarehouseView: React.FC = () => {
  // Inizializzazione diretta dello stato con le costanti per garantire il rendering immediato
  const [orders, setOrders] = useState<Order[]>(REAL_ORDERS);
  const [inventory] = useState<NamProduct[]>(REAL_INVENTORY);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);

  // KPI Calculations
  const toShipCount = orders.filter(o => o.deliveryType === 'shipping' && o.status === 'pending').length;
  const toPickupCount = orders.filter(o => o.deliveryType === 'pickup' && o.status !== 'delivered').length;
  const lowStockCount = inventory.filter(i => i.stock < 10).length;

  const handleProcessOrder = (id: string, type: 'shipping' | 'pickup') => {
    setOrders(prev => prev.map(o => {
        if (o.id === id) {
            return { ...o, status: type === 'shipping' ? 'shipped' : 'delivered' };
        }
        return o;
    }));
    alert(type === 'shipping' ? "Etichetta generata e ordine segnato come SPEDITO." : "Ordine segnato come RITIRATO.");
  };

  const handleAiBatchAction = () => {
      setAiProcessing(true);
      setTimeout(() => {
          setAiProcessing(false);
          setShowAiModal(false);
          setOrders(prev => prev.map(o => o.deliveryType === 'shipping' && o.status === 'pending' ? { ...o, status: 'shipped' } : o));
          alert(`✅ Generata distinta per ${toShipCount} ordini NAM Edizioni.`);
      }, 2000);
  };

  const getChannelBadge = (channel: string) => {
      switch(channel) {
          case 'instagram': return <span className="px-2 py-1 rounded text-xs font-bold bg-pink-100 text-pink-600 border border-pink-200"><i className="fab fa-instagram mr-1"></i>Social</span>;
          case 'web': return <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-600 border border-blue-200"><i className="fas fa-globe mr-1"></i>E-Commerce</span>;
          default: return <span className="px-2 py-1 rounded text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200"><i className="fas fa-store mr-1"></i>Bancone</span>;
      }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val);

  return (
    <div className="p-6 h-full flex flex-col relative overflow-hidden">
      
      {/* HEADER & ACTIONS */}
      <div className="flex justify-between items-end mb-8 flex-shrink-0">
         <div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Logistica NAM Edizioni</h2>
            <p className="text-sm text-gray-500">Gestione ordini editoriali e merchandising.</p>
         </div>
         <button 
            onClick={() => setShowAiModal(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all font-bold flex items-center text-sm"
         >
            <i className="fas fa-magic mr-2 text-yellow-300"></i> AI: Genera Distinta Spedizioni
         </button>
      </div>

      {/* KPI DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 flex-shrink-0">
        <div className="bg-white p-4 rounded shadow-sm border-l-4 border-red-500 flex items-center justify-between">
           <div>
              <div className="text-xs font-bold text-gray-400 uppercase">Da Spedire (Corriere)</div>
              <div className="text-3xl font-bold text-red-600 mt-1">{toShipCount}</div>
           </div>
           <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 text-xl">
              <i className="fas fa-truck"></i>
           </div>
        </div>
        <div className="bg-white p-4 rounded shadow-sm border-l-4 border-yellow-500 flex items-center justify-between">
           <div>
              <div className="text-xs font-bold text-gray-400 uppercase">Da Ritirare (In Sede)</div>
              <div className="text-3xl font-bold text-yellow-600 mt-1">{toPickupCount}</div>
           </div>
           <div className="h-10 w-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600 text-xl">
              <i className="fas fa-box"></i>
           </div>
        </div>
        <div className="bg-white p-4 rounded shadow-sm border-l-4 border-orange-500 flex items-center justify-between">
           <div>
              <div className="text-xs font-bold text-gray-400 uppercase">Giacenza Critica ({'<'}10)</div>
              <div className="text-3xl font-bold text-orange-600 mt-1">{lowStockCount} Titoli</div>
           </div>
           <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 text-xl">
              <i className="fas fa-exclamation-triangle"></i>
           </div>
        </div>
      </div>
      
      {/* SCROLLABLE AREA CONTAINER */}
      <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-8">
        
          {/* TABLE 1: GESTORE ORDINI */}
          <div className="bg-white rounded shadow-sm overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
               <h3 className="font-bold text-gray-700 flex items-center"><i className="fas fa-clipboard-list mr-2 text-gray-400"></i>Ordini Recenti & Spedizioni</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Ordine</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente / Prodotti</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Canale</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Logistica</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Totale</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Azioni</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap align-top">
                       <div className="font-bold text-gray-800">{order.id}</div>
                       <div className="text-xs text-gray-500">{order.date}</div>
                    </td>
                    <td className="px-6 py-4 align-top">
                       <div className="font-bold text-gray-900">{order.customer}</div>
                       <div className="text-xs text-gray-600 mt-1 italic leading-tight max-w-[200px]">{order.itemsDescription}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap align-top">
                       {getChannelBadge(order.channel)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap align-top">
                       {order.deliveryType === 'shipping' && (
                           <div className="flex items-center text-indigo-700 font-bold text-xs bg-indigo-50 px-2 py-1 rounded w-fit border border-indigo-100">
                               <i className="fas fa-truck mr-1.5"></i> Corriere
                           </div>
                       )}
                       {order.deliveryType === 'pickup' && (
                           <div className="flex items-center text-orange-700 font-bold text-xs bg-orange-50 px-2 py-1 rounded w-fit border border-orange-100">
                               <i className="fas fa-people-carry mr-1.5"></i> Ritiro Sede
                           </div>
                       )}
                       {order.deliveryType === 'counter' && (
                           <div className="flex items-center text-gray-700 font-bold text-xs bg-gray-100 px-2 py-1 rounded w-fit border border-gray-200">
                               <i className="fas fa-hand-holding-usd mr-1.5"></i> Banco
                           </div>
                       )}
                       <div className="mt-2 text-xs">
                         {order.status === 'pending' && <span className="text-red-500 font-bold animate-pulse">Da Lavorare</span>}
                         {order.status === 'ready' && <span className="text-yellow-600 font-bold">Pronto al Ritiro</span>}
                         {order.status === 'shipped' && <span className="text-green-600 font-bold">Spedito</span>}
                         {order.status === 'delivered' && <span className="text-gray-400 font-bold line-through">Consegnato</span>}
                       </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap align-top">
                       <div className="font-bold text-gray-800 text-lg">{formatCurrency(order.subtotal + order.shippingCost)}</div>
                       <div className="text-xs text-gray-500 mt-1">
                          {order.subtotal > 55 && order.deliveryType === 'shipping' ? (
                              <span className="text-green-600 font-bold">Spedizione GRATIS</span>
                          ) : (
                              <>
                                 {formatCurrency(order.subtotal)} + <span className={order.shippingCost > 0 ? "text-gray-700" : "text-green-600"}>{order.shippingCost > 0 ? formatCurrency(order.shippingCost) : "Gratis"}</span> (Sped.)
                              </>
                          )}
                       </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right align-top">
                       {order.status === 'pending' && order.deliveryType === 'shipping' && (
                           <button onClick={() => handleProcessOrder(order.id, 'shipping')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm flex items-center ml-auto">
                               <i className="fas fa-print mr-1"></i> Etichetta
                           </button>
                       )}
                       {order.status === 'pending' && order.deliveryType === 'pickup' && (
                           <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm flex items-center ml-auto">
                               <i className="fas fa-check mr-1"></i> Segna Pronto
                           </button>
                       )}
                       {order.status === 'ready' && (
                           <button onClick={() => handleProcessOrder(order.id, 'pickup')} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm flex items-center ml-auto">
                               <i className="fas fa-handshake mr-1"></i> Consegna
                           </button>
                       )}
                       {(order.status === 'shipped' || order.status === 'delivered') && (
                            <button className="text-gray-400 text-xs hover:text-gray-600 underline">Dettagli</button>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TABLE 2: INVENTARIO NAM EDIZIONI (CON SCROLL FIX) */}
          <div className="bg-white rounded shadow-sm overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
               <h3 className="font-bold text-gray-700 flex items-center"><i className="fas fa-book mr-2 text-gray-400"></i>Catalogo NAM Edizioni</h3>
               <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-600 font-bold">Aggiornato: Oggi, 09:00</span>
            </div>
            
            {/* WRAPPER SCROLLABILE CON ALTEZZA FISSA */}
            <div className="overflow-y-auto max-h-[400px]">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/3 bg-gray-50">Titolo & Autore</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Prezzo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/4 bg-gray-50">Giacenza</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Valore Stock</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inventory.map((item) => {
                      const maxStock = 50; 
                      const stockPercent = Math.min((item.stock / maxStock) * 100, 100);
                      const isLowStock = item.stock < 10;
                      
                      return (
                      <tr key={item.id} className={isLowStock ? "bg-red-50" : "hover:bg-gray-50"}>
                        <td className="px-6 py-4 align-middle">
                            <div className="flex items-center">
                                {isLowStock && (
                                    <div className="mr-3 animate-pulse text-red-500" title="Giacenza Critica">
                                        <i className="fas fa-exclamation-circle text-xl"></i>
                                    </div>
                                )}
                                <div>
                                    <div className={`font-bold text-base ${isLowStock ? 'text-red-700' : 'text-gray-800'}`}>{item.title}</div>
                                    <div className="text-sm text-gray-500 italic">{item.author}</div>
                                    <div className="text-[10px] uppercase text-gray-400 font-bold mt-1 tracking-wide">{item.category}</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700 font-bold align-middle">
                           {formatCurrency(item.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap align-middle">
                           <div className="w-full">
                               <div className="flex justify-between text-xs mb-1 font-semibold">
                                   <span className={isLowStock ? "text-red-700 font-bold text-sm" : "text-gray-600"}>{item.stock} pz.</span>
                                   {isLowStock && <span className="text-red-600 text-[10px] bg-red-100 px-1 rounded uppercase">Riordino</span>}
                               </div>
                               <div className="w-full bg-gray-200 rounded-full h-2.5">
                                   <div 
                                     className={`h-2.5 rounded-full shadow-sm ${isLowStock ? 'bg-red-500' : 'bg-nam-green'}`} 
                                     style={{width: `${stockPercent}%`}}
                                   ></div>
                               </div>
                           </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700 font-mono align-middle">
                           {formatCurrency(item.stock * item.price)}
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
            </div>
          </div>

      </div>

      {/* AI MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up">
              <div className="text-center mb-6">
                 <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-magic text-purple-600 text-2xl"></i>
                 </div>
                 <h3 className="text-xl font-bold text-gray-800">Smart Logistics AI</h3>
                 <p className="text-gray-600 mt-2 text-sm">
                    Ho raggruppato <strong className="text-purple-700">{toShipCount} ordini</strong> in attesa di spedizione.
                 </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-6 text-sm">
                 <ul className="space-y-2">
                    <li className="flex items-center text-gray-700"><i className="fas fa-check text-green-500 mr-2"></i> Controllo indirizzi</li>
                    <li className="flex items-center text-gray-700"><i className="fas fa-check text-green-500 mr-2"></i> Generazione Lettere di Vettura (GLS/DHL)</li>
                    <li className="flex items-center text-gray-700"><i className="fas fa-check text-green-500 mr-2"></i> Invio Email Tracking ai clienti</li>
                 </ul>
              </div>

              <div className="flex space-x-3">
                 <button onClick={() => setShowAiModal(false)} className="flex-1 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded">Annulla</button>
                 <button 
                    onClick={handleAiBatchAction}
                    disabled={aiProcessing || toShipCount === 0}
                    className={`flex-1 py-2 text-white font-bold rounded shadow flex items-center justify-center ${toShipCount === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}
                 >
                    {aiProcessing ? <><i className="fas fa-circle-notch fa-spin mr-2"></i> Elaborazione...</> : 'Conferma e Stampa'}
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default WarehouseView;