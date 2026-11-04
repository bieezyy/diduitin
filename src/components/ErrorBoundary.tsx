import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary menangkap error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F0F0F3] flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-[360px] bg-white border-4 border-[#121214] rounded-3xl shadow-[8px_8px_0px_#FB7185] p-6 space-y-4 text-center">
            
            <div className="w-14 h-14 mx-auto rounded-2xl border-3 border-[#121214] bg-[#FFE4E6] shadow-[3px_3px_0px_#121214] flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-rose-600 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <span className="brutal-badge text-[9px] bg-[#FB7185] text-white">
                TERJADI KENDALA
              </span>
              <h2 className="text-base font-black text-[#121214] tracking-tight">
                Oops, Ada Masalah Teknis!
              </h2>
              <p className="text-xs font-bold text-neutral-500 leading-relaxed">
                Aplikasi mendeteksi error tak terduga. Klik tombol di bawah untuk memuat ulang tampilan secara aman.
              </p>
            </div>

            <button
              type="button"
              onClick={this.handleReset}
              className="brutal-btn w-full py-3 bg-[#A3E635] text-[#121214] text-xs font-black uppercase tracking-wider gap-2 cursor-pointer shadow-[3px_3px_0px_#121214]"
            >
              <RefreshCw className="w-4 h-4 stroke-[3]" />
              Muat Ulang Aplikasi
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
