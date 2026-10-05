import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  MessageCircle,
  Wrench,
  CheckCircle,
  Phone,
  MapPin,
  Calendar,
  CreditCard
} from 'lucide-react';
import { Invoice, RepairJob } from '../types';
import { useShop } from '../context/ShopContext';

interface InvoicePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: Invoice | null;
  repair?: RepairJob | null;
  mode?: 'invoice' | 'repair_receipt';
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  isOpen,
  onClose,
  invoice,
  repair,
  mode = 'invoice'
}) => {
  const { settings, formatCurrency, formatDate, formatDateTime, showToast } = useShop();
  const printRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  const isRepairReceipt = mode === 'repair_receipt' || (!invoice && !!repair);

  const title = isRepairReceipt
    ? 'Customer Device Intake Receipt'
    : 'Tax Invoice / Cash Receipt';

  const customerName = invoice?.customerName || repair?.customerName || 'Customer';
  const customerPhone = invoice?.customerPhone || repair?.customerPhone || '-';
  const customerAddress = repair?.customerAddress || '-';
  const docId = isRepairReceipt ? repair?.id : (invoice?.id || repair?.id);
  const docDate = invoice?.createdAt || repair?.createdAt || new Date().toISOString();

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = `Dear ${customerName},\nHere is your *${settings.shopName || 'Sumaiya telecom'}* ${title}:\n*Ref*: ${docId}\n*Date*: ${formatDate(docDate)}\n*Total*: ${formatCurrency(invoice?.totalAmount || repair?.estimatedCost)}\n*Paid*: ${formatCurrency(invoice?.paidAmount || repair?.advancePaid)}\n*Due*: ${formatCurrency(invoice?.dueAmount || repair?.remainingAmount)}\n\nThank you for choosing Sumaiya telecom!`;
    const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    showToast('Opening WhatsApp to send bill...', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[92vh]">
        {/* Modal Action Header */}
        <div className="p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-sm sm:text-base text-white">
              {title} Preview
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleWhatsAppShare}
              className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-medium flex items-center space-x-1"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container (Styled in clean black/white for physical thermal/A4 printing) */}
        <div className="p-3 sm:p-6 overflow-y-auto bg-slate-950 flex justify-center">
          <div
            ref={printRef}
            className="printable-invoice bg-white text-slate-950 p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-xl font-sans text-xs border border-slate-200"
          >
            {/* Shop Header */}
            <div className="text-center border-b-2 border-slate-900 pb-4 mb-4">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <span className="font-black text-2xl tracking-tight uppercase text-blue-900">
                  {settings.shopName || 'Sumaiya telecom'}
                </span>
              </div>
              <p className="font-semibold text-slate-700 text-xs uppercase tracking-wide">
                Mobile Accessories • Spare Parts • Display / LCD • Expert Repairing
              </p>
              <p className="text-[11px] text-slate-600 mt-1 max-w-md mx-auto">
                {settings.address || 'Station Road, Main Market, Rampurhat'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-medium text-slate-800 mt-1.5">
                <span>Proprietor: <strong>{settings.ownerName}</strong></span>
                <span>•</span>
                <span>Phone / WhatsApp: <strong>{settings.phone}</strong></span>
                {settings.gstNumber && (
                  <>
                    <span>•</span>
                    <span>GSTIN: <strong>{settings.gstNumber}</strong></span>
                  </>
                )}
              </div>
            </div>

            {/* Document Title Badge */}
            <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-lg border border-slate-300 mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Document Type
                </span>
                <span className="font-bold text-sm text-slate-900 uppercase">
                  {title}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Reference No.
                </span>
                <span className="font-mono font-bold text-sm text-blue-950">
                  {docId}
                </span>
              </div>
            </div>

            {/* Customer & Job Info */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-200 text-xs">
              <div>
                <div className="font-bold text-slate-500 text-[10px] uppercase mb-1">
                  Customer Details:
                </div>
                <div className="font-bold text-slate-900 text-sm">{customerName}</div>
                <div className="text-slate-700 font-medium">Ph: {customerPhone}</div>
                {customerAddress && customerAddress !== '-' && (
                  <div className="text-slate-600 text-[11px]">{customerAddress}</div>
                )}
              </div>

              <div className="text-right">
                <div className="font-bold text-slate-500 text-[10px] uppercase mb-1">
                  Transaction Info:
                </div>
                <div>Date: <strong>{formatDate(docDate)}</strong></div>
                {repair?.expectedDeliveryDate && (
                  <div>Exp. Delivery: <strong>{formatDate(repair.expectedDeliveryDate)}</strong></div>
                )}
                {repair?.assignedTechnician && (
                  <div className="text-[11px] text-slate-600">Tech: {repair.assignedTechnician}</div>
                )}
              </div>
            </div>

            {/* Repair Device Specific Card if applicable */}
            {repair && (
              <div className="my-3 p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs space-y-1">
                <div className="font-bold text-blue-950 flex items-center justify-between">
                  <span>Device: {repair.brand} {repair.model} ({repair.color || 'Standard'})</span>
                  <span className="text-[10px] px-2 py-0.5 bg-blue-200 text-blue-900 rounded font-bold uppercase">
                    {repair.status}
                  </span>
                </div>
                {repair.imei1 && (
                  <div className="text-slate-700 font-mono text-[11px]">
                    IMEI 1: {repair.imei1} {repair.imei2 ? `| IMEI 2: ${repair.imei2}` : ''}
                  </div>
                )}
                <div className="text-slate-800">
                  <strong>Complaint / Problem:</strong> {repair.problemDescription}
                </div>
                {repair.deviceCondition && repair.deviceCondition.length > 0 && (
                  <div className="text-[11px] text-slate-600">
                    <strong>Condition Noted:</strong> {repair.deviceCondition.join(', ')}
                  </div>
                )}
                <div className="text-[11px] text-slate-600 flex flex-wrap gap-2 pt-0.5">
                  <span>SIM: <strong>{repair.simReceived ? 'Received' : 'No'}</strong></span>
                  <span>•</span>
                  <span>SD Card: <strong>{repair.sdCardReceived ? 'Received' : 'No'}</strong></span>
                  <span>•</span>
                  <span>Charger: <strong>{repair.chargerReceived ? 'Received' : 'No'}</strong></span>
                </div>
              </div>
            )}

            {/* Itemized Table */}
            <div className="my-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-900 text-[10px] uppercase text-slate-600">
                    <th className="py-1.5">SN</th>
                    <th className="py-1.5">Item / Service Description</th>
                    <th className="py-1.5 text-center">Qty</th>
                    <th className="py-1.5 text-right">Rate</th>
                    <th className="py-1.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {invoice?.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, index) => (
                      <tr key={item.id || index}>
                        <td className="py-2 text-slate-500">{index + 1}</td>
                        <td className="py-2 font-medium text-slate-900">{item.description}</td>
                        <td className="py-2 text-center">{item.quantity}</td>
                        <td className="py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-2 text-right font-bold">{formatCurrency(item.total)}</td>
                      </tr>
                    ))
                  ) : repair ? (
                    <tr>
                      <td className="py-2 text-slate-500">1</td>
                      <td className="py-2 font-medium text-slate-900">
                        Repair & Service: {repair.brand} {repair.model} ({repair.problemDescription})
                      </td>
                      <td className="py-2 text-center">1</td>
                      <td className="py-2 text-right">{formatCurrency(repair.estimatedCost)}</td>
                      <td className="py-2 text-right font-bold">{formatCurrency(repair.estimatedCost)}</td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-3 text-center text-slate-400">
                        No bill items
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="border-t-2 border-slate-900 pt-3 flex justify-between items-start">
              <div className="max-w-[260px] text-[10px] text-slate-600 space-y-1">
                <div>
                  Payment Mode: <strong>Cash / UPI / GPay / PhonePe</strong>
                </div>
                {repair?.warrantyDays ? (
                  <div className="p-1.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 font-semibold">
                    ✓ Warranty: {repair.warrantyDays} Days Testing Warranty
                  </div>
                ) : null}
              </div>

              <div className="w-56 space-y-1 text-xs text-right">
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-semibold">
                    {formatCurrency(invoice?.subtotal || repair?.estimatedCost)}
                  </span>
                </div>

                {(invoice?.discount || 0) > 0 && (
                  <div className="flex justify-between py-0.5 text-emerald-700">
                    <span>Discount:</span>
                    <span>- {formatCurrency(invoice?.discount)}</span>
                  </div>
                )}

                {(invoice?.taxAmount || 0) > 0 && (
                  <div className="flex justify-between py-0.5 text-slate-600">
                    <span>GST ({invoice?.taxPercent}%):</span>
                    <span>+ {formatCurrency(invoice?.taxAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between py-1 border-t border-slate-300 font-black text-sm text-slate-950">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(invoice?.totalAmount || repair?.estimatedCost)}</span>
                </div>

                <div className="flex justify-between py-0.5 text-blue-900 font-bold">
                  <span>Paid / Advance:</span>
                  <span>{formatCurrency(invoice?.paidAmount || repair?.advancePaid)}</span>
                </div>

                <div className="flex justify-between py-1 border-t border-slate-900 font-black text-base text-red-600">
                  <span>Due Balance:</span>
                  <span>{formatCurrency(invoice?.dueAmount || repair?.remainingAmount)}</span>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="mt-6 pt-3 border-t border-slate-200 text-[9px] text-slate-500 leading-tight space-y-1">
              <div className="font-bold text-slate-700 uppercase">Terms & Conditions:</div>
              <p>1. Customer is advised to take full data backup. Shop is not liable for data loss during repair.</p>
              <p>2. Physical, water, or electric spike damage is not covered under warranty.</p>
              <p>3. Unclaimed devices after 30 days of completion notification will not be held by the shop.</p>
            </div>

            {/* Signatures */}
            <div className="mt-8 pt-4 flex justify-between items-end text-[10px] text-slate-700 border-t border-slate-200">
              <div className="text-center w-36">
                <div className="border-b border-slate-400 mb-1 h-8"></div>
                <span>Customer Signature</span>
              </div>
              <div className="text-center w-44">
                <div className="font-bold text-slate-900 uppercase">{settings.shopName || 'Sumaiya telecom'}</div>
                <div className="border-b border-slate-400 mb-1 h-6"></div>
                <span>Authorized Signatory</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-850 flex justify-between items-center text-xs text-slate-400">
          <span>Formatted for standard A4, A5, and 80mm receipt printers</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
