import React, { useState, useEffect } from 'react';
import { X, User, Camera, Sparkles, Check, Edit2 } from 'lucide-react';
import { compressReceiptImage } from '../utils/imageCompressor';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenOnboarding: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenOnboarding
}) => {
  const [avatarImg, setAvatarImg] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [userBio, setUserBio] = useState<string>('');
  const [customDescription, setCustomDescription] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isProcessingImg, setIsProcessingImg] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const savedAvatar = localStorage.getItem('diduitin_profile_avatar');
      const savedName = localStorage.getItem('diduitin_profile_name');
      const savedRole = localStorage.getItem('diduitin_profile_role');
      const savedBio = localStorage.getItem('diduitin_profile_bio');
      const savedDesc = localStorage.getItem('diduitin_profile_desc');

      if (savedAvatar) setAvatarImg(savedAvatar);
      if (savedName) setUserName(savedName);
      if (savedRole) setUserRole(savedRole);
      if (savedBio) setUserBio(savedBio);
      if (savedDesc) setCustomDescription(savedDesc);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingImg(true);
      // Kompres dan ubah jadi base64
      const compressed = await compressReceiptImage(file);
      setAvatarImg(compressed);
      localStorage.setItem('diduitin_profile_avatar', compressed);
    } catch (err) {
      console.error(err);
      // Fallback pembacaan standar jika format svg atau gambar kecil
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatarImg(reader.result);
          localStorage.setItem('diduitin_profile_avatar', reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessingImg(false);
    }
  };

  const handleSaveProfile = () => {
    localStorage.setItem('diduitin_profile_name', userName);
    localStorage.setItem('diduitin_profile_role', userRole);
    localStorage.setItem('diduitin_profile_bio', userBio);
    localStorage.setItem('diduitin_profile_desc', customDescription);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white border-3 border-[#121214] rounded-2xl shadow-[8px_8px_0px_#121214] p-5 space-y-4 relative max-h-[92vh] overflow-y-auto">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#121214]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#38BDF8] border-2 border-[#121214] flex items-center justify-center">
              <User className="w-4 h-4 text-[#121214]" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-[#121214]">
                Profil
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (isEditing) handleSaveProfile();
                else setIsEditing(true);
              }}
              className="p-1 px-2.5 rounded-lg border-2 border-[#121214] bg-[#A3E635] text-[11px] font-black uppercase flex items-center gap-1 hover:bg-[#86efac] cursor-pointer"
            >
              {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit2 className="w-3 h-3" />}
              <span>{isEditing ? 'Simpan' : 'Edit'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg border-2 border-[#121214] hover:bg-neutral-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Profile Card Info */}
        <div className="p-4 bg-gradient-to-br from-[#FEF08A] to-[#FDE047] border-2 border-[#121214] rounded-xl shadow-[3px_3px_0px_#121214] text-center space-y-2">
          {/* Foto Profil dengan Upload Button */}
          <div className="relative w-20 h-20 mx-auto">
            {avatarImg ? (
              <img
                src={avatarImg}
                alt="Foto Profil"
                className="w-20 h-20 rounded-full border-3 border-[#121214] object-cover shadow-[2px_2px_0px_#121214] bg-white"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#121214] border-3 border-white mx-auto flex items-center justify-center text-white text-3xl font-black shadow-[2px_2px_0px_#121214]">
                {userName ? userName.charAt(0).toUpperCase() : <User className="w-8 h-8 text-neutral-400" />}
              </div>
            )}
            <label
              className="absolute bottom-0 right-0 p-1.5 bg-[#A3E635] border-2 border-[#121214] rounded-full text-black hover:bg-[#86efac] cursor-pointer shadow-[1.5px_1.5px_0px_#121214]"
              title="Ganti Foto Profil (JPG, JPEG, PNG, SVG, WEBP)"
            >
              <Camera className="w-3.5 h-3.5" />
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
                onChange={handleImageUpload}
                disabled={isProcessingImg}
                className="hidden"
              />
            </label>
          </div>

          <div>
            {isEditing ? (
              <div className="space-y-1">
                <input
                  type="text"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  className="brutal-input w-full text-center py-1 text-sm font-black"
                  placeholder="Nama Profil"
                />
                <input
                  type="text"
                  value={userRole}
                  onChange={e => setUserRole(e.target.value)}
                  className="brutal-input w-full text-center py-0.5 text-xs font-bold"
                  placeholder="Status / Role"
                />
              </div>
            ) : (
              <>
                <h3 className="text-base font-black text-[#121214]">
                  {userName || 'Nama Belum Diisi'}
                </h3>
                {userRole && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white border border-[#121214] inline-block mt-0.5">
                    {userRole}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Bio Profile Editable */}
          {isEditing ? (
            <textarea
              value={userBio}
              onChange={e => setUserBio(e.target.value)}
              rows={2}
              className="brutal-input w-full text-xs font-bold text-neutral-800 leading-snug p-2 bg-white"
              placeholder="Tuliskan bio profil Anda..."
            />
          ) : (
            <p className="text-xs font-bold text-neutral-800 leading-snug bg-white/70 p-2 rounded-lg border border-[#121214]">
              {userBio || 'Belum ada bio. Klik Edit untuk mengisi bio profil.'}
            </p>
          )}
        </div>

        {/* Deskripsi Tambahan yang bisa dituliskan oleh user */}
        <div className="p-3 bg-neutral-50 border-2 border-[#121214] rounded-xl space-y-1.5 text-xs">
          <div className="flex items-center justify-between font-black">
            <span className="text-neutral-500 uppercase text-[10px]">Deskripsi Tambahan:</span>
            {isEditing && <span className="text-[9px] text-emerald-700 font-bold">Bisa diedit</span>}
          </div>
          {isEditing ? (
            <textarea
              value={customDescription}
              onChange={e => setCustomDescription(e.target.value)}
              rows={3}
              className="brutal-input w-full text-xs font-semibold p-2 bg-white"
              placeholder="Tuliskan deskripsi profil atau catatan khusus Anda di sini..."
            />
          ) : (
            <p className="font-semibold text-neutral-700 whitespace-pre-wrap leading-relaxed">
              {customDescription || 'Belum ada deskripsi tambahan.'}
            </p>
          )}
        </div>

        {/* Action Button: Buka Panduan / Onboarding */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenOnboarding();
          }}
          className="brutal-btn w-full py-2.5 bg-[#A3E635] text-[#121214] text-xs font-black uppercase tracking-wider gap-1.5 cursor-pointer shadow-[2px_2px_0px_#121214]"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-800" />
          Lihat Pengenalan Aplikasi
        </button>

      </div>
    </div>
  );
};
