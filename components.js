import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, CheckCircle, AlertTriangle, Info, XCircle, Mail, X, Check, 
  Send, Upload, Download, FileSpreadsheet, Zap, ChevronRight, Users, Eye
} from 'lucide-react';

// --- UTILITÁRIOS GLOBAIS ---
window.formatDate = (val) => {
    try {
        if (!val) return '-';
        const date = typeof val === 'object' && val.toDate ? val.toDate() : new Date(val); 
        if (isNaN(date.getTime())) return '-';
        return new Intl.DateTimeFormat('pt-BR').format(date);
    } catch (e) { return '-'; }
};

window.formatCurrency = (val) => {
    try {
        const num = parseFloat(val) || 0;
        return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    } catch (e) { return 'R$ 0,00'; }
};

window.getDaysLeft = (expirationDate) => {
    try {
        if (!expirationDate) return 0;
        const end = typeof expirationDate === 'object' && expirationDate.toDate ? expirationDate.toDate() : new Date(expirationDate);
        const now = new Date();
        if (isNaN(end.getTime())) return 0;
        const diff = end - now;
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    } catch (e) { return 0; }
};

window.isPanelExpired = (expirationDate) => {
    if (!expirationDate) return false;
    const end = typeof expirationDate === 'object' && expirationDate.toDate ? expirationDate.toDate() : new Date(expirationDate);
    return end < new Date();
};

window.getClientStatus = (dueDate) => {
    try {
        if (!dueDate) return { status: 'no_date', label: 'Sem Data', color: 'slate' };
        const today = new Date(); today.setHours(0, 0, 0, 0);
        let due = new Date(dueDate);
        if(dueDate.length === 10) due = new Date(dueDate + 'T00:00:00'); 
        
        if (isNaN(due.getTime())) return { status: 'no_date', label: 'Data Inválida', color: 'slate' };
        due.setHours(0, 0, 0, 0);
        
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { status: 'expired', label: 'Vencido', color: 'red', days: diffDays };
        if (diffDays === 0) return { status: 'today', label: 'Vence Hoje', color: 'orange', days: 0 };
        if (diffDays <= 3) return { status: 'expiring', label: `Vence em ${diffDays}d`, color: 'yellow', days: diffDays };
        return { status: 'active', label: 'Ativo', color: 'green', days: diffDays };
    } catch (e) {
        return { status: 'no_date', label: 'Erro', color: 'slate' };
    }
};

window.generateWhatsAppMessage = (client, userSettings, specificType = null) => {
    if (!client) return "";
    const { status, days } = window.getClientStatus(client.dueDate);
    const company = userSettings?.companyName || "Fire Gestor";
    const templates = userSettings?.messageTemplates || {};
    const value = window.formatCurrency(client.value || 0);
    
    const defaultGreeting = `Olá *{nome}*, tudo bem? Aqui é do *{empresa}*.\n\n`;
    
    const defaults = {
        expired: defaultGreeting + `⚠️ *SEU PLANO DE {valor} ESTÁ VENCIDO* há {dias} dias.\nEvite o corte do sinal, renove agora mesmo!`,
        today: defaultGreeting + `⚠️ *ATENÇÃO:* Seu plano de {valor} vence *HOJE*.\nGaranta a renovação para não perder a programação.`,
        expiring: defaultGreeting + `⏳ Seu plano ({valor}) vence em apenas *{dias} dias* ({vencimento}).\nQue tal já deixar renovado?`,
        active: defaultGreeting + `✅ Seu plano de {valor} está ativo até *{vencimento}*.\nAgradecemos a preferência!`,
        renewal: defaultGreeting + `✅ *PAGAMENTO RECEBIDO!*\n\nRecebemos seu pagamento de {valor}.\nSeu plano foi renovado com sucesso e agora vence em: *{vencimento}*.\n\nMuito obrigado pela preferência!`,
        team_active: `Olá *{nome}*! Seu painel de revenda está ativo e operando 100%. Vence em: {vencimento}. Boas vendas!`,
        team_renewal: `🚀 *PAINEL RENOVADO!*\n\nFala parceiro(a) *{nome}*!\nSeu painel de revenda foi renovado com sucesso.\n\nNova validade: *{vencimento}*.\n\nVamos pra cima!`
    };
    
    let typeKey = specificType || status;
    let template = templates[typeKey] || defaults[typeKey] || defaults.active;
    
    return template
        .replace(/{nome}/g, client.name || '')
        .replace(/{vencimento}/g, window.formatDate(client.dueDate || client.panelExpiration))
        .replace(/{dias}/g, Math.abs(days))
        .replace(/{empresa}/g, company)
        .replace(/{valor}/g, value);
};

