
import React, { useState } from 'react';
import { dbService } from '../../services/dbService';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

export const MemberRegistration: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    gender: '여성' as any,
    email: '',
    address: '',
    adminNote: '',
    includeMembership: true,
    planName: '',
    deposit: 0,
    expiryDate: ''
  });
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!formData.name || !formData.phone) return alert('필수 항목을 입력하세요.');
    await dbService.registerMember(formData);
    alert('회원이 등록되었습니다.');
    navigate('/admin');
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
       <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-10 flex justify-between items-center border-b border-gray-50">
             <h2 className="text-3xl font-black text-gray-900 tracking-tight">New Member Registration</h2>
             <button onClick={() => navigate(-1)} className="text-gray-300 hover:text-black transition-colors"><X className="w-8 h-8" /></button>
          </div>
          
          <div className="p-10 max-h-[70vh] overflow-y-auto space-y-12">
             <section>
                <h4 className="flex items-center gap-3 text-sm font-black text-gray-900 mb-8 tracking-tight">
                  <div className="w-2 h-2 bg-black rounded-full" /> Basic Information
                </h4>
                <div className="grid grid-cols-2 gap-8 mb-8">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Name *</label>
                      <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-5 bg-[#F9F9F9] rounded-2xl font-bold outline-none border border-transparent focus:border-black transition-all" />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone *</label>
                      <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-5 bg-[#F9F9F9] rounded-2xl font-bold outline-none border border-transparent focus:border-black transition-all" />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-8 mb-8">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Gender</label>
                      <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})} className="w-full p-5 bg-[#F9F9F9] rounded-2xl font-bold outline-none">
                         <option>여성</option>
                         <option>남성</option>
                      </select>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                      <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-5 bg-[#F9F9F9] rounded-2xl font-bold outline-none" />
                   </div>
                </div>
                <div className="space-y-3 mb-8">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Address</label>
                   <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-5 bg-[#F9F9F9] rounded-2xl font-bold outline-none" />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Notes</label>
                   <textarea rows={3} value={formData.adminNote} onChange={e => setFormData({...formData, adminNote: e.target.value})} className="w-full p-5 bg-[#F9F9F9] rounded-2xl font-bold outline-none" />
                </div>
             </section>

             <section>
                <div className="flex justify-between items-center mb-8">
                   <h4 className="flex items-center gap-3 text-sm font-black text-gray-900 tracking-tight">
                     <div className="w-2 h-2 bg-black rounded-full" /> Membership Plan
                   </h4>
                   <div className="flex items-center gap-3">
                      <input type="checkbox" checked={formData.includeMembership} onChange={e => setFormData({...formData, includeMembership: e.target.checked})} className="w-5 h-5 rounded-md accent-black" />
                      <span className="text-xs font-bold text-gray-400">Include Membership</span>
                   </div>
                </div>
                <div className="space-y-6 opacity-100 transition-opacity">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Plan Name</label>
                      <input type="text" placeholder="e.g. VIP Annual" value={formData.planName} onChange={e => setFormData({...formData, planName: e.target.value})} className="w-full p-5 border border-gray-100 rounded-2xl font-bold outline-none" />
                   </div>
                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Total Amount (KRW)</label>
                         <input type="number" value={formData.deposit} onChange={e => setFormData({...formData, deposit: Number(e.target.value)})} className="w-full p-5 border border-gray-100 rounded-2xl font-bold outline-none" />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Expiry Date</label>
                         <input type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="w-full p-5 border border-gray-100 rounded-2xl font-bold outline-none" />
                      </div>
                   </div>
                </div>
             </section>
          </div>

          <div className="p-10 bg-[#FBFBFB] border-t border-gray-50 flex justify-end gap-6">
             <button onClick={() => navigate(-1)} className="px-10 py-4 text-sm font-black text-gray-400 hover:text-black uppercase tracking-widest transition-all">Cancel</button>
             <button onClick={handleRegister} className="px-12 py-5 bg-[#1a1a1a] text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-black shadow-2xl transition-all active:scale-95">Register Member</button>
          </div>
       </div>
    </div>
  );
};
