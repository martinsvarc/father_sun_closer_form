'use client';

import { useState } from 'react';

type DispositionOutcome = 'Close' | 'Follow Up' | 'Shade Fail' | 'Credit Fail';
type FinancingType = 'Loan' | 'PPA' | 'Lease' | 'Cash' | '';

interface FormData {
  // Top-level identifier fields
  closerName: string;
  homeownerName: string;
  phone: string;
  // Show up
  showUp: boolean | null;
  noShowReason: string;
  verificationPic: File | null;
  // Outcome
  outcome: DispositionOutcome | null;
  // Close details
  kw: string;
  ppw: string;
  adders: string;
  adderAmount: string;
  financingType: FinancingType;
  // Follow up
  followUpDate: string;
  followUpTime: string;
  // Always visible
  closerNotes: string;
  recording: File | null;
}

const initialFormData: FormData = {
  closerName: '',
  homeownerName: '',
  phone: '',
  showUp: null,
  noShowReason: '',
  verificationPic: null,
  outcome: null,
  kw: '',
  ppw: '',
  adders: '',
  adderAmount: '',
  financingType: '',
  followUpDate: '',
  followUpTime: '',
  closerNotes: '',
  recording: null,
};

export default function CloserForm() {
  const [formData, setFormData] = useState<FormData>({ ...initialFormData });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  const financingOptions: { value: FinancingType; label: string; description: string }[] = [
    { value: 'Loan', label: 'Loan', description: 'Customer owns system, pays monthly' },
    { value: 'PPA', label: 'PPA', description: 'Power Purchase Agreement' },
    { value: 'Lease', label: 'Lease', description: 'Monthly lease payments' },
    { value: 'Cash', label: 'Cash', description: 'Paid in full upfront' },
  ];

  const outcomeStyles: Record<DispositionOutcome, { normal: React.CSSProperties; active: React.CSSProperties }> = {
    'Close': {
      normal: { backgroundColor: '#dcfce7', color: '#15803d', border: '2px solid rgba(21, 128, 61, 0.2)' },
      active: { backgroundColor: '#15803d', color: 'white', border: '2px solid #15803d' },
    },
    'Follow Up': {
      normal: { backgroundColor: '#fef3e2', color: '#b5651d', border: '2px solid rgba(181, 101, 29, 0.2)' },
      active: { backgroundColor: '#b5651d', color: 'white', border: '2px solid #b5651d' },
    },
    'Shade Fail': {
      normal: { backgroundColor: '#ffedd5', color: '#c2410c', border: '2px solid rgba(194, 65, 12, 0.2)' },
      active: { backgroundColor: '#c2410c', color: 'white', border: '2px solid #c2410c' },
    },
    'Credit Fail': {
      normal: { backgroundColor: '#f5d4d8', color: '#8b2635', border: '2px solid rgba(139, 38, 53, 0.2)' },
      active: { backgroundColor: '#8b2635', color: 'white', border: '2px solid #8b2635' },
    },
  };

  const outcomes: DispositionOutcome[] = ['Close', 'Follow Up', 'Shade Fail', 'Credit Fail'];

  // Generate Google Calendar link for follow-up
  const generateFollowUpCalendarLink = () => {
    if (!formData.followUpDate || !formData.followUpTime) return '';

    const [year, month, day] = formData.followUpDate.split('-').map(Number);
    const [hours, minutes] = formData.followUpTime.split(':').map(Number);

    const startDate = new Date(year, month - 1, day, hours, minutes);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const formatDate = (d: Date) => {
      return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const customerName = formData.homeownerName || 'Customer';
    const title = encodeURIComponent(`Follow Up - ${customerName}`);
    const details = encodeURIComponent(
      `Follow-up appointment for ${customerName}\n\n` +
      (formData.phone ? `Phone: ${formData.phone}\n` : '') +
      (formData.closerNotes ? `\nNotes: ${formData.closerNotes}` : '')
    );

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${details}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        closerName: formData.closerName,
        homeownerName: formData.homeownerName,
        phone: `+1${formData.phone}`,
        showUp: formData.showUp,
        noShowReason: formData.showUp === false ? (formData.noShowReason || null) : null,
        outcome: formData.showUp === true ? formData.outcome : null,
        closeDetails: formData.outcome === 'Close' ? {
          kw: formData.kw ? parseFloat(formData.kw) : null,
          ppw: formData.ppw ? parseFloat(formData.ppw) : null,
          adders: formData.adders || null,
          adderAmount: formData.adderAmount ? parseFloat(formData.adderAmount) : null,
          financingType: formData.financingType || null,
        } : null,
        followUp: formData.outcome === 'Follow Up' ? {
          date: formData.followUpDate || null,
          time: formData.followUpTime || null,
        } : null,
        closerNotes: formData.closerNotes || null,
        submittedAt: new Date().toISOString(),
      };

      const response = await fetch('/api/disposition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to submit disposition');
      }

      // Show thank you, then reset
      setShowThankYou(true);
      setTimeout(() => {
        setShowThankYou(false);
        setFormData({ ...initialFormData });
        // Reset file inputs
        const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
        fileInputs.forEach((input) => (input.value = ''));
      }, 3000);
    } catch (error) {
      console.error('Failed to submit disposition:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Thank you screen
  if (showThankYou) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#faf9f7' }}>
        <div className="text-center">
          <div
            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#dcfce7' }}
          >
            <svg className="w-10 h-10" style={{ color: '#15803d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-wide mb-2" style={{ color: '#2a1f1b' }}>
            THANK YOU
          </h1>
          <p className="text-sm" style={{ color: '#78716c' }}>
            Your disposition has been submitted successfully.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-10" style={{ backgroundColor: '#faf9f7' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-1.5 h-10 rounded-full"
              style={{ background: 'linear-gradient(to bottom, #b5651d, #c9a227)' }}
            />
            <h1 className="text-4xl font-bold tracking-wide" style={{ color: '#2a1f1b' }}>
              AFTER APPOINTMENT
            </h1>
          </div>
          <p className="text-sm ml-[18px]" style={{ color: '#a8a29e' }}>
            Record the outcome of your appointment
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Closer Name, Homeowner Name, Phone */}
          <div
            className="rounded-lg p-6 shadow-lg"
            style={{ backgroundColor: 'white', border: '2px solid #e8e4df' }}
          >
            <h2 className="text-xl font-bold tracking-wide mb-4" style={{ color: '#2a1f1b' }}>
              APPOINTMENT INFO
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: '#78716c' }}>
                  Closer Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.closerName}
                  onChange={(e) => setFormData({ ...formData, closerName: e.target.value })}
                  placeholder="Your name..."
                  className="w-full px-4 py-3 rounded text-sm transition-all outline-none"
                  style={{ border: '2px solid #e8e4df' }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#b5651d';
                    e.target.style.boxShadow = '0 0 0 3px rgba(181,101,29,0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e8e4df';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: '#78716c' }}>
                  Homeowner Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.homeownerName}
                  onChange={(e) => setFormData({ ...formData, homeownerName: e.target.value })}
                  placeholder="Customer's name..."
                  className="w-full px-4 py-3 rounded text-sm transition-all outline-none"
                  style={{ border: '2px solid #e8e4df' }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#b5651d';
                    e.target.style.boxShadow = '0 0 0 3px rgba(181,101,29,0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e8e4df';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: '#78716c' }}>
                  Phone (Identifier)
                </label>
                <div
                  className="flex items-center w-full rounded text-sm transition-all overflow-hidden"
                  style={{ border: '2px solid #e8e4df' }}
                >
                  <span
                    className="px-3 py-3 font-bold text-sm select-none flex-shrink-0"
                    style={{ backgroundColor: '#f5f5f4', color: '#2a1f1b', borderRight: '2px solid #e8e4df' }}
                  >
                    +1
                  </span>
                  <input
                    type="tel"
                    required
                    inputMode="numeric"
                    value={formData.phone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData({ ...formData, phone: digits });
                    }}
                    placeholder="2282430122"
                    className="w-full px-3 py-3 text-sm outline-none"
                    style={{ border: 'none' }}
                    onFocus={(e) => {
                      const container = e.target.parentElement as HTMLElement;
                      container.style.borderColor = '#b5651d';
                      container.style.boxShadow = '0 0 0 3px rgba(181,101,29,0.15)';
                    }}
                    onBlur={(e) => {
                      const container = e.target.parentElement as HTMLElement;
                      container.style.borderColor = '#e8e4df';
                      container.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Show Up Section */}
          <div
            className="rounded-lg p-6 shadow-lg"
            style={{ backgroundColor: 'white', border: '2px solid #e8e4df' }}
          >
            <h2 className="text-xl font-bold tracking-wide mb-4" style={{ color: '#2a1f1b' }}>
              DID THE CUSTOMER SHOW UP?
            </h2>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, showUp: true })}
                className="flex-1 py-3 px-4 rounded font-bold uppercase tracking-wider transition-all"
                style={
                  formData.showUp === true
                    ? { backgroundColor: '#1e40af', color: 'white', border: '2px solid #1e40af' }
                    : { backgroundColor: 'white', color: '#5c554b', border: '2px solid #e8e4df' }
                }
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, showUp: false, recording: null })}
                className="flex-1 py-3 px-4 rounded font-bold uppercase tracking-wider transition-all"
                style={
                  formData.showUp === false
                    ? { backgroundColor: '#8b2635', color: 'white', border: '2px solid #8b2635' }
                    : { backgroundColor: 'white', color: '#5c554b', border: '2px solid #e8e4df' }
                }
              >
                No
              </button>
            </div>

            {/* No-Show Fields */}
            {formData.showUp === false && (
              <div className="mt-5 pt-5 space-y-4" style={{ borderTop: '1px solid #f5f5f4' }}>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: '#78716c' }}>
                    Reason for No-Show
                  </label>
                  <input
                    type="text"
                    value={formData.noShowReason}
                    onChange={(e) => setFormData({ ...formData, noShowReason: e.target.value })}
                    placeholder="Enter the reason..."
                    className="w-full px-4 py-3 rounded text-sm transition-all outline-none"
                    style={{ border: '2px solid #e8e4df' }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#b5651d';
                      e.target.style.boxShadow = '0 0 0 3px rgba(181,101,29,0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e8e4df';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: '#78716c' }}>
                    Verification Photo
                  </label>
                  <div
                    className="rounded-lg p-6 text-center transition-colors cursor-pointer"
                    style={{ border: '2px dashed #d6d3d1' }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData({ ...formData, verificationPic: e.target.files?.[0] || null })}
                      className="hidden"
                      id="verification-pic"
                    />
                    <label htmlFor="verification-pic" className="cursor-pointer">
                      {formData.verificationPic ? (
                        <div className="text-sm font-bold uppercase tracking-wider" style={{ color: '#7c3aed' }}>
                          {formData.verificationPic.name}
                        </div>
                      ) : (
                        <>
                          <div
                            className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: '#f5f5f4' }}
                          >
                            <svg className="w-6 h-6" style={{ color: '#a8a29e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div className="text-sm" style={{ color: '#a8a29e' }}>Click to upload verification photo</div>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Outcome Section */}
          {formData.showUp === true && (
            <div
              className="rounded-lg p-6 shadow-lg"
              style={{ backgroundColor: 'white', border: '2px solid #e8e4df' }}
            >
              <h2 className="text-xl font-bold tracking-wide mb-4" style={{ color: '#2a1f1b' }}>
                OUTCOME
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {outcomes.map((outcome) => (
                  <button
                    key={outcome}
                    type="button"
                    onClick={() => setFormData({ ...formData, outcome })}
                    className="py-3 px-4 rounded font-bold uppercase tracking-wider transition-all"
                    style={
                      formData.outcome === outcome
                        ? outcomeStyles[outcome].active
                        : outcomeStyles[outcome].normal
                    }
                  >
                    {outcome}
                  </button>
                ))}
              </div>

              {/* Close Details */}
              {formData.outcome === 'Close' && (
                <div className="mt-5 pt-5 space-y-4" style={{ borderTop: '1px solid #f5f5f4' }}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: '#78716c' }}>
                        KW (System Size)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.kw}
                        onChange={(e) => setFormData({ ...formData, kw: e.target.value })}
                        placeholder="e.g., 8.5"
                        className="w-full px-4 py-3 rounded text-sm transition-all outline-none"
                        style={{ border: '2px solid #e8e4df' }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#b5651d';
                          e.target.style.boxShadow = '0 0 0 3px rgba(181,101,29,0.15)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e8e4df';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: '#78716c' }}>
                        PPW (Price Per Watt)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.ppw}
                        onChange={(e) => setFormData({ ...formData, ppw: e.target.value })}
                        placeholder="e.g., 3.50"
                        className="w-full px-4 py-3 rounded text-sm transition-all outline-none"
                        style={{ border: '2px solid #e8e4df' }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#b5651d';
                          e.target.style.boxShadow = '0 0 0 3px rgba(181,101,29,0.15)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e8e4df';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: '#78716c' }}>
                        Adder Description
                      </label>
                      <input
                        type="text"
                        value={formData.adders}
                        onChange={(e) => setFormData({ ...formData, adders: e.target.value })}
                        placeholder="e.g., Battery, Critter Guard"
                        className="w-full px-4 py-3 rounded text-sm transition-all outline-none"
                        style={{ border: '2px solid #e8e4df' }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#b5651d';
                          e.target.style.boxShadow = '0 0 0 3px rgba(181,101,29,0.15)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e8e4df';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: '#78716c' }}>
                        Adder Amount ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        value={formData.adderAmount}
                        onChange={(e) => setFormData({ ...formData, adderAmount: e.target.value })}
                        placeholder="e.g., 3000.00"
                        className="w-full px-4 py-3 rounded text-sm transition-all outline-none"
                        style={{ border: '2px solid #e8e4df' }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#b5651d';
                          e.target.style.boxShadow = '0 0 0 3px rgba(181,101,29,0.15)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e8e4df';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  </div>

                  {/* Financing Type */}
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: '#78716c' }}>
                      Financing Type
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {financingOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, financingType: option.value })}
                          className="py-3 px-3 rounded font-bold uppercase tracking-wider text-xs transition-all"
                          style={
                            formData.financingType === option.value
                              ? { backgroundColor: '#b5651d', color: 'white', border: '2px solid #b5651d' }
                              : { backgroundColor: 'white', color: '#78716c', border: '2px solid #e8e4df' }
                          }
                          title={option.description}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Follow Up Details */}
              {formData.outcome === 'Follow Up' && (
                <div className="mt-5 pt-5" style={{ borderTop: '1px solid #f5f5f4' }}>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: '#78716c' }}>
                    Follow-up Date & Time
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="date"
                      value={formData.followUpDate}
                      onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                      className="w-full px-4 py-3 rounded text-sm transition-all outline-none"
                      style={{ border: '2px solid #e8e4df' }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#b5651d';
                        e.target.style.boxShadow = '0 0 0 3px rgba(181,101,29,0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e8e4df';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <input
                      type="time"
                      value={formData.followUpTime}
                      onChange={(e) => setFormData({ ...formData, followUpTime: e.target.value })}
                      className="w-full px-4 py-3 rounded text-sm transition-all outline-none"
                      style={{ border: '2px solid #e8e4df' }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#b5651d';
                        e.target.style.boxShadow = '0 0 0 3px rgba(181,101,29,0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e8e4df';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  {formData.followUpDate && formData.followUpTime && (
                    <div className="mt-4">
                      <a
                        href={generateFollowUpCalendarLink()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-3 text-white font-bold uppercase tracking-wider rounded-lg shadow-lg transition-all duration-200"
                        style={{ background: 'linear-gradient(to right, #b5651d, #c9a227)' }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Add to Calendar
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Notes Section */}
          <div
            className="rounded-lg p-6 shadow-lg"
            style={{ backgroundColor: 'white', border: '2px solid #e8e4df' }}
          >
            <h2 className="text-xl font-bold tracking-wide mb-4" style={{ color: '#2a1f1b' }}>
              NOTES
            </h2>
            <textarea
              value={formData.closerNotes}
              onChange={(e) => setFormData({ ...formData, closerNotes: e.target.value })}
              placeholder="Add any additional notes about the appointment..."
              rows={4}
              className="w-full px-4 py-3 rounded text-sm transition-all resize-none outline-none"
              style={{ border: '2px solid #e8e4df' }}
              onFocus={(e) => {
                e.target.style.borderColor = '#b5651d';
                e.target.style.boxShadow = '0 0 0 3px rgba(181,101,29,0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e8e4df';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Recording Section - Only show if customer showed up */}
          {formData.showUp !== false && (
            <div
              className="rounded-lg p-6 shadow-lg"
              style={{ backgroundColor: 'white', border: '2px solid #e8e4df' }}
            >
              <h2 className="text-xl font-bold tracking-wide mb-4" style={{ color: '#2a1f1b' }}>
                CALL RECORDING
              </h2>
              <div
                className="rounded-lg p-6 text-center transition-colors"
                style={{ border: '2px dashed #d6d3d1' }}
              >
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setFormData({ ...formData, recording: e.target.files?.[0] || null })}
                  className="hidden"
                  id="recording"
                />
                <label htmlFor="recording" className="cursor-pointer">
                  {formData.recording ? (
                    <div className="text-sm font-bold uppercase tracking-wider" style={{ color: '#7c3aed' }}>
                      {formData.recording.name}
                    </div>
                  ) : (
                    <>
                      <div
                        className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: '#f5f5f4' }}
                      >
                        <svg className="w-6 h-6" style={{ color: '#a8a29e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                      <div className="text-sm" style={{ color: '#a8a29e' }}>Click to upload call recording</div>
                      <div className="text-xs mt-1" style={{ color: '#d6d3d1' }}>MP3, WAV, M4A supported</div>
                    </>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || formData.showUp === null}
            className="relative w-full py-4 px-6 rounded font-bold uppercase tracking-widest text-white transition-all overflow-hidden"
            style={{
              backgroundColor:
                isSubmitting || formData.showUp === null ? '#a8a29e' : '#2a1f1b',
              cursor: isSubmitting || formData.showUp === null ? 'not-allowed' : 'pointer',
            }}
          >
            {/* Accent line */}
            <div
              className="absolute bottom-0 left-0 right-0 h-1"
              style={{ background: 'linear-gradient(to right, #b5651d, #c9a227, #b5651d)' }}
            />
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting...
              </span>
            ) : (
              'Submit Disposition'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