// --- COMPONENTES VISUAIS GLOBAIS ---

window.LoadingSpinner = ({ size = 20, color = "text-white" }) => (
    <RefreshCw size={size} className={`animate-spin ${color}`} />
);

window.RoleBadge = ({ role }) => { 
    const config = { 
        ceo: { label: 'CEO', style: 'border-red-500 text-red-400 bg-red-500/10' },
        master: { label: 'MASTER', style: 'border-purple-500 text-purple-400 bg-purple-500/10' },
        reseller: { label: 'REVENDA', style: 'border-blue-500 text-blue-400 bg-blue-500/10' }
    };
    const active = config[role] || config.reseller;
    return <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${active.style}`}>{active.label}</span>; 
};

window.StatCard = ({ title, value, icon, color }) => (
    <div className={`bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-center justify-between hover:border-${color}-500/50 transition-all hover:-translate-y-1 hover:shadow-lg shadow-black/50 group`}>
        <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 group-hover:text-slate-300 transition-colors">{title}</p>
            <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">{value}</h3>
        </div>
        <div className={`p-4 rounded-xl bg-${color}-500/10 text-${color}-500 border border-${color}-500/20 group-hover:scale-110 transition-transform`}>{icon}</div>
    </div>
);

window.ToastNotification = ({ notification, onClose }) => {
    if (!notification.show) return null;
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [notification, onClose]);
    return (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border animate-slide-in ${
            notification.type === 'success' ? 'bg-slate-900 border-green-500/50 text-green-400' : 
            notification.type === 'error' ? 'bg-slate-900 border-red-500/50 text-red-400' :
            'bg-slate-900 border-blue-500/50 text-blue-400'
        }`}>
            {notification.type === 'success' ? <CheckCircle size={20} /> : notification.type === 'error' ? <AlertTriangle size={20} /> : <Info size={20}/>}
            <p className="font-medium text-sm text-white">{notification.message}</p>
        </div>
    );
};

