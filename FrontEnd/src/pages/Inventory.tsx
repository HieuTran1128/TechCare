import React, { useState } from 'react';
import { MOCK_INVENTORY, type InventoryItem } from '../constants';
import { Search, Plus, Filter, AlertCircle, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const Inventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>(MOCK_INVENTORY);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const handleAddItem = () => {
    const name = window.prompt("Nhập tên linh kiện:");
    if (name) {
        const newItem: InventoryItem = {
            id: Date.now().toString(),
            name: name,
            sku: `NEW-${Math.floor(Math.random()*1000)}`,
            quantity: Math.floor(Math.random() * 50),
            price: Math.floor(Math.random() * 5000000),
            category: 'Khác',
            image: `https://picsum.photos/200/200?random=${items.length + 1}`
        };
        setItems([newItem, ...items]);
    }
  };

  const handleDelete = (id: string) => {
      if(window.confirm("Xóa linh kiện này?")) {
          setItems(items.filter(i => i.id !== id));
      }
  }

  const filteredItems = items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.sku.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = activeCategory === 'All' 
        ? true 
        : activeCategory === 'LowStock' 
            ? item.quantity < 10 
            : item.category === activeCategory;

      return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Màn hình', 'Pin', 'Chip', 'Phụ kiện', 'Kính', 'Khác'];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemAnim = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Quản lý kho hàng</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Theo dõi tồn kho và tình trạng linh kiện</p>
            </div>
            <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddItem}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30"
            >
                <Plus size={20} /> Thêm linh kiện
            </motion.button>
        </div>

        <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl p-4 rounded-2xl border border-white/20 dark:border-slate-700 shadow-lg flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder="Tìm kiếm linh kiện (Tên, Mã SKU)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:text-white transition-all"
                />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                 {categories.map(cat => (
                     <button 
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300
                            ${activeCategory === cat 
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md transform scale-105' 
                                : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                    >
                        {cat === 'All' ? 'Tất cả' : cat}
                     </button>
                 ))}
                 
                 <button 
                    onClick={() => setActiveCategory('LowStock')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-semibold whitespace-nowrap transition-all duration-300
                        ${activeCategory === 'LowStock'
                            ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:text-red-300 shadow-md transform scale-105 ring-1 ring-red-500/20'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500'}`}
                 >
                    <AlertCircle size={16} /> Sắp hết hàng
                 </button>
            </div>
        </div>

        {filteredItems.length === 0 ? (
             <div className="text-center py-24 bg-white/40 dark:bg-slate-800/40 backdrop-blur rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search size={32} className="text-slate-400" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Không tìm thấy linh kiện phù hợp</p>
                <button onClick={() => {setSearchTerm(''); setActiveCategory('All');}} className="text-blue-600 font-semibold text-sm mt-2 hover:underline">Xóa bộ lọc</button>
             </div>
        ) : (
            <motion.div 
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
                {filteredItems.map((item) => (
                    <motion.div 
                        variants={itemAnim}
                        key={item.id} 
                        layoutId={item.id}
                        className="group bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/50 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden flex flex-col relative"
                    >
                        {/* Gradient Border Effect on Hover */}
                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500/30 rounded-2xl transition-all duration-300 pointer-events-none"></div>

                        <button 
                            onClick={() => handleDelete(item.id)}
                            className="absolute z-10 top-3 right-3 p-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-all shadow-sm transform scale-90 group-hover:scale-100"
                        >
                            <Trash2 size={16}/>
                        </button>

                        <div className="relative h-52 bg-slate-50/50 dark:bg-slate-900/50 p-6 flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 opacity-50"></div>
                            <img src={item.image} alt={item.name} className="relative z-10 max-h-full object-contain mix-blend-multiply dark:mix-blend-normal opacity-90 group-hover:scale-110 transition-transform duration-500 drop-shadow-lg" />
                            {item.quantity < 10 && (
                                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-50/90 dark:bg-red-900/80 backdrop-blur px-3 py-1 rounded-full shadow-sm border border-red-100 dark:border-red-900/50 z-20">
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                    </span>
                                    <span className="text-[10px] font-bold text-red-600 dark:text-red-200 uppercase tracking-wide">Sắp hết</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="p-5 flex flex-col flex-1 relative z-10">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2 text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={item.name}>{item.name}</h3>
                            </div>
                            <p className="text-xs font-mono font-medium text-slate-400 dark:text-slate-500 mb-4 bg-slate-100 dark:bg-slate-800 inline-block px-2 py-1 rounded self-start">SKU: {item.sku}</p>
                            
                            <div className="mt-auto pt-4 border-t border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Giá nhập</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{item.price.toLocaleString('vi-VN')}đ</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tồn kho</span>
                                    <span className={`text-xl font-bold ${item.quantity < 10 ? 'text-red-500' : 'text-blue-600 dark:text-blue-400'}`}>
                                        {item.quantity}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        )}
    </div>
  );
};