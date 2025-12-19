
import React, { useEffect, useState } from 'react';
import { dbService } from '../../services/dbService';
import { Therapist } from '../../types';
import { Plus, Trash2, User, Phone, Sparkles, X } from 'lucide-react';

export const AdminTherapists: React.FC = () => {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', specialty: '', phone: '' });

  useEffect(() => { loadTherapists(); }, []);

  const loadTherapists = () => { dbService.getTherapists().then(setTherapists); };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.specialty) return alert('필수 항목을 입력하세요.');
    await dbService.addTherapist(formData);
    setFormData({ name: '', specialty: '', phone: '' });
    setIsModalOpen(false);
    loadTherapists();
  };

  const handleDelete = async (id: string) => {
    if (confirm('테라피스트를 삭제하시겠습니까?')) {
      await dbService.deleteTherapist(id);
      loadTherapists();
    }
  };

  return (
    <div className="p-12 bg-hannam-bg min-h-screen animate-fade-in">
      <header className="max-w-6xl mx-auto flex justify-between items-end mb-16 border-b border-hannam-border pb-10">
        <div>
          <h1 className="text-2xl font-serif font-medium text-hannam-soft-black uppercase tracking-wider">Staff Management</h1>
          <p className="text-[10px] font-medium text-hannam-gold uppercase tracking-[0.4em] mt-2">Professional Wellness Experts</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary px-10 py-4 rounded-xl text-[11px] font-medium uppercase tracking-widest shadow-sm flex items-center gap-3">
          <Plus className="w-4 h-4" /> 테라피스트 추가
        </button>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {therapists.map(t => (
          <div key={t.id} className="card-minimal p-10 flex flex-col justify-between group">
             <div className="flex justify-between items-start mb-10">
                <div className="w-16 h-16 bg-hannam-gray-100 rounded-2xl flex items-center justify-center text-gray-300 group-hover:bg-hannam-dark-green group-hover:text-hannam-bg transition-all">
                   <User className="w-8 h-8" />
                </div>
                <button onClick={() => handleDelete(t.id)} className="text-gray-200 hover:text-red-400 transition-colors p-2"><Trash2 className="w-4 h-4" /></button>
             </div>
             <div>
                <h4 className="text-lg font-medium text-hannam-soft-black mb-2">{t.name}</h4>
                <div className="flex items-center gap-2 text-hannam-gold text-[11px] font-medium uppercase tracking-widest mb-6">
                   <Sparkles className="w-3.5 h-3.5" /> {t.specialty}
                </div>
                <div className="flex items-center gap-3 text-gray-400 text-[11px] font-medium num-clean">
                   <Phone className="w-4 h-4 opacity-50" /> {t.phone}
                </div>
             </div>
          </div>
        ))}
        {therapists.length === 0 && (
          <div className="col-span-3 py-40 text-center text-gray-300 font-serif text-lg border border-dashed border-hannam-border rounded-[32px] uppercase tracking-widest">
            등록된 직원이 없습니다.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-hannam-soft-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <form onSubmit={handleAdd} className="bg-hannam-bg w-full max-w-lg rounded-[40px] p-16 animate-in zoom-in-95 shadow-sm border border-hannam-border">
              <div className="flex justify-between items-center mb-12">
                 <h2 className="text-3xl font-serif font-medium text-hannam-soft-black">Staff Registry</h2>
                 <button type="button" onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-gray-300 hover:text-hannam-soft-black transition-colors" /></button>
              </div>
              <div className="space-y-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest ml-1">이름</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-5 bg-hannam-bg font-medium" placeholder="성함을 입력하세요" />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest ml-1">전문 분야 (Specialty)</label>
                    <input type="text" value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})} className="w-full p-5 bg-hannam-bg font-medium" placeholder="전문 분야를 입력하세요" />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest ml-1">연락처</label>
                    <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-5 bg-hannam-bg font-medium num-clean" placeholder="010-0000-0000" />
                 </div>
                 <button type="submit" className="w-full py-6 btn-primary rounded-2xl text-[12px] font-medium uppercase tracking-widest">등록 완료</button>
              </div>
           </form>
        </div>
      )}
    </div>
  );
};
