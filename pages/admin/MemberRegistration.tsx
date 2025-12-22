
import React, { useState, useEffect } from 'react';
import { dbService, validateEmail } from '../../services/dbService';
import { useNavigate } from 'react-router-dom';
import { X, Lock, Mail, Phone, User as UserIcon, Award } from 'lucide-react';
import { ContractTemplate } from '../../types';

export const MemberRegistration: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    phone: '',
    gender: '여성' as any,
    email: '',
    address: '',
    adminNote: '',
    includeMembership: true,
    templateId: '',
    planName: '',
    deposit: 0,
    expiryDate: ''
  });
  
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    dbService.getTemplates().then(setTemplates);
  }, []);

  const handleRegister = async () => {
    if (!formData.name || !formData.phone || !formData.password || !formData.email) {
      return alert('모든 필수 항목(이름, 이메일, 연락처, 비밀번호)을 입력하세요.');
    }
    if (!validateEmail(formData.email)) {
      return alert('유효하지 않은 이메일 형식입니다. 다시 확인해 주세요.');
    }
    if (formData.password.length < 4) {
      return alert('보안을 위해 비밀번호는 최소 4자 이상으로 설정해 주세요.');
    }

    try {
      const newMember = await dbService.registerMember(formData);
      alert(`회원 등록이 완료되었습니다.\n전송된 안내 이메일을 확인해 주세요.\n회원번호: ${newMember.id}`);
      navigate('/admin/members');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleTemplateChange = (id: string) => {
    const tmpl = templates.find(t => t.id === id);
    setFormData({
      ...formData,
      templateId: id,
      planName: tmpl ? tmpl.title : ''
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
       <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-8 flex justify-between items-center border-b border-gray-50">
             <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">New Member Registration</h2>
                <p className="text-[10px] font-black text-[#C9B08F] uppercase tracking-widest mt-1">Registry Management</p>
             </div>
             <button onClick={() => navigate(-1)} className="text-gray-300 hover:text-black transition-colors"><X className="w-6 h-6" /></button>
          </div>
          
          <div className="p-8 max-h-[75vh] overflow-y-auto space-y-10 no-scrollbar">
             <section>
                <h4 className="flex items-center gap-3 text-xs font-black text-gray-900 mb-6 tracking-tight uppercase border-l-2 border-black pl-3">
                  Identity Information
                </h4>
                <div className="grid grid-cols-2 gap-5 mb-5">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name *</label>
                      <div className="relative">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                        <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full pl-10 pr-4 py-4 bg-[#F9F9F9] rounded-xl font-bold outline-none border border-transparent focus:border-black transition-all text-xs" placeholder="John Doe" />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number *</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                        <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full pl-10 pr-4 py-4 bg-[#F9F9F9] rounded-xl font-bold outline-none border border-transparent focus:border-black transition-all text-xs num-clean" placeholder="010-0000-0000" />
                      </div>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-5 mb-5">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address *</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                        <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full pl-10 pr-4 py-4 bg-[#F9F9F9] rounded-xl font-bold outline-none border border-transparent focus:border-black transition-all text-xs" placeholder="member@hannam.com" />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Initial Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                        <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full pl-10 pr-4 py-4 bg-[#F9F9F9] rounded-xl font-bold outline-none border border-transparent focus:border-black transition-all text-xs" placeholder="Min 4 chars" />
                      </div>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-5 mb-5">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Gender</label>
                      <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})} className="w-full px-4 py-4 bg-[#F9F9F9] rounded-xl font-bold outline-none text-xs border border-transparent focus:border-black transition-all">
                         <option>여성</option>
                         <option>남성</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Mailing Address</label>
                      <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-4 bg-[#F9F9F9] rounded-xl font-bold outline-none text-xs" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Confidential Notes</label>
                   <textarea rows={2} value={formData.adminNote} onChange={e => setFormData({...formData, adminNote: e.target.value})} className="w-full p-4 bg-[#F9F9F9] rounded-xl font-bold outline-none text-xs" placeholder="Administration only." />
                </div>
             </section>

             <section>
                <div className="flex justify-between items-center mb-6">
                   <h4 className="flex items-center gap-3 text-xs font-black text-gray-900 tracking-tight uppercase border-l-2 border-black pl-3">
                     Membership Initiation
                   </h4>
                   <div className="flex items-center gap-2">
                      <input type="checkbox" checked={formData.includeMembership} onChange={e => setFormData({...formData, includeMembership: e.target.checked})} className="w-4 h-4 rounded accent-black cursor-pointer" />
                      <span className="text-[9px] font-black text-gray-400 uppercase">Apply Credit</span>
                   </div>
                </div>
                <div className={`space-y-5 transition-opacity ${formData.includeMembership ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                   <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Membership Plan</label>
                         <div className="relative">
                            <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                            <select 
                              value={formData.templateId} 
                              onChange={e => handleTemplateChange(e.target.value)}
                              className="w-full pl-10 pr-4 py-4 bg-[#F9F9F9] rounded-xl font-bold outline-none text-xs border border-transparent focus:border-black transition-all"
                            >
                               <option value="">회원권 선택 안함</option>
                               {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                            </select>
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Deposit Amount (KRW)</label>
                         <input type="number" value={formData.deposit} onChange={e => setFormData({...formData, deposit: Number(e.target.value)})} className="w-full px-4 py-4 border border-gray-100 rounded-xl font-black text-xs num-clean" />
                      </div>
                   </div>
                </div>
             </section>
          </div>

          <div className="p-8 bg-[#FBFBFB] border-t border-gray-50 flex justify-end gap-4">
             <button onClick={() => navigate(-1)} className="px-8 py-4 text-[10px] font-black text-gray-400 hover:text-black uppercase tracking-widest transition-all">Discard</button>
             <button onClick={handleRegister} className="px-10 py-4 bg-[#1a1a1a] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-lg transition-all active:scale-95">Complete Registration</button>
          </div>
       </div>
    </div>
  );
};