window.ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, isLoading }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-xl p-6 shadow-2xl scale-100 transform transition-all">
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-slate-400 mb-6 text-sm leading-relaxed">{message}</p>
                <div className="flex gap-3 justify-end">
                    <button onClick={onCancel} disabled={isLoading} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 font-medium transition-colors">Cancelar</button>
                    <button onClick={onConfirm} disabled={isLoading} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-2 transition-colors disabled:opacity-50">
                        {isLoading ? <window.LoadingSpinner size={16}/> : null}
                        {isLoading ? 'Processando...' : 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

window.RegistrationSuccessModal = ({ onClose }) => (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-slate-900 border-2 border-green-500 w-full max-w-sm md:max-w-lg rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(34,197,94,0.2)] relative text-center transform scale-100 transition-all">
            <button onClick={onClose} className="absolute top-4 right-4 bg-slate-800 p-2 rounded-full text-slate-400 hover:text-white transition-colors hover:bg-slate-700">
                <XCircle className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <div className="w-16 h-16 md:w-24 md:h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 animate-bounce-slow">
                <Mail className="w-8 h-8 md:w-12 md:h-12 text-green-500" />
            </div>
            <h2 className="text-xl md:text-3xl font-black text-white mb-3 md:mb-4 uppercase tracking-tight">
                Conta Criada com <span className="text-green-500">Sucesso!</span> 🚀
            </h2>
            <div className="space-y-4 md:space-y-6 text-slate-300 text-base md:text-lg leading-relaxed mb-6 md:mb-8">
                <p className="text-sm md:text-base">Enviamos um link de confirmação para o seu e-mail cadastrado.</p>
                <div className="bg-slate-950 p-4 md:p-6 rounded-xl border border-slate-800 font-medium text-left space-y-3 shadow-inner text-sm md:text-base">
                    <div className="flex items-center gap-3"><div className="bg-green-500/20 text-green-400 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-xs md:text-sm">1</div><span>Abra seu E-mail</span></div>
                    <div className="flex items-center gap-3"><div className="bg-green-500/20 text-green-400 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-xs md:text-sm">2</div><span>Clique no Link de Verificação</span></div>
                    <div className="flex items-center gap-3"><div className="bg-green-500/20 text-green-400 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-xs md:text-sm">3</div><span>Volte aqui e faça Login</span></div>
                </div>
                <p className="text-xs md:text-sm text-slate-500 flex items-center justify-center gap-2"><Info className="w-3.5 h-3.5 md:w-4 md:h-4"/> Não esqueça de verificar a caixa de Spam.</p>
            </div>
            <button onClick={onClose} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black py-3 md:py-4 rounded-xl transition-all hover:scale-[1.02] shadow-xl text-base md:text-lg uppercase tracking-wide">Entendi, vou verificar agora!</button>
        </div>
    </div>
);

window.MessagePreviewModal = ({ isOpen, onClose, text, onSend, recipient, isLoading }) => {
    const [editedText, setEditedText] = useState(text);
    useEffect(() => { setEditedText(text); }, [text]);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[90] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-white text-lg">Confirmar Mensagem</h3><button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20}/></button></div>
                <div className="mb-2 text-sm text-slate-400">Para: <span className="font-bold text-white">{recipient}</span></div>
                <textarea value={editedText} onChange={(e) => setEditedText(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-sm text-white h-48 focus:border-green-500 outline-none resize-none mb-4" />
                <button onClick={() => onSend(editedText)} disabled={isLoading} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2">{isLoading ? <window.LoadingSpinner size={18}/> : <Send size={18}/>} Enviar Agora</button>
            </div>
        </div>
    );
};

window.CelebrationModal = ({ isOpen, onClose, data }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-gradient-to-br from-green-900 to-slate-900 border-2 border-green-500 w-full max-w-sm rounded-3xl p-8 shadow-[0_0_100px_rgba(34,197,94,0.4)] text-center relative animate-celebrate">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2"><div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-xl animate-bounce-slow border-4 border-slate-900"><Check size={40} className="text-white font-bold" strokeWidth={4} /></div></div>
                <div className="mt-8">
                    <h2 className="text-3xl font-black text-white mb-1 tracking-tighter italic">PAGO!</h2>
                    <p className="text-green-400 font-bold uppercase text-xs tracking-widest mb-6">Renovação Confirmada</p>
                    <div className="bg-black/30 rounded-xl p-4 mb-6 border border-green-500/30">
                        <p className="text-slate-400 text-sm mb-1">Cliente</p><p className="text-white font-bold text-xl mb-3">{data.name}</p>
                        <div className="h-px bg-green-500/30 w-full mb-3"></div>
                        <p className="text-slate-400 text-sm mb-1">Novo Vencimento</p><p className="text-green-400 font-mono font-bold text-2xl">{window.formatDate(data.newDate)}</p>
                    </div>
                    <button onClick={onClose} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-600/30">Fechar</button>
                </div>
            </div>
        </div>
    );
};

