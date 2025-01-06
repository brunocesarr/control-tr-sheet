import { IoClose } from 'react-icons/io5';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, children }: ModalProps) {
  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 flex justify-center items-center transition-colors ${open ? 'visible bg-black/20' : 'invisible'}`}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-xl shadow p-6 transition-all ${open ? 'scale-100 opacity-100' : 'scale-110 opacity-0'}`}>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded-lg text-gray-500 bg-white hover:bg-gray-50 hover:text-gray-600">
          <IoClose size={24} />
        </button>

        {children}
      </div>
    </div>
  );
}
