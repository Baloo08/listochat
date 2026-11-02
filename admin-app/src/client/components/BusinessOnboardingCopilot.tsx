import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  Mic,
  MicOff,
  Radio,
  Paperclip,
  Upload,
  X,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Store,
  Calendar,
  Award,
  FileText,
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  Loader2,
  Trophy
} from 'lucide-react';
import { useAdminApi } from '../useAdminApi';

interface CatalogItem {
  id?: string;
  name: string;
  price: number;
  category?: string;
  description?: string;
  imageUrl?: string;
}

interface FiscalData {
  idType: string;
  idNumber: string;
  legalName: string;
  email: string;
}

interface BusinessModules {
  store: boolean;
  bookings: boolean;
  courts: boolean;
  loyalty: boolean;
  billing: boolean;
}

interface BusinessProfile {
  name: string;
  slug: string;
  whatsappNumber: string;
  plan: string;
  logoUrl?: string;
  bannerUrl?: string;
  niche?: string;
  modules: BusinessModules;
  fiscal: FiscalData;
  catalogItems: CatalogItem[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  files?: Array<{ name: string; mimeType: string; badgeLabel?: string }>;
}

interface PendingFile {
  name: string;
  mimeType: string;
  data: string; // base64
  size: number;
  badgeLabel: string;
}

interface BusinessOnboardingCopilotProps {
  onNavigateToTenants?: () => void;
}

const INITIAL_PROFILE: BusinessProfile = {
  name: '',
  slug: '',
  whatsappNumber: '',
  plan: 'starter',
  modules: {
    store: true,
    bookings: false,
    courts: false,
    loyalty: false,
    billing: false
  },
  fiscal: {
    idType: '01',
    idNumber: '',
    legalName: '',
    email: ''
  },
  catalogItems: []
};

const SUGGESTIONS = [
  'Restaurante italiano con menú de pastas y pizzas artesanales',
  'Barbería ejecutiva con reservas y servicios de corte y barba',
  'Club de pádel y canchas deportivas con reserva de turnos',
  'Cafetería gourmet con tienda en línea y club de fidelización'
];

export default function BusinessOnboardingCopilot({ onNavigateToTenants }: BusinessOnboardingCopilotProps) {
  const api = useAdminApi();

  // Estado del perfil acumulado
  const [profile, setProfile] = useState<BusinessProfile>(INITIAL_PROFILE);

  // Estado del chat
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: '¡Hola! Soy tu Copilot de Onboarding y Configuración de Negocios en Betico Ops. Puedo ayudarte a montar el perfil comercial completo de forma automática:\n\n• Sube fotos de logotipos o banners y los colocaré en su lugar.\n• Sube listas de precios o menús en Excel, CSV o PDF y extraeré el catálogo con precios en colones.\n• Sube constancias de situación tributaria de Hacienda Costa Rica para extraer la cédula y razón social.\n• También puedes dictarme o enviarme notas de voz con los detalles del cliente.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Modales y retroalimentación
  const [successResult, setSuccessResult] = useState<any | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');

  // Controles de Voz: 1. Dictado en tiempo real (Web Speech API)
  const [isSpeechListening, setIsSpeechListening] = useState(false);
  const speechRecognitionRef = useRef<any>(null);

  // Controles de Voz: 2. Grabadora de audio tipo WhatsApp (MediaRecorder)
  const [isAudioRecording, setIsAudioRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Scroll automático al recibir nuevos mensajes
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Inicializar Web Speech API si el navegador lo soporta
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-CR';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = () => {
        setIsSpeechListening(false);
      };

      recognition.onend = () => {
        setIsSpeechListening(false);
      };

      speechRecognitionRef.current = recognition;
    }
  }, []);

  // Alternar dictado por voz (Web Speech API)
  const toggleSpeechRecognition = () => {
    if (!speechRecognitionRef.current) {
      alert('Tu navegador no soporta la API de reconocimiento de voz. Por favor usa la grabadora de nota de audio o escribe en el chat.');
      return;
    }

    if (isSpeechListening) {
      speechRecognitionRef.current.stop();
      setIsSpeechListening(false);
    } else {
      try {
        speechRecognitionRef.current.start();
        setIsSpeechListening(true);
      } catch (e) {
        setIsSpeechListening(false);
      }
    }
  };

  // Iniciar grabadora de notas de voz tipo WhatsApp
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        clearInterval(timerIntervalRef.current);
        setRecordingSeconds(0);
        setIsAudioRecording(false);
      };

      mediaRecorder.start();
      setIsAudioRecording(true);
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      alert('No se pudo acceder al micrófono para grabar la nota de voz: ' + err.message);
    }
  };

  // Detener y enviar la nota de voz grabada
  const stopAndSendAudioRecording = async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;

    mediaRecorderRef.current.addEventListener(
      'stop',
      async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Data = (reader.result as string) || '';
          const voiceFile: PendingFile = {
            name: `Nota_de_Voz_${new Date().toISOString().slice(11, 19).replace(/:/g, '-')}.webm`,
            mimeType: 'audio/webm',
            data: base64Data,
            size: audioBlob.size,
            badgeLabel: 'AUDIO'
          };
          await handleSendProcess('Nota de voz enviada desde el micrófono', [voiceFile]);
        };
        reader.readAsDataURL(audioBlob);
      },
      { once: true }
    );

    mediaRecorderRef.current.stop();
  };

  // Cancelar la grabacion de audio sin enviar
  const cancelAudioRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      audioChunksRef.current = [];
      mediaRecorderRef.current.stop();
    }
  };

  // Clasificador de MIME type para badges en UI
  const getBadgeLabel = (mime: string, name: string): string => {
    const lowerName = name.toLowerCase();
    if (mime.includes('png') || lowerName.endsWith('.png')) return 'PNG';
    if (mime.includes('jpeg') || mime.includes('jpg') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) return 'JPEG';
    if (mime.includes('webp') || lowerName.endsWith('.webp')) return 'WEBP';
    if (mime.includes('pdf') || lowerName.endsWith('.pdf')) return 'PDF';
    if (mime.includes('csv') || lowerName.endsWith('.csv')) return 'CSV';
    if (mime.includes('spreadsheet') || mime.includes('excel') || lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) return 'XLSX';
    if (mime.startsWith('audio/') || lowerName.endsWith('.webm') || lowerName.endsWith('.mp3') || lowerName.endsWith('.wav')) return 'AUDIO';
    return 'ARCHIVO';
  };

  // Carga de archivos seleccionados o arrastrados
  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = (e.target?.result as string) || '';
        const badge = getBadgeLabel(file.type, file.name);
        setPendingFiles((prev) => [
          ...prev,
          {
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            data: base64,
            size: file.size,
            badgeLabel: badge
          }
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Enviar mensaje al backend Copilot (/api/copilot/process)
  const handleSendProcess = async (overrideMessage?: string, additionalFiles?: PendingFile[]) => {
    const textToSend = overrideMessage !== undefined ? overrideMessage : inputText;
    const filesToSend = additionalFiles || pendingFiles;

    if (!textToSend.trim() && filesToSend.length === 0) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      files: filesToSend.map((f) => ({ name: f.name, mimeType: f.mimeType, badgeLabel: f.badgeLabel }))
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setPendingFiles([]);
    setIsProcessing(true);

    try {
      const payload = {
        message: textToSend,
        currentProfile: profile,
        files: filesToSend.map((f) => ({
          name: f.name,
          mimeType: f.mimeType,
          data: f.data
        }))
      };

      const res = await api.post('/api/copilot/process', payload);

      if (res && res.profileDelta) {
        setProfile((prev) => {
          const delta = res.profileDelta;
          return {
            ...prev,
            name: delta.name || prev.name,
            slug: delta.slug || prev.slug || (delta.name ? delta.name.toLowerCase().replace(/[^a-z0-9]/g, '-') : prev.slug),
            whatsappNumber: delta.whatsappNumber || prev.whatsappNumber,
            plan: delta.plan || prev.plan,
            logoUrl: delta.logoUrl || prev.logoUrl,
            bannerUrl: delta.bannerUrl || prev.bannerUrl,
            niche: delta.niche || prev.niche,
            modules: {
              ...prev.modules,
              ...(delta.modules || {})
            },
            fiscal: {
              ...prev.fiscal,
              ...(delta.fiscal || {})
            },
            catalogItems: delta.catalogItems && delta.catalogItems.length > 0 ? delta.catalogItems : prev.catalogItems
          };
        });
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: res?.assistantMessage || 'He procesado tu solicitud y actualizado el perfil comercial.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'assistant',
        text: 'Ocurrió un error al procesar la información: ' + (err.message || 'Error de conexión'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirmar y crear el comercio en PostgreSQL (/api/copilot/finalize)
  const handleFinalize = async () => {
    if (!profile.name.trim()) {
      alert('Por favor indica al menos el nombre comercial del negocio antes de crearlo.');
      return;
    }

    setIsFinalizing(true);
    try {
      const res = await api.post('/api/copilot/finalize', {
        name: profile.name,
        slug: profile.slug || profile.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        plan: profile.plan,
        adminEmail: profile.fiscal.email || undefined,
        whatsappNumber: profile.whatsappNumber,
        logoUrl: profile.logoUrl,
        bannerUrl: profile.bannerUrl,
        modules: profile.modules,
        fiscal: profile.fiscal,
        catalogItems: profile.catalogItems
      });

      setSuccessResult(res);
    } catch (err: any) {
      alert('Error al crear el comercio: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsFinalizing(false);
    }
  };

  // Reiniciar estado
  const handleReset = () => {
    if (confirm('¿Deseas reiniciar el asistente y limpiar el borrador actual?')) {
      setProfile(INITIAL_PROFILE);
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          sender: 'assistant',
          text: 'Asistente reiniciado. Cuéntame sobre el nuevo cliente o sube sus archivos para comenzar de nuevo.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setPendingFiles([]);
      setSuccessResult(null);
    }
  };

  // Agregar elemento manual al catálogo
  const handleAddManualCatalogItem = () => {
    if (!newItemName.trim() || !newItemPrice.trim()) return;
    const priceNum = parseFloat(newItemPrice.replace(/[^\d.]/g, '')) || 0;
    setProfile((prev) => ({
      ...prev,
      catalogItems: [
        ...prev.catalogItems,
        {
          name: newItemName.trim(),
          price: priceNum,
          category: newItemCategory.trim() || 'General'
        }
      ]
    }));
    setNewItemName('');
    setNewItemPrice('');
    setNewItemCategory('');
  };

  // Eliminar elemento del catálogo
  const handleRemoveCatalogItem = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      catalogItems: prev.catalogItems.filter((_, i) => i !== index)
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 3000);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto', color: '#FAF8F5' }}>
      {/* Header del Copilot */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid #1a3e40'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: '#0B3C3D',
            border: '1px solid #34D399',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#34D399',
            boxShadow: '0 4px 12px rgba(52, 211, 153, 0.2)'
          }}>
            <Sparkles size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#FAF8F5' }}>
              Copilot de Onboarding Betico
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Asistente conversacional multimodal para alta y configuración integral de clientes en Betico Ops
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#123032',
              border: '1px solid #234b4e',
              borderRadius: '8px',
              color: '#94a3b8',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={15} />
            Reiniciar Asistente
          </button>

          {onNavigateToTenants && (
            <button
              onClick={onNavigateToTenants}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                backgroundColor: '#0f2426',
                border: '1px solid #1a3e40',
                borderRadius: '8px',
                color: '#FAF8F5',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <Building2 size={15} />
              Ver Negocios
            </button>
          )}
        </div>
      </div>

      {/* Grid Principal Dividido (Split View) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(420px, 1.15fr) minmax(420px, 1fr)',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* COLUMNA IZQUIERDA: Chat Conversacional Multimodal */}
        <div style={{
          backgroundColor: '#0a1a1c',
          border: '1px solid #1a3e40',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 180px)',
          minHeight: '680px',
          overflow: 'hidden'
        }}>
          {/* Barra Superior del Chat */}
          <div style={{
            padding: '14px 18px',
            backgroundColor: '#0f2426',
            borderBottom: '1px solid #1a3e40',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#34D399',
                boxShadow: '0 0 8px #34D399'
              }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FAF8F5' }}>
                Canal Multimodal (Voz, Texto y Documentos)
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              MIME Auto-Detect Activo
            </span>
          </div>

          {/* Chips de Sugerencias Rapidas */}
          <div style={{
            padding: '10px 16px',
            backgroundColor: '#071213',
            borderBottom: '1px solid #142e30',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}>
            {SUGGESTIONS.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => setInputText(sug)}
                style={{
                  padding: '5px 12px',
                  backgroundColor: '#0f2426',
                  border: '1px solid #1a3e40',
                  borderRadius: '20px',
                  color: '#34D399',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.2s'
                }}
              >
                + {sug}
              </button>
            ))}
          </div>

          {/* Historial de Mensajes */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '88%',
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  padding: '12px 16px',
                  borderRadius: msg.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  backgroundColor: msg.sender === 'user' ? '#0B3C3D' : '#0f2426',
                  border: msg.sender === 'user' ? '1px solid #34D399' : '1px solid #1a3e40',
                  color: '#FAF8F5',
                  fontSize: '0.85rem',
                  lineHeight: '1.45',
                  whiteSpace: 'pre-wrap',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}>
                  {msg.text}

                  {/* Archivos adjuntos en el mensaje */}
                  {msg.files && msg.files.length > 0 && (
                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {msg.files.map((file, i) => (
                        <span
                          key={i}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: 'rgba(52, 211, 153, 0.15)',
                            border: '1px solid #34D399',
                            color: '#34D399',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700
                          }}
                        >
                          [{file.badgeLabel || 'ARCHIVO'}] {file.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', padding: '0 4px' }}>
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {isProcessing && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                backgroundColor: '#0f2426',
                border: '1px solid #1a3e40',
                borderRadius: '12px',
                color: '#34D399',
                fontSize: '0.8rem',
                alignSelf: 'flex-start'
              }}>
                <Loader2 size={16} className="animate-spin" />
                Copilot analizando multimodalmente...
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Area de Archivos Pendientes (Pre-envio) */}
          {pendingFiles.length > 0 && (
            <div style={{
              padding: '8px 16px',
              backgroundColor: '#0c1e20',
              borderTop: '1px solid #1a3e40',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              {pendingFiles.map((file, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    backgroundColor: '#123032',
                    border: '1px solid #234b4e',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    color: '#FAF8F5'
                  }}
                >
                  <span style={{
                    padding: '2px 5px',
                    backgroundColor: '#0B3C3D',
                    color: '#34D399',
                    borderRadius: '4px',
                    fontWeight: 700,
                    fontSize: '0.65rem'
                  }}>
                    {file.badgeLabel}
                  </span>
                  <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </span>
                  <button
                    onClick={() => setPendingFiles((prev) => prev.filter((_, i) => i !== idx))}
                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Grabadora de Audio en Vivo (Modo WhatsApp) */}
          {isAudioRecording && (
            <div style={{
              padding: '12px 18px',
              backgroundColor: 'rgba(181, 28, 18, 0.15)',
              borderTop: '1px solid rgba(181, 28, 18, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  animation: 'pulse 1.2s infinite'
                }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fca5a5' }}>
                  Grabando nota de voz tipo WhatsApp ({Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')})
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={cancelAudioRecording}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 10px',
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    color: '#9ca3af',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={13} />
                  Cancelar
                </button>
                <button
                  onClick={stopAndSendAudioRecording}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    backgroundColor: '#0B3C3D',
                    border: '1px solid #34D399',
                    borderRadius: '6px',
                    color: '#34D399',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Send size={13} />
                  Detener y Enviar
                </button>
              </div>
            </div>
          )}

          {/* Area de Entrada y Botones de Accion */}
          <div style={{
            padding: '14px 18px',
            backgroundColor: '#0f2426',
            borderTop: '1px solid #1a3e40'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
              {/* Input oculto de archivos */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp,application/pdf,text/csv,.xlsx,.xls,audio/*"
                onChange={(e) => handleFilesSelected(e.target.files)}
                style={{ display: 'none' }}
              />

              {/* Boton Subir Archivos */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Adjuntar imágenes, logos, PDF de Hacienda, listas en Excel o notas de audio"
                style={{
                  padding: '10px',
                  backgroundColor: '#123032',
                  border: '1px solid #234b4e',
                  borderRadius: '10px',
                  color: '#FAF8F5',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <Paperclip size={18} />
              </button>

              {/* Boton Dictado por Voz (Web Speech API) */}
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                title={isSpeechListening ? 'Detener dictado por voz' : 'Dictar por voz en tiempo real'}
                style={{
                  padding: '10px',
                  backgroundColor: isSpeechListening ? '#0B3C3D' : '#123032',
                  border: isSpeechListening ? '1px solid #34D399' : '1px solid #234b4e',
                  borderRadius: '10px',
                  color: isSpeechListening ? '#34D399' : '#FAF8F5',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  boxShadow: isSpeechListening ? '0 0 10px rgba(52, 211, 153, 0.4)' : 'none'
                }}
              >
                {isSpeechListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              {/* Boton Grabar Nota de Audio (WhatsApp Style) */}
              {!isAudioRecording && (
                <button
                  type="button"
                  onClick={startAudioRecording}
                  title="Grabar nota de audio tipo WhatsApp"
                  style={{
                    padding: '10px',
                    backgroundColor: '#123032',
                    border: '1px solid #234b4e',
                    borderRadius: '10px',
                    color: '#FAF8F5',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Radio size={18} />
                </button>
              )}

              {/* Input de Texto */}
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendProcess();
                  }
                }}
                placeholder="Escribe instrucciones, pega datos o arrastra archivos..."
                rows={2}
                style={{
                  flex: 1,
                  backgroundColor: '#071213',
                  border: '1px solid #1a3e40',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#FAF8F5',
                  fontSize: '0.85rem',
                  resize: 'none',
                  outline: 'none',
                  lineHeight: '1.4'
                }}
              />

              {/* Boton Enviar */}
              <button
                type="button"
                onClick={() => handleSendProcess()}
                disabled={isProcessing || (!inputText.trim() && pendingFiles.length === 0)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#0B3C3D',
                  border: '1px solid #34D399',
                  borderRadius: '10px',
                  color: '#34D399',
                  fontWeight: 700,
                  cursor: isProcessing || (!inputText.trim() && pendingFiles.length === 0) ? 'not-allowed' : 'pointer',
                  opacity: isProcessing || (!inputText.trim() && pendingFiles.length === 0) ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(52, 211, 153, 0.2)'
                }}
              >
                <Send size={16} />
                Enviar
              </button>
            </div>
            {isSpeechListening && (
              <p style={{ margin: '6px 0 0 0', fontSize: '0.72rem', color: '#34D399', fontWeight: 600 }}>
                Escuchando tu voz... Habla con claridad y las palabras aparecerán en el recuadro.
              </p>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: Live Profile Preview en Tiempo Real */}
        <div style={{
          backgroundColor: '#0a1a1c',
          border: '1px solid #1a3e40',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Header de Vista Previa */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #1a3e40',
            paddingBottom: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} style={{ color: '#34D399' }} />
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#FAF8F5' }}>
                Vista Previa en Vivo (Live Preview)
              </h2>
            </div>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              color: '#34D399',
              fontWeight: 700,
              backgroundColor: 'rgba(52, 211, 153, 0.12)',
              padding: '3px 8px',
              borderRadius: '6px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34D399' }} />
              Actualización Instantánea
            </span>
          </div>

          {/* Tarjeta 1: Identidad y Marca */}
          <div style={{
            backgroundColor: '#0f2426',
            border: '1px solid #1a3e40',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            {/* Banner de Portada */}
            <div style={{
              height: '90px',
              backgroundColor: '#0B3C3D',
              backgroundImage: profile.bannerUrl ? `url(${profile.bannerUrl})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {!profile.bannerUrl && (
                <span style={{ fontSize: '0.75rem', color: '#5eead4', fontWeight: 600 }}>
                  Banner no asignado (sube una imagen de portada)
                </span>
              )}
            </div>

            {/* Fila con Logotipo y Datos Básicos */}
            <div style={{ padding: '16px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '-36px', marginBottom: '12px' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '14px',
                  backgroundColor: '#071213',
                  border: '2px solid #34D399',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
                  flexShrink: 0
                }}>
                  {profile.logoUrl ? (
                    <img src={profile.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Store size={28} style={{ color: '#34D399' }} />
                  )}
                </div>
                <div style={{ marginTop: '24px', flex: 1 }}>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Nombre Comercial del Negocio"
                    style={{
                      width: '100%',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderBottom: '1px dashed #234b4e',
                      color: '#FAF8F5',
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      outline: 'none',
                      padding: '2px 0'
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 600 }}>
                      betico.tech/store/{profile.slug || 'slug-del-comercio'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid de WhatsApp y Plan */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Teléfono WhatsApp (Costa Rica)
                  </label>
                  <input
                    type="text"
                    value={profile.whatsappNumber}
                    onChange={(e) => setProfile((prev) => ({ ...prev, whatsappNumber: e.target.value }))}
                    placeholder="8888-9999"
                    style={{
                      width: '100%',
                      backgroundColor: '#071213',
                      border: '1px solid #1a3e40',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      color: '#FAF8F5',
                      fontSize: '0.82rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Plan Sugerido
                  </label>
                  <select
                    value={profile.plan}
                    onChange={(e) => setProfile((prev) => ({ ...prev, plan: e.target.value }))}
                    style={{
                      width: '100%',
                      backgroundColor: '#071213',
                      border: '1px solid #1a3e40',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      color: '#FAF8F5',
                      fontSize: '0.82rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="starter">Plan Starter</option>
                    <option value="pro">Plan Pro</option>
                    <option value="business">Plan Business</option>
                    <option value="enterprise">Plan Enterprise</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Módulos del Sistema Sugeridos */}
          <div style={{
            backgroundColor: '#0f2426',
            border: '1px solid #1a3e40',
            borderRadius: '12px',
            padding: '14px'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 700, color: '#FAF8F5' }}>
              Módulos Activos Sugeridos
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              {[
                { key: 'store', label: 'Tienda en Línea', icon: Store },
                { key: 'bookings', label: 'Citas y Reservas', icon: Calendar },
                { key: 'courts', label: 'Canchas Deportivas', icon: Trophy },
                { key: 'loyalty', label: 'Club Fidelización', icon: Award },
                { key: 'billing', label: 'Facturación CR', icon: FileText }
              ].map((mod) => {
                const IconComp = mod.icon;
                const active = (profile.modules as any)[mod.key];
                return (
                  <button
                    key={mod.key}
                    type="button"
                    onClick={() => {
                      setProfile((prev) => ({
                        ...prev,
                        modules: {
                          ...prev.modules,
                          [mod.key]: !active
                        }
                      }));
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: active ? '1px solid #34D399' : '1px solid #1a3e40',
                      backgroundColor: active ? 'rgba(52, 211, 153, 0.15)' : '#071213',
                      color: active ? '#34D399' : '#64748b',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left'
                    }}
                  >
                    <IconComp size={14} />
                    {mod.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tarjeta 3: Datos Fiscales de Costa Rica (Hacienda) */}
          <div style={{
            backgroundColor: '#0f2426',
            border: '1px solid #1a3e40',
            borderRadius: '12px',
            padding: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#FAF8F5' }}>
                Datos Fiscales de Hacienda Costa Rica
              </h3>
              <span style={{
                fontSize: '0.7rem',
                color: profile.fiscal.idNumber ? '#34D399' : '#94a3b8',
                fontWeight: 600
              }}>
                {profile.fiscal.idNumber ? '✓ Identificado' : 'Opcional / Pendiente'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '2px' }}>
                  Tipo Cédula
                </label>
                <select
                  value={profile.fiscal.idType}
                  onChange={(e) => setProfile((prev) => ({ ...prev, fiscal: { ...prev.fiscal, idType: e.target.value } }))}
                  style={{
                    width: '100%',
                    backgroundColor: '#071213',
                    border: '1px solid #1a3e40',
                    borderRadius: '6px',
                    padding: '6px 8px',
                    color: '#FAF8F5',
                    fontSize: '0.78rem',
                    outline: 'none'
                  }}
                >
                  <option value="01">01 - Física</option>
                  <option value="02">02 - Jurídica</option>
                  <option value="03">03 - DIMEX</option>
                  <option value="04">04 - NITE</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '2px' }}>
                  Número de Cédula
                </label>
                <input
                  type="text"
                  value={profile.fiscal.idNumber}
                  onChange={(e) => setProfile((prev) => ({ ...prev, fiscal: { ...prev.fiscal, idNumber: e.target.value } }))}
                  placeholder="3-101-123456 o 1-1234-0567"
                  style={{
                    width: '100%',
                    backgroundColor: '#071213',
                    border: '1px solid #1a3e40',
                    borderRadius: '6px',
                    padding: '6px 8px',
                    color: '#FAF8F5',
                    fontSize: '0.78rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '2px' }}>
                  Razón Social
                </label>
                <input
                  type="text"
                  value={profile.fiscal.legalName}
                  onChange={(e) => setProfile((prev) => ({ ...prev, fiscal: { ...prev.fiscal, legalName: e.target.value } }))}
                  placeholder="Nombre según Hacienda"
                  style={{
                    width: '100%',
                    backgroundColor: '#071213',
                    border: '1px solid #1a3e40',
                    borderRadius: '6px',
                    padding: '6px 8px',
                    color: '#FAF8F5',
                    fontSize: '0.78rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '2px' }}>
                  Correo de Facturación
                </label>
                <input
                  type="email"
                  value={profile.fiscal.email}
                  onChange={(e) => setProfile((prev) => ({ ...prev, fiscal: { ...prev.fiscal, email: e.target.value } }))}
                  placeholder="facturas@comercio.cr"
                  style={{
                    width: '100%',
                    backgroundColor: '#071213',
                    border: '1px solid #1a3e40',
                    borderRadius: '6px',
                    padding: '6px 8px',
                    color: '#FAF8F5',
                    fontSize: '0.78rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Tarjeta 4: Catálogo Inicial Extraído */}
          <div style={{
            backgroundColor: '#0f2426',
            border: '1px solid #1a3e40',
            borderRadius: '12px',
            padding: '14px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#FAF8F5' }}>
                  Catálogo Inicial Extraído
                </h3>
                <span style={{
                  padding: '2px 8px',
                  backgroundColor: '#0B3C3D',
                  color: '#34D399',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}>
                  {profile.catalogItems.length} items
                </span>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Moneda en ₡CRC</span>
            </div>

            {/* Lista Desplegable de Items */}
            <div style={{
              maxHeight: '180px',
              overflowY: 'auto',
              backgroundColor: '#071213',
              borderRadius: '8px',
              border: '1px solid #142e30',
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              marginBottom: '10px'
            }}>
              {profile.catalogItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: '#64748b', fontSize: '0.78rem' }}>
                  No se han extraído productos o servicios aún. Sube un archivo Excel, CSV, PDF o dictalos en el chat.
                </div>
              ) : (
                profile.catalogItems.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      backgroundColor: '#0f2426',
                      borderRadius: '6px',
                      border: '1px solid #1a3e40',
                      fontSize: '0.78rem'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: '#FAF8F5' }}>{item.name}</span>
                      {item.category && (
                        <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: '#94a3b8' }}>
                          ({item.category})
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: '#34D399' }}>
                        ₡{item.price.toLocaleString('es-CR')}
                      </span>
                      <button
                        onClick={() => handleRemoveCatalogItem(idx)}
                        style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0 }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Formulario Rapido para Agregar Item Manual */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Nombre item"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                style={{
                  flex: 2,
                  backgroundColor: '#071213',
                  border: '1px solid #1a3e40',
                  borderRadius: '6px',
                  padding: '5px 8px',
                  color: '#FAF8F5',
                  fontSize: '0.75rem',
                  outline: 'none'
                }}
              />
              <input
                type="text"
                placeholder="₡ Precio"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                style={{
                  flex: 1,
                  backgroundColor: '#071213',
                  border: '1px solid #1a3e40',
                  borderRadius: '6px',
                  padding: '5px 8px',
                  color: '#FAF8F5',
                  fontSize: '0.75rem',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={handleAddManualCatalogItem}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#123032',
                  border: '1px solid #234b4e',
                  borderRadius: '6px',
                  color: '#34D399',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                + Añadir
              </button>
            </div>
          </div>

          {/* Boton Principal de Accion: Confirmar y Crear Comercio */}
          <button
            onClick={handleFinalize}
            disabled={isFinalizing || !profile.name.trim()}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#0B3C3D',
              border: '1px solid #34D399',
              borderRadius: '12px',
              color: '#FAF8F5',
              fontSize: '0.95rem',
              fontWeight: 800,
              cursor: isFinalizing || !profile.name.trim() ? 'not-allowed' : 'pointer',
              opacity: isFinalizing || !profile.name.trim() ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(52, 211, 153, 0.25)',
              transition: 'all 0.2s'
            }}
          >
            {isFinalizing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creando Comercio en PostgreSQL...
              </>
            ) : (
              <>
                <CheckCircle2 size={18} style={{ color: '#34D399' }} />
                Confirmar y Crear Comercio
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal de Exito al Finalizar Onboarding */}
      {successResult && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(7, 18, 19, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0a1a1c',
            border: '2px solid #34D399',
            borderRadius: '20px',
            padding: '30px',
            maxWidth: '560px',
            width: '100%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.7)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#0B3C3D',
              border: '2px solid #34D399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: '#34D399'
            }}>
              <CheckCircle2 size={36} />
            </div>

            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.4rem', fontWeight: 800, color: '#FAF8F5' }}>
              ¡Comercio Creado con Éxito!
            </h2>
            <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              El perfil de <strong style={{ color: '#34D399' }}>{successResult.tenant?.name || profile.name}</strong> ha sido configurado y guardado en la base de datos de Betico.
            </p>

            <div style={{
              backgroundColor: '#0f2426',
              border: '1px solid #1a3e40',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'left',
              marginBottom: '20px'
            }}>
              <div style={{ marginBottom: '10px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Enlace de la Tienda / Menú:</span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                  <a
                    href={successResult.storeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.85rem', color: '#34D399', fontWeight: 700, textDecoration: 'none' }}
                  >
                    {successResult.storeUrl}
                  </a>
                  <ExternalLink size={14} style={{ color: '#34D399' }} />
                </div>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Usuario Administrador:</span>
                <div style={{ fontSize: '0.85rem', color: '#FAF8F5', fontWeight: 600 }}>
                  {successResult.adminEmail}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Contraseña Temporal Inicial:</span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#071213',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  marginTop: '4px'
                }}>
                  <code style={{ fontSize: '0.9rem', color: '#34D399', fontWeight: 700 }}>
                    {successResult.tempPassword}
                  </code>
                  <button
                    onClick={() => copyToClipboard(successResult.tempPassword)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'none',
                      border: 'none',
                      color: copiedPassword ? '#34D399' : '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    {copiedPassword ? <Check size={14} /> : <Copy size={14} />}
                    {copiedPassword ? 'Copiada' : 'Copiar'}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  setSuccessResult(null);
                  if (onNavigateToTenants) onNavigateToTenants();
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#0B3C3D',
                  border: '1px solid #34D399',
                  borderRadius: '10px',
                  color: '#FAF8F5',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Ver en Lista de Negocios
              </button>
              <button
                onClick={() => {
                  setSuccessResult(null);
                  handleReset();
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#123032',
                  border: '1px solid #234b4e',
                  borderRadius: '10px',
                  color: '#94a3b8',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Crear Otro Comercio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
