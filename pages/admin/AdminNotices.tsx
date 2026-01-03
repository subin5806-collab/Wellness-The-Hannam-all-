
import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../../services/dbService';
import { Notice } from '../../types';
import { Megaphone, Plus, X, Eye, Trash2, CheckCircle2, AlertCircle, ImageIcon, Upload } from 'lucide-react';

export const AdminNotices: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    imageUrl: '',
    isPopup: false,
    isActive: true
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadNotices(); }, []);

  const loadNotices = async () => {
    const list = await dbService.getNotices(false);
    setNotices(list);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) return alert('10MB 이하의 이미지만 업로드 가능합니다.');
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return alert('제목과 내용을 입력해 주세요.');
    setIsProcessing(true);
    try {
      await dbService.saveNotice(formData);
      setIsModalOpen(false);
      setFormData({ title: '', content: '', imageUrl: '', isPopup: false, isActive: true });
      loadNotices();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    await dbService.updateNotice(id, { isActive: !current });
    loadNotices();
  };

  const handleDelete = async (id: string) => {
    if (confirm('공지사항을 삭제하시겠습니까?')) {
      await dbService.deleteNotice(id);
      loadNotices();
    }
  };

  return (
    <div className="p-10 bg-hannam-bg min-h-screen font-sans animate-smooth-fade">
      <div className="max-w-7xl mx-auto space-y-10">
        <header className="flex justify-between items-end border-b border-hannam-border pb-10">
          <div>
            <h1 className="text-3xl font-serif font-bold text-hannam-green tracking-tight uppercase">Center Notices</h1>
            <p className="text-[11px] font-black text-hannam-gold uppercase tracking-[0.3em] mt-2">공식 공지 및 프로모션 관리</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-hannam-green text-white px-10 py-4 rounded-xl text-[12px] font-bold flex items-center gap-2.5 transition-all hover:bg-black active:scale-95"
          >
            <Plus className="w-4 h-4" /> 신규 공지 등록
          </button>
        </header>

        <div className="bg-white border border-hannam-border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-hannam-bg/40 text-[10px] font-bold text-hannam-muted uppercase border-b border-hannam-border">
                <th className="px-8 py-5">공지 정보</th>
                <th className="px-8 py-5">미디어</th>
                <th className="px-8 py-5">유형</th>
                <th className="px-8 py-5">게시 상태</th>
                <th className="px-8 py-5 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hannam-border">
              {notices.map(n => (
                <tr key={n.id} className="hover:bg-hannam-bg/20 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <p className="text-[15px] font-bold text-hannam-text">{n.title}</p>
                      <p className="text-[10px] text-hannam-muted font-bold mt-1 num-data">{n.createdAt.split('T')[0]}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {n.imageUrl ? (
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-hannam-border">
                        <img src={n.imageUrl} alt="notice" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-hannam-bg flex items-center justify-center text-gray-200">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${n.isPopup ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                      {n.isPopup ? 'Popup' : 'Standard'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <button 
                      onClick={() => handleToggleActive(n.id, n.isActive)}
                      className={`flex items-center gap-2 text-[11px] font-bold ${n.isActive ? 'text-green-600' : 'text-gray-300'}`}
                    >
                      {n.isActive ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {n.isActive ? '게시 중' : '비활성'}
                    </button>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button onClick={() => handleDelete(n.id)} className="p-2 text-hannam-muted hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {notices.length === 0 && (
            <div className="py-32 text-center">
              <Megaphone className="w-12 h-12 text-hannam-border mx-auto mb-4 opacity-40" />
              <p className="text-sm text-hannam-muted font-bold italic">등록된 공지사항이 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="bg-white w-full max-w-2xl rounded-[32px] p-10 border border-hannam-border shadow-2xl animate-smooth-fade flex flex-col gap-8">
            <div className="flex justify-between items-center border-b border-hannam-border pb-6">
              <h2 className="text-2xl font-serif font-bold text-hannam-green uppercase">Create Notice</h2>
              <button type="button" onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-gray-300 hover:text-black" /></button>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-hannam-muted uppercase tracking-widest ml-1">제목 *</label>
                  <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-4 bg-hannam-bg/50 border border-hannam-border rounded-xl font-bold text-sm outline-none focus:bg-white focus:border-hannam-gold transition-all" placeholder="공지 제목을 입력하세요" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-hannam-muted uppercase tracking-widest ml-1">내용 *</label>
                  <textarea required rows={6} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full p-4 bg-hannam-bg/50 border border-hannam-border rounded-xl font-medium text-sm outline-none focus:bg-white focus:border-hannam-gold transition-all no-scrollbar" placeholder="상세 내용을 입력하세요" />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-hannam-muted uppercase tracking-widest ml-1">공지 이미지 (선택)</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-square bg-hannam-bg/50 border-2 border-dashed border-hannam-border rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-hannam-gold transition-all relative overflow-hidden group"
                  >
                    {formData.imageUrl ? (
                      <>
                        <img src={formData.imageUrl} alt="preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Upload className="text-white w-8 h-8" />
                        </div>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-10 h-10 text-hannam-border mb-3" />
                        <p className="text-[10px] text-hannam-muted font-bold uppercase">Click to upload photo</p>
                      </>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-hannam-border">
              <label className="flex items-center gap-3 p-4 bg-hannam-bg/30 rounded-xl cursor-pointer">
                <input type="checkbox" checked={formData.isPopup} onChange={e => setFormData({...formData, isPopup: e.target.checked})} className="w-4 h-4 accent-hannam-green" />
                <span className="text-[11px] font-bold text-hannam-text uppercase tracking-widest">팝업 등록</span>
              </label>
              <button disabled={isProcessing} className="py-4 bg-hannam-green text-white rounded-xl text-[12px] font-black uppercase tracking-[0.2em] shadow-lg hover:bg-black transition-all">
                {isProcessing ? '처리 중...' : '공지 게시하기'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