window.ActionButton = ({ onClick, color = "slate", icon: Icon, label, title }) => (
    <button onClick={onClick} className={`p-2 rounded-lg transition-colors border bg-${color}-600/10 hover:bg-${color}-600 text-${color}-500 hover:text-white border-${color}-600/20 hover:border-transparent`} title={title || label}><Icon size={18} /></button>
);

const parseFlexibleDate = (dateStr) => {
    if (!dateStr) return '';
    if (!isNaN(dateStr) && !isNaN(parseFloat(dateStr))) {
        const serial = parseFloat(dateStr);
        if (serial > 30000) { const utc_days = Math.floor(serial - 25569); const utc_value = utc_days * 86400; const date_info = new Date(utc_value * 1000); return date_info.toISOString().split('T')[0]; }
    }
    const cleanStr = String(dateStr).trim().split(' ')[0];
    const parts = cleanStr.split(/[\/\-\.]/);
    if (parts.length === 3) {
        let day, month, year;
        if (parts[0].length === 4) { year = parts[0]; month = parts[1]; day = parts[2]; } 
        else if (parts[2].length === 4) { year = parts[2]; month = parts[1]; day = parts[0]; }
        if (day && month && year) return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    const d = new Date(cleanStr);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    return ''; 
};

window.ImportExportModal = ({ isOpen, onClose, onImport, onExport, isLoading, clients }) => {
    const [step, setStep] = useState(1);
    const [csvHeaders, setCsvHeaders] = useState([]);
    const [csvData, setCsvData] = useState([]);
    const [mapping, setMapping] = useState({ name: '', whatsapp: '', dueDate: '', value: '', username: '', observation: '' });
    const [importProgress, setImportProgress] = useState(0);

    if (!isOpen) return null;

    const resetModal = () => { setStep(1); setCsvHeaders([]); setCsvData([]); setMapping({ name: '', whatsapp: '', dueDate: '', value: '', username: '', observation: '' }); setImportProgress(0); };
    const handleFileRead = (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result; const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== ''); if (lines.length < 2) return alert("Arquivo inválido");
            const headers = lines[0].split(/[;,]/).map(h => h.trim().replace(/"/g, ''));
            const data = lines.slice(1).map(line => { const values = line.split(/[;,]/).map(v => v.trim().replace(/"/g, '')); const obj = {}; headers.forEach((h, i) => obj[h] = values[i]); return obj; });
            setCsvHeaders(headers); setCsvData(data); 
            const newMap = { ...mapping };
            headers.forEach(h => {
                const lower = h.toLowerCase();
                if (lower.includes('nome') || lower.includes('client') || lower.includes('name')) newMap.name = h;
                if (lower.includes('zap') || lower.includes('what') || lower.includes('cel') || lower.includes('tel') || lower.includes('fone')) newMap.whatsapp = h;
                if (lower.includes('venc') || lower.includes('date') || lower.includes('data') || lower.includes('expir')) newMap.dueDate = h;
                if (lower.includes('val') || lower.includes('pric') || lower.includes('preço')) newMap.value = h;
                if (lower.includes('usu') || lower.includes('user') || lower.includes('login')) newMap.username = h;
            });
            setMapping(newMap); setStep(2);
        };
        reader.readAsText(file, 'ISO-8859-1');
    };
    const processImport = async () => {
        setStep(3); let processedClients = [];
        for (const row of csvData) {
            const name = row[mapping.name] || 'Sem Nome';
            let whatsapp = (row[mapping.whatsapp] || '').replace(/\D/g, '');
            let dueDate = parseFlexibleDate(row[mapping.dueDate]);
            let value = (row[mapping.value] || '').replace('R$', '').replace('.', '').replace(',', '.').trim();
            processedClients.push({ name, whatsapp, dueDate: dueDate || '', value: value || '0', username: row[mapping.username] || '', observation: row[mapping.observation] || '', status: 'active' });
        }
        await onImport(processedClients, (prog) => setImportProgress(prog)); resetModal(); onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={24}/></button>
                <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2"><FileSpreadsheet className="text-green-500"/> Importar/Exportar</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                    <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
                        <div className="bg-blue-500/10 p-4 rounded-full mb-4"><Download size={32} className="text-blue-500"/></div>
                        <h3 className="font-bold text-white mb-2">Backup de Clientes</h3>
                        <button onClick={onExport} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg transition-colors">Baixar Planilha</button>
                    </div>
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 relative">
                        {step === 1 && (
                            <div className="text-center h-full flex flex-col justify-center">
                                <div className="bg-green-500/10 p-4 rounded-full mb-4 mx-auto w-fit"><Upload size={32} className="text-green-500"/></div>
                                <h3 className="font-bold text-white mb-2">Importar Clientes</h3>
                                <label className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg transition-colors cursor-pointer block">Selecionar CSV <input type="file" accept=".csv" className="hidden" onChange={handleFileRead} /></label>
                            </div>
                        )}
                        {step === 2 && (
                            <>
                                <button onClick={resetModal} className="absolute top-2 right-2 text-red-400 hover:text-red-300 p-2" title="Cancelar arquivo"><X size={18}/></button>
                                <div className="space-y-2 h-64 overflow-y-auto custom-scrollbar">
                                    <h4 className="text-sm font-bold text-white mb-2">Vincule as colunas:</h4>
                                    {['name', 'whatsapp', 'dueDate', 'value', 'username', 'observation'].map(field => (
                                        <div key={field} className="flex flex-col"><label className="text-[10px] font-bold uppercase text-slate-500">{field}</label><select value={mapping[field]} onChange={(e) => setMapping({...mapping, [field]: e.target.value})} className="bg-slate-950 border border-slate-700 text-white text-sm rounded-lg p-2"><option value="">-- Ignorar --</option>{csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}</select></div>
                                    ))}
                                    <button onClick={processImport} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg mt-2">Confirmar</button>
                                </div>
                            </>
                        )}
                        {step === 3 && <div className="text-center"><window.LoadingSpinner size={40} color="text-green-500" /><p className="text-xs text-slate-400 mt-2">{importProgress.toFixed(0)}%</p></div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

window.Landing = ({ setAuthType, setShowAuthModal }) => (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>
        <nav className="container mx-auto px-6 py-6 flex justify-between items-center z-10">
            <div className="flex items-center gap-3"><div className="bg-gradient-to-br from-orange-500 to-red-600 p-2 rounded-xl shadow-lg shadow-orange-500/20"><Users size={24} /></div><span className="text-2xl font-black tracking-tighter">FIRE <span className="text-orange-500">GESTOR</span></span></div>
            <button onClick={()=>{setAuthType('login'); setShowAuthModal(true)}} className="px-5 py-2 rounded-lg border border-slate-700 bg-slate-900/50 backdrop-blur text-slate-300 hover:text-white hover:border-orange-500 transition-all font-bold text-sm">Entrar</button>
        </nav>
        <div className="flex-1 container mx-auto px-4 flex flex-col items-center justify-center text-center z-10 pb-20">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold text-xs uppercase tracking-wider animate-pulse-slow"><Zap size={14} className="fill-orange-500" /> Sistema Automático v2.0</div>
            <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 tracking-tight max-w-4xl">Gerencie seus <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">CLIENTES IPTV</span> Profissional</h1>
            <p className="text-slate-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">Painel completo para gestão de clientes, renovações automáticas, envio de comprovantes via WhatsApp e controle financeiro.</p>
            <button onClick={()=>{setAuthType('register'); setShowAuthModal(true)}} className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-xl shadow-orange-500/20 flex items-center gap-2 justify-center group">Teste Grátis 7 Dias <ChevronRight className="group-hover:translate-x-1 transition-transform"/></button>
        </div>
    </div>
);
