'use client'

import React, { useState, useEffect } from 'react';
import { PlusCircle, Save, Trash2, Search, FileSpreadsheet, Glasses, Users, DollarSign, Calendar, Eye, BookOpen, Sun, StickyNote, Sparkles, X, Loader2, Layers, History, ArrowLeft, FolderDown, FileDown } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

// Database Schema Interface
interface Sale {
    id: string;
    created_at: string;
    customer_first_name: string;
    customer_last_name: string;
    customer_phone: string;
    sale_date: string;
    price: number;
    notes: string;
    distance_frame_model: string;
    distance_lens_spec: string;
    near_frame_model: string;
    near_lens_spec: string;
    progressive_frame_model: string;
    progressive_lens_brand: string;
    contact_lens_brand: string;
    contact_lens_quantity: number | null;
    contact_lens_number: string;
}

export default function OptikTakip() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

    // View Mode: 'dashboard' or 'history'
    const [viewMode, setViewMode] = useState('dashboard');

    // State definitions
    const [records, setRecords] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        customer_first_name: "",
        customer_last_name: "",
        customer_phone: "",
        distance_frame_model: "",
        distance_lens_spec: "",
        near_frame_model: "",
        near_lens_spec: "",
        progressive_frame_model: "",
        progressive_lens_brand: "",
        contact_lens_brand: "",
        contact_lens_quantity: "",
        contact_lens_number: "",
        notes: "",
        price: "",
        sale_date: new Date().toISOString().split('T')[0]
    });

    const [searchTerm, setSearchTerm] = useState("");

    // AI Modal State
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [aiContent, setAiContent] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiTitle, setAiTitle] = useState("");

    // Fetch Data from Supabase
    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        try {
            const { data, error } = await supabase
                .from('sales')
                .select('*')
                .order('sale_date', { ascending: false }); // Order by sale_date desc

            if (error) throw error;
            setRecords(data || []);
        } catch (error) {
            console.error('Error fetching sales:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle Form Change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Add New Record
    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.customer_first_name || !formData.price) return alert("Lütfen müşteri adı ve tutar giriniz.");

        const hasProduct = formData.distance_frame_model || formData.distance_lens_spec ||
            formData.near_frame_model || formData.near_lens_spec ||
            formData.progressive_frame_model || formData.progressive_lens_brand ||
            formData.contact_lens_brand;

        if (!hasProduct) {
            if (!window.confirm("Hiçbir ürün (Çerçeve, Cam veya Lens) girmediniz. Devam edilsin mi?")) return;
        }

        try {
            const { data, error } = await supabase.from('sales').insert([
                {
                    ...formData,
                    price: parseFloat(formData.price) || 0,
                    contact_lens_quantity: formData.contact_lens_quantity ? parseInt(formData.contact_lens_quantity) : null,
                },
            ]).select();

            if (error) throw error;

            if (data) {
                setRecords([data[0], ...records]);
                alert('Satış başarıyla eklendi!');
                // Reset Form
                setFormData({
                    customer_first_name: "",
                    customer_last_name: "",
                    customer_phone: "",
                    distance_frame_model: "",
                    distance_lens_spec: "",
                    near_frame_model: "",
                    near_lens_spec: "",
                    progressive_frame_model: "",
                    progressive_lens_brand: "",
                    contact_lens_brand: "",
                    contact_lens_quantity: "",
                    contact_lens_number: "",
                    notes: "",
                    price: "",
                    sale_date: new Date().toISOString().split('T')[0]
                });
            }

        } catch (error) {
            console.error('Error adding sale:', error);
            alert('Satış eklenirken bir hata oluştu.');
        }
    };

    // Delete Record
    const handleDelete = async (id: string) => {
        if (window.confirm("Bu kaydı silmek istediğinizden emin misiniz?")) {
            try {
                const { error } = await supabase.from('sales').delete().eq('id', id);
                if (error) throw error;
                setRecords(records.filter(record => record.id !== id));
            } catch (error) {
                console.error('Error deleting sale:', error);
                alert('Silme işlemi başarısız oldu.');
            }
        }
    };

    // EXCEL DOWNLOAD FUNCTION
    const downloadExcel = (dataToExport: Sale[], fileNameTitle: string) => {
        if (dataToExport.length === 0) {
            alert("Aktarılacak kayıt bulunamadı.");
            return;
        }

        let tableHTML = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <style>
        body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
        table { border-collapse: collapse; width: 100%; }
        th { background-color: #4F81BD; color: white; border: 1px solid #385D8A; padding: 10px; text-align: left; vertical-align: middle; height: 40px; }
        td { border: 1px solid #D4D4D4; padding: 8px; vertical-align: top; }
        .num { mso-number-format:"\#\,\#\#0\.00_ \;\[Red\]\-\#\,\#\#0\.00\ "; text-align: right; font-weight: bold; color: #006100; }
        .text { mso-number-format:"\@"; }
        .date { mso-number-format:"dd\.mm\.yyyy"; text-align: center; }
        tr:nth-child(even) { background-color: #F8F9FA; }
      </style>
      </head>
      <body>
      <table>
        <thead>
          <tr>
            <th>Tarih</th>
            <th>Müşteri Adı</th>
            <th>Telefon</th>
            <th>Uzak Çerçeve</th>
            <th>Uzak Cam</th>
            <th>Yakın Çerçeve</th>
            <th>Yakın Cam</th>
            <th>Progresif Çerçeve</th>
            <th>Progresif Cam</th>
            <th>Kontakt Lens</th>
            <th>Tutar (TL)</th>
            <th>Notlar</th>
          </tr>
        </thead>
        <tbody>
    `;

        dataToExport.forEach(row => {
            const lensInfo = [row.contact_lens_brand, row.contact_lens_number, row.contact_lens_quantity ? `${row.contact_lens_quantity} Adet` : ''].filter(Boolean).join(' / ');

            tableHTML += `
        <tr>
          <td class="date">${new Date(row.sale_date).toLocaleDateString('tr-TR')}</td>
          <td class="text"><b>${row.customer_first_name} ${row.customer_last_name}</b></td>
          <td class="text">${row.customer_phone || ''}</td>
          <td class="text">${row.distance_frame_model || ''}</td>
          <td class="text">${row.distance_lens_spec || ''}</td>
          <td class="text">${row.near_frame_model || ''}</td>
          <td class="text">${row.near_lens_spec || ''}</td>
          <td class="text">${row.progressive_frame_model || ''}</td>
          <td class="text">${row.progressive_lens_brand || ''}</td>
          <td class="text">${lensInfo}</td>
          <td class="num">${row.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
          <td class="text" style="font-style: italic; color: #666;">${row.notes || ''}</td>
        </tr>
      `;
        });

        tableHTML += `
        </tbody>
      </table>
      </body>
      </html>
    `;

        const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);

        const safeName = fileNameTitle.replace(/ /g, '_').toLowerCase();
        link.setAttribute("download", `optik_${safeName}.xls`);

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // --- GEMINI AI FUNCTIONS ---

    const callGemini = async (prompt: string) => {
        if (!apiKey) {
            alert("API Anahtarı bulunamadı! Lütfen .env.local dosyasına NEXT_PUBLIC_GEMINI_API_KEY ekleyin.");
            return;
        }
        setAiLoading(true);
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
        }),
                }
            );

    const data = await response.json();
    if (data.error) {
        setAiContent("Hata oluştu: " + data.error.message);
    } else {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        setAiContent(text || "Cevap alınamadı.");
    }
} catch (error) {
    setAiContent("Bağlantı hatası oluştu.");
} finally {
    setAiLoading(false);
}
    };

// 1. Shop Analysis
const handleAnalyzeShop = () => {
    setAiTitle("✨ Yapay Zeka Dükkan Analizi");
    const dataSummary = JSON.stringify(records.map(r => ({
        product: `${r.distance_frame_model} ${r.near_frame_model} ${r.progressive_frame_model} ${r.contact_lens_brand}`,
        price: r.price,
        date: r.sale_date
    })));

    const prompt = `Aşağıdaki optik mağazası satış verilerini bir işletme sahibi için Türkçe analiz et. 
    Veriler: ${dataSummary}
    
    Lütfen şu başlıkları içeren kısa ve net bir rapor yaz:
    1. 📊 Genel Durum: Toplam ciro ve satış performansı yorumu.
    2. 👓 Trendler: Hangi tür ürünler (uzak/yakın/progresif/lens) daha çok gidiyor?
    3. 💡 Tavsiye: Ciroyu artırmak için bir öneri.
    
    Samimi ve profesyonel bir dil kullan. Markdown formatında yazma, düz metin olsun.`;

    callGemini(prompt);
};

// 2. Generate Customer Message
const handleGenerateMessage = (record: Sale) => {
    setAiTitle(`✨ ${record.customer_first_name} İçin Mesaj Taslağı`);
    const productSummary = [
        record.distance_frame_model, record.distance_lens_spec,
        record.near_frame_model, record.near_lens_spec,
        record.progressive_frame_model, record.progressive_lens_brand,
        record.contact_lens_brand
    ].filter(Boolean).join(", ");

    const prompt = `Bir optik dükkanı sahibiyim. Müşterim ${record.customer_first_name} ${record.customer_last_name} şu ürünleri aldı: ${productSummary}.
    Tutar: ${record.price} TL.
    
    Lütfen bu müşteri için ürünlerinin hazır olduğunu bildiren veya satın alım için teşekkür eden, nazik, kurumsal ama sıcak bir Türkçe WhatsApp/SMS mesajı taslağı yaz. 
    Eğer müşteri Progresif gözlük aldıysa alışma süreci ile ilgili çok kısa bir moral notu da ekle.
    Mesajın sonuna dükkan adını (Örn: [Dükkan Adınız]) ekle. Sadece mesaj metnini döndür.`;

    callGemini(prompt);
};

// --- HELPER FUNCTIONS ---

// Group records by Year -> Month
const getNestedRecords = () => {
    const sortedRecords = [...records].sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime());

    const structure: any = {};

    sortedRecords.forEach(record => {
        const date = new Date(record.sale_date);
        const year = date.getFullYear();
        const month = date.toLocaleDateString('tr-TR', { month: 'long' });

        if (!structure[year]) {
            structure[year] = {
                total: 0,
                records: [],
                months: {}
            };
        }

        structure[year].total += record.price;
        structure[year].records.push(record);

        if (!structure[year].months[month]) {
            structure[year].months[month] = {
                total: 0,
                records: []
            };
        }

        structure[year].months[month].total += record.price;
        structure[year].months[month].records.push(record);
    });

    return structure;
};

const filteredRecords = records.filter(record =>
    (record.customer_first_name + ' ' + record.customer_last_name).toLocaleLowerCase('tr').includes(searchTerm.toLocaleLowerCase('tr')) ||
    record.distance_frame_model?.toLocaleLowerCase('tr').includes(searchTerm.toLocaleLowerCase('tr')) ||
    record.near_frame_model?.toLocaleLowerCase('tr').includes(searchTerm.toLocaleLowerCase('tr')) ||
    record.progressive_frame_model?.toLocaleLowerCase('tr').includes(searchTerm.toLocaleLowerCase('tr'))
);

const totalRevenue = records.reduce((acc, curr) => acc + curr.price, 0);
const nestedRecords = getNestedRecords();

return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800 relative">

        {/* AI Modal */}
        {aiModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex justify-between items-center text-white">
                        <h3 className="font-bold flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-yellow-300" />
                            {aiTitle}
                        </h3>
                        <button onClick={() => setAiModalOpen(false)} className="hover:bg-white/20 p-1 rounded transition">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-6 min-h-[200px] max-h-[60vh] overflow-y-auto">
                        {aiLoading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                                <p>Yapay zeka düşünüyor...</p>
                            </div>
                        ) : (
                            <div className="prose prose-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                {aiContent}
                            </div>
                        )}
                    </div>
                    {!aiLoading && (
                        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => { navigator.clipboard.writeText(aiContent); alert('Metin kopyalandı!'); }}
                                className="text-indigo-600 font-medium text-sm hover:underline"
                            >
                                Metni Kopyala
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Header */}
        <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
                <div className="bg-blue-600 p-3 rounded-lg">
                    <Glasses className="text-white w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Optik Müşteri Takip</h1>
                    <p className="text-slate-500 text-sm">Uzak / Yakın / Progresif Yönetim Paneli</p>
                </div>
            </div>
            <div className="flex gap-3 flex-wrap justify-center items-center">
                {viewMode === 'dashboard' ? (
                    <>
                        <button
                            onClick={handleAnalyzeShop}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition shadow-sm font-medium text-sm"
                        >
                            <Sparkles className="w-4 h-4 text-yellow-300" />
                            Dükkan Analizi
                        </button>
                        <button
                            onClick={() => downloadExcel(records, `tum_satislar_${new Date().toLocaleDateString('tr-TR')}`)}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition shadow-sm font-medium text-sm"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            Tümünü İndir
                        </button>
                        <button
                            onClick={() => setViewMode('history')}
                            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg transition shadow-sm font-medium text-sm"
                        >
                            <History className="w-4 h-4" />
                            Tüm Geçmiş
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => setViewMode('dashboard')}
                        className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg transition shadow-sm font-bold text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Ana Ekrana Dön
                    </button>
                )}
            </div>
        </header>

        {/* CONTENT AREA */}
        {viewMode === 'dashboard' ? (
            <>
                {/* Stats */}
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Toplam Ciro</p>
                            <p className="text-2xl font-bold">{totalRevenue.toLocaleString('tr-TR')} ₺</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="bg-purple-100 p-3 rounded-full text-purple-600">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Toplam Müşteri</p>
                            <p className="text-2xl font-bold">{records.length}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="bg-orange-100 p-3 rounded-full text-orange-600">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Son İşlem</p>
                            <p className="text-lg font-bold">{records.length > 0 ? new Date(records[0].sale_date).toLocaleDateString('tr-TR') : '-'}</p>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8">

                    {/* Left: New Sale Form */}
                    <div className="xl:col-span-4">
                        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 sticky top-6 max-h-[90vh] overflow-y-auto">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700">
                                <PlusCircle className="w-5 h-5 text-blue-600" />
                                Yeni Satış Ekle
                            </h2>
                            <form onSubmit={handleAdd} className="space-y-4">
                                {/* Customer Info */}
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Ad</label>
                                            <input
                                                required
                                                type="text"
                                                name="customer_first_name"
                                                value={formData.customer_first_name}
                                                onChange={handleChange}
                                                className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Soyad</label>
                                            <input
                                                required
                                                type="text"
                                                name="customer_last_name"
                                                value={formData.customer_last_name}
                                                onChange={handleChange}
                                                className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Telefon</label>
                                            <input
                                                type="tel"
                                                name="customer_phone"
                                                value={formData.customer_phone}
                                                onChange={handleChange}
                                                className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* DISTANCE GLASSES */}
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                    <h3 className="text-xs font-bold text-blue-500 uppercase mb-2 flex items-center gap-1">
                                        <Sun className="w-3 h-3" /> Uzak Gözlük
                                    </h3>
                                    <div className="space-y-2">
                                        <div>
                                            <input
                                                type="text"
                                                name="distance_frame_model"
                                                value={formData.distance_frame_model}
                                                onChange={handleChange}
                                                placeholder="Uzak Çerçeve Modeli"
                                                className="w-full p-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                name="distance_lens_spec"
                                                value={formData.distance_lens_spec}
                                                onChange={handleChange}
                                                placeholder="Uzak Cam Özellikleri"
                                                className="w-full p-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* NEAR GLASSES */}
                                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                                    <h3 className="text-xs font-bold text-orange-500 uppercase mb-2 flex items-center gap-1">
                                        <BookOpen className="w-3 h-3" /> Yakın Gözlük
                                    </h3>
                                    <div className="space-y-2">
                                        <div>
                                            <input
                                                type="text"
                                                name="near_frame_model"
                                                value={formData.near_frame_model}
                                                onChange={handleChange}
                                                placeholder="Yakın Çerçeve Modeli"
                                                className="w-full p-2 border border-orange-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                name="near_lens_spec"
                                                value={formData.near_lens_spec}
                                                onChange={handleChange}
                                                placeholder="Yakın Cam Özellikleri"
                                                className="w-full p-2 border border-orange-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* PROGRESSIVE GLASSES */}
                                <div className="bg-teal-50 p-3 rounded-lg border border-teal-100">
                                    <h3 className="text-xs font-bold text-teal-600 uppercase mb-2 flex items-center gap-1">
                                        <Layers className="w-3 h-3" /> Progresif Gözlük
                                    </h3>
                                    <div className="space-y-2">
                                        <div>
                                            <input
                                                type="text"
                                                name="progressive_frame_model"
                                                value={formData.progressive_frame_model}
                                                onChange={handleChange}
                                                placeholder="Progresif Çerçeve"
                                                className="w-full p-2 border border-teal-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                name="progressive_lens_brand"
                                                value={formData.progressive_lens_brand}
                                                onChange={handleChange}
                                                placeholder="Progresif Cam / Marka"
                                                className="w-full p-2 border border-teal-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* CONTACT LENS */}
                                <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                                    <h3 className="text-xs font-bold text-purple-600 uppercase mb-2 flex items-center gap-1">
                                        <Eye className="w-3 h-3" /> Kontakt Lens
                                    </h3>
                                    <div className="space-y-2">
                                        <div>
                                            <input
                                                type="text"
                                                name="contact_lens_brand"
                                                value={formData.contact_lens_brand}
                                                onChange={handleChange}
                                                placeholder="Marka"
                                                className="w-full p-2 border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="number"
                                                name="contact_lens_quantity"
                                                value={formData.contact_lens_quantity}
                                                onChange={handleChange}
                                                placeholder="Adet"
                                                className="w-full p-2 border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                            />
                                            <input
                                                type="text"
                                                name="contact_lens_number"
                                                value={formData.contact_lens_number}
                                                onChange={handleChange}
                                                placeholder="Numara"
                                                className="w-full p-2 border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* NOTES */}
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-1">
                                            <StickyNote className="w-3 h-3" /> Satış Notu
                                        </label>
                                        <textarea
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleChange}
                                            rows={2}
                                            placeholder="Müşteri hakkında notlar..."
                                            className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 outline-none resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Price and Date */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Tutar (TL)</label>
                                        <input
                                            required
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition font-bold text-green-700"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Tarih</label>
                                        <input
                                            required
                                            type="date"
                                            name="sale_date"
                                            value={formData.sale_date}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-sm transition flex justify-center items-center gap-2"
                                >
                                    <Save className="w-5 h-5" />
                                    Satışı Kaydet
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right: List */}
                    <div className="xl:col-span-8">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <h2 className="font-bold text-slate-700">Güncel İşlemler</h2>
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="İsim, çerçeve, cam ara..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-full focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-xs">
                                        <tr>
                                            <th className="px-4 py-3 w-24">Tarih</th>
                                            <th className="px-4 py-3 w-40">Müşteri</th>
                                            <th className="px-4 py-3">Alınan Ürünler</th>
                                            <th className="px-4 py-3 text-right w-28">Tutar</th>
                                            <th className="px-4 py-3 text-center w-24">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {loading ? (
                                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Yükleniyor...</td></tr>
                                        ) : filteredRecords.length > 0 ? (
                                            filteredRecords.map((record) => (
                                                <tr key={record.id} className="hover:bg-slate-50 transition">
                                                    <td className="px-4 py-4 whitespace-nowrap font-medium text-slate-500">
                                                        {new Date(record.sale_date).toLocaleDateString('tr-TR')}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="font-bold text-slate-800">{record.customer_first_name} {record.customer_last_name}</div>
                                                        <div className="text-xs text-slate-400">{record.customer_phone}</div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex flex-col gap-2">
                                                            {/* DISTANCE */}
                                                            {(record.distance_frame_model || record.distance_lens_spec) && (
                                                                <div className="flex items-start gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                                                                    <Sun className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                                                    <div className="flex flex-col text-xs">
                                                                        <span className="font-bold text-blue-700">UZAK</span>
                                                                        {record.distance_frame_model && <span><span className="font-medium">Çer:</span> {record.distance_frame_model}</span>}
                                                                        {record.distance_lens_spec && <span><span className="font-medium">Cam:</span> {record.distance_lens_spec}</span>}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* NEAR */}
                                                            {(record.near_frame_model || record.near_lens_spec) && (
                                                                <div className="flex items-start gap-2 bg-orange-50 px-3 py-2 rounded-lg border border-orange-100">
                                                                    <BookOpen className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                                                                    <div className="flex flex-col text-xs">
                                                                        <span className="font-bold text-orange-700">YAKIN</span>
                                                                        {record.near_frame_model && <span><span className="font-medium">Çer:</span> {record.near_frame_model}</span>}
                                                                        {record.near_lens_spec && <span><span className="font-medium">Cam:</span> {record.near_lens_spec}</span>}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* PROGRESSIVE */}
                                                            {(record.progressive_frame_model || record.progressive_lens_brand) && (
                                                                <div className="flex items-start gap-2 bg-teal-50 px-3 py-2 rounded-lg border border-teal-100">
                                                                    <Layers className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                                                                    <div className="flex flex-col text-xs">
                                                                        <span className="font-bold text-teal-700">PROGRESIF</span>
                                                                        {record.progressive_frame_model && <span><span className="font-medium">Çer:</span> {record.progressive_frame_model}</span>}
                                                                        {record.progressive_lens_brand && <span><span className="font-medium">Cam:</span> {record.progressive_lens_brand}</span>}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* LENS */}
                                                            {(record.contact_lens_brand) && (
                                                                <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded border border-purple-100 text-xs text-purple-900">
                                                                    <div className="w-4 h-4 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-bold">L</div>
                                                                    {record.contact_lens_brand} {record.contact_lens_number && `(${record.contact_lens_number})`} {record.contact_lens_quantity && `- ${record.contact_lens_quantity} Adet`}
                                                                </div>
                                                            )}

                                                            {/* NOTES */}
                                                            {record.notes && (
                                                                <div className="flex items-start gap-2 text-xs text-slate-500 italic bg-slate-50 p-1.5 rounded border border-slate-100">
                                                                    <StickyNote className="w-3 h-3 mt-0.5" />
                                                                    "{record.notes}"
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-right font-bold text-green-600">
                                                        {record.price.toLocaleString('tr-TR')} ₺
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <div className="flex justify-center gap-2">
                                                            <button
                                                                onClick={() => handleGenerateMessage(record)}
                                                                className="text-indigo-400 hover:text-indigo-600 p-2 transition rounded-full hover:bg-indigo-50"
                                                                title="✨ Müşteri Mesajı Oluştur"
                                                            >
                                                                <Sparkles className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(record.id)}
                                                                className="text-red-300 hover:text-red-600 p-2 transition rounded-full hover:bg-red-50"
                                                                title="Kaydı Sil"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                                    Aradığınız kriterlere uygun kayıt bulunamadı.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        ) : (
            // HISTORY VIEW
            <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-700 flex items-center gap-2">
                        <History className="w-6 h-6 text-slate-400" />
                        Tüm Satış Geçmişi
                    </h2>
                    <div className="text-sm text-slate-500 italic bg-slate-100 px-3 py-1 rounded-lg">
                        *Excel indirmek için yıl veya ay başlıklarındaki butonları kullanın.
                    </div>
                </div>

                {/* Years */}
                {Object.keys(nestedRecords).sort((a, b) => parseInt(b) - parseInt(a)).map(year => (
                    <div key={year} className="mb-12 border-l-4 border-slate-300 pl-4">

                        {/* Year Header */}
                        <div className="flex items-center gap-4 mb-4">
                            <h2 className="text-3xl font-bold text-slate-800">{year}</h2>
                            <button
                                onClick={() => downloadExcel(nestedRecords[year].records, `Satislar_${year}`)}
                                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                            >
                                <FolderDown className="w-4 h-4 text-yellow-400" />
                                {year} Excel İndir
                            </button>
                            <div className="text-slate-500 text-sm font-medium ml-auto">
                                Yıllık Ciro: <span className="text-slate-800 font-bold">{nestedRecords[year].total.toLocaleString('tr-TR')} ₺</span>
                            </div>
                        </div>

                        {/* Months */}
                        <div className="grid gap-6">
                            {Object.keys(nestedRecords[year].months).map(month => {
                                const monthData = nestedRecords[year].months[month];
                                return (
                                    <div key={month} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden break-inside-avoid">
                                        {/* Month Header */}
                                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-bold text-slate-700 capitalize">{month}</h3>
                                                <button
                                                    onClick={() => downloadExcel(monthData.records, `Satislar_${month}_${year}`)}
                                                    className="flex items-center gap-2 bg-white border border-green-600 text-green-700 hover:bg-green-50 px-3 py-1 rounded-md text-xs font-bold transition"
                                                    title={`${month} ayı verilerini indir`}
                                                >
                                                    <FileDown className="w-3 h-3" />
                                                    Ayı İndir
                                                </button>
                                            </div>
                                            <div className="bg-green-100 text-green-800 px-4 py-1 rounded-full font-bold text-sm border border-green-200">
                                                Toplam: {monthData.total.toLocaleString('tr-TR')} ₺
                                            </div>
                                        </div>

                                        {/* Month List */}
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm text-slate-600">
                                                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-6 py-3 w-32">Tarih</th>
                                                        <th className="px-6 py-3">Müşteri</th>
                                                        <th className="px-6 py-3">Satılanlar</th>
                                                        <th className="px-6 py-3 text-right">Tutar</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {monthData.records.map((record: Sale) => (
                                                        <tr key={record.id} className="hover:bg-slate-50">
                                                            <td className="px-6 py-3 text-slate-500">{new Date(record.sale_date).toLocaleDateString('tr-TR')}</td>
                                                            <td className="px-6 py-3 font-medium text-slate-800">{record.customer_first_name} {record.customer_last_name}</td>
                                                            <td className="px-6 py-3 text-slate-600 text-xs">
                                                                {[
                                                                    record.distance_frame_model && `Uzak Çer: ${record.distance_frame_model}`,
                                                                    record.distance_lens_spec && `Uzak Cam: ${record.distance_lens_spec}`,
                                                                    record.near_frame_model && `Yakın Çer: ${record.near_frame_model}`,
                                                                    record.near_lens_spec && `Yakın Cam: ${record.near_lens_spec}`,
                                                                    record.progressive_frame_model && `Prog. Çer: ${record.progressive_frame_model}`,
                                                                    record.progressive_lens_brand && `Prog. Cam: ${record.progressive_lens_brand}`,
                                                                    record.contact_lens_brand && `Lens: ${record.contact_lens_brand}`
                                                                ].filter(Boolean).join(" | ")}
                                                            </td>
                                                            <td className="px-6 py-3 text-right font-bold text-slate-700">
                                                                {record.price.toLocaleString('tr-TR')} ₺
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                    </div>
                ))}

                {Object.keys(nestedRecords).length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                        Henüz hiç kayıt bulunmuyor.
                    </div>
                )}
            </div>
        )}

    </div>
);
}
