import React, { useState, useEffect } from 'react';
import {
  X,
  MessageCircle,
  Phone,
  Copy,
  Check,
  Send,
  Sparkles
} from 'lucide-react';
import { useShop } from '../context/ShopContext';

export type ReminderType =
  | 'payment_due'
  | 'repair_ready'
  | 'repair_received'
  | 'repair_delivered'
  | 'payment_received'
  | 'service_reminder';

interface WhatsAppReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  phone: string;
  amount?: number;
  repairId?: string;
  device?: string;
  initialType?: ReminderType;
}

export const WhatsAppReminderModal: React.FC<WhatsAppReminderModalProps> = ({
  isOpen,
  onClose,
  customerName,
  phone,
  amount = 0,
  repairId = '',
  device = '',
  initialType = 'payment_due'
}) => {
  const { settings, formatCurrency, showToast } = useShop();
  const [selectedType, setSelectedType] = useState<ReminderType>(initialType);
  const [customMessage, setCustomMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedType(initialType);
      generateTemplate(initialType);
    }
  }, [isOpen, initialType, customerName, phone, amount, repairId, device]);

  const generateTemplate = (type: ReminderType) => {
    const shop = settings.shopName || 'Sumaiya telecom';
    const contact = settings.phone || '9679100433';
    const formattedAmt = formatCurrency(amount);

    let text = '';
    switch (type) {
      case 'payment_due':
        text = `Dear ${customerName || 'Customer'},
Greetings from *${shop}*!
This is a gentle reminder that an outstanding due amount of *${formattedAmt}* is pending against your bill/repair ${repairId ? `(#${repairId})` : ''}.
Please visit our shop or pay via UPI to clear the dues.
For queries, contact us at: ${contact}.
Thank you!`;
        break;

      case 'repair_ready':
        text = `Dear ${customerName || 'Customer'},
Good news from *${shop}*! 🛠️
Your device *${device || 'Mobile Phone'}* (Repair ID: *${repairId || 'N/A'}*) is *READY FOR DELIVERY*.
Remaining amount to pay: *${formattedAmt}*.
Please bring your repair slip and collect your device during shop hours.
Shop Address: ${settings.address || 'Station Road, Rampurhat'}.
Contact: ${contact}.`;
        break;

      case 'repair_received':
        text = `Dear ${customerName || 'Customer'},
Thank you for visiting *${shop}*!
We have received your *${device || 'Mobile Device'}* for repair.
*Job ID*: ${repairId || 'N/A'}
*Estimated Cost*: ${formattedAmt}
Our technician is inspecting your device and we will notify you once ready.
Contact / WhatsApp: ${contact}`;
        break;

      case 'repair_delivered':
        text = `Dear ${customerName || 'Customer'},
Thank you for trusting *${shop}* for your repair!
Your *${device || 'Mobile Phone'}* has been delivered successfully.
Parts replaced are covered under our testing warranty.
If you have any feedback or questions, WhatsApp us at ${contact}. Have a great day!`;
        break;

      case 'payment_received':
        text = `Dear ${customerName || 'Customer'},
We have successfully received payment of *${formattedAmt}* at *${shop}*.
Thank you for clearing your payment!
Bill / Repair Reference: ${repairId || 'Shop Bill'}.
Contact: ${contact}`;
        break;

      case 'service_reminder':
        text = `Hello ${customerName || 'Customer'},
Greetings from *${shop}*!
Need new mobile tempered glass, fast charger, back case, or general mobile servicing?
Visit us at *${shop}* for special customer offers.
WhatsApp: ${contact}`;
        break;
    }

    setCustomMessage(text);
  };

  const handleTypeChange = (type: ReminderType) => {
    setSelectedType(type);
    generateTemplate(type);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    showToast('Message copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(customMessage)}`;
    window.open(url, '_blank');
    showToast('Opening WhatsApp...', 'info');
  };

  const handleOpenSms = () => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const url = `sms:${cleanPhone}?body=${encodeURIComponent(customMessage)}`;
    window.location.href = url;
    showToast('Opening SMS app...', 'info');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-white">
                WhatsApp & SMS Reminder
              </h3>
              <p className="text-[11px] text-slate-400">
                To: <strong className="text-slate-200">{customerName || 'Customer'}</strong> ({phone})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Template Selector Pills */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Select Message Template:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'payment_due' as ReminderType, label: 'Payment Due' },
                { id: 'repair_ready' as ReminderType, label: 'Repair Ready' },
                { id: 'repair_received' as ReminderType, label: 'Intake Receipt' },
                { id: 'repair_delivered' as ReminderType, label: 'Delivery' },
                { id: 'payment_received' as ReminderType, label: 'Payment Receipt' },
                { id: 'service_reminder' as ReminderType, label: 'Service Offer' }
              ].map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => handleTypeChange(tmpl.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    selectedType === tmpl.id
                      ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {tmpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message Textarea */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-slate-300">
                Message Preview (Editable):
              </label>
              <button
                onClick={handleCopy}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <textarea
              rows={7}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-3 bg-slate-850 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 font-sans focus:outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>

          {/* SMS API info note */}
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-[11px] text-slate-400 flex items-start space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <p>
              Direct WhatsApp & Phone SMS integration active. One-click button opens customer chat with the pre-filled message instantly!
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex flex-wrap gap-2 justify-between items-center">
          <button
            onClick={onClose}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
          >
            Cancel
          </button>

          <div className="flex space-x-2">
            <button
              onClick={handleOpenSms}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center space-x-1.5 border border-slate-700"
            >
              <Phone className="w-3.5 h-3.5 text-blue-400" />
              <span>Send SMS</span>
            </button>

            <button
              onClick={handleOpenWhatsApp}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 shadow-md shadow-emerald-600/30"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
