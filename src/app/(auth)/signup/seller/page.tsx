'use client';

import { useState, useTransition, useRef } from 'react';
import { signupSeller } from '@/app/actions/auth';
import Link from 'next/link';
import {
  Eye, EyeOff, Loader2, Store, Upload,
  ChevronRight, ChevronLeft, Check,
  User, Building2, MapPin, FileText,
} from 'lucide-react';

const STEPS = [
  { title: 'Personal Info',    subtitle: 'Account credentials',        icon: User },
  { title: 'Business Details', subtitle: 'About your business',        icon: Building2 },
  { title: 'Business Address', subtitle: 'Where you operate',          icon: MapPin },
  { title: 'Verification',     subtitle: 'Upload business documents',  icon: FileText },
];

type FormState = {
  name: string; email: string; password: string; contact_phone: string;
  business_name: string; gst_number: string;
  address: string; city: string; state: string; pincode: string;
  gst_doc: File | null;
};

export default function SellerSignupPage() {
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [gstFileName, setGstFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>({
    name: '', email: '', password: '', contact_phone: '',
    business_name: '', gst_number: '',
    address: '', city: '', state: '', pincode: '',
    gst_doc: null,
  });

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setFieldErrors(fe => { const n = { ...fe }; delete n[field]; return n; });
  };

  const validateStep = (): boolean => {
    const errs: Record<string, string> = {};
    if (step === 0) {
      if (form.name.trim().length < 2) errs.name = 'Min. 2 characters';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email';
      if (form.password.length < 8) errs.password = 'Min. 8 characters';
      if (form.contact_phone.replace(/\D/g, '').length < 10) errs.contact_phone = 'Enter a valid 10-digit number';
    }
    if (step === 1) {
      if (form.business_name.trim().length < 2) errs.business_name = 'Business name is required';
    }
    if (step === 2) {
      if (form.address.trim().length < 5) errs.address = 'Enter your business address';
      if (form.city.trim().length < 2) errs.city = 'Enter your city';
      if (form.state.trim().length < 2) errs.state = 'Enter your state';
      if (form.pincode.replace(/\D/g, '').length < 6) errs.pincode = 'Enter a valid 6-digit pincode';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => { if (validateStep()) setStep(s => s + 1); };
  const prev = () => setStep(s => s - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    const fd = new FormData();
    (Object.entries(form) as [string, string | File | null][]).forEach(([k, v]) => {
      if (v instanceof File) fd.append(k, v);
      else if (v !== null) fd.append(k, v);
    });
    startTransition(async () => {
      const result = await signupSeller(undefined, fd);
      if (!result) return;
      if (result.message) setServerError(result.message);
      if (result.errors) {
        const errMap = Object.fromEntries(Object.entries(result.errors).map(([f, msgs]) => [f, msgs[0]]));
        setFieldErrors(errMap);
        const keys = Object.keys(errMap);
        if (keys.some(f => ['name', 'email', 'password', 'contact_phone'].includes(f))) setStep(0);
        else if (keys.some(f => ['business_name', 'gst_number'].includes(f))) setStep(1);
        else if (keys.some(f => ['address', 'city', 'state', 'pincode'].includes(f))) setStep(2);
      }
    });
  };

  const ic = (field: string) =>
    `w-full px-3.5 py-2 bg-white border rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition ${
      fieldErrors[field] ? 'border-red-300 bg-red-50' : 'border-gray-200'
    }`;

  const Err = ({ f }: { f: string }) =>
    fieldErrors[f] ? <p className="mt-1.5 text-red-600 text-xs">{fieldErrors[f]}</p> : null;

  return (
    <div className="w-full max-w-md">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-7 py-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Store className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Become a Brand Owner</h1>
            <p className="text-gray-500 text-xs">List verified products on Trusta</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center mb-5">
          {STEPS.map(({ icon: Icon }, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all shrink-0 ${
                i < step   ? 'bg-red-600  border-red-600' :
                i === step ? 'bg-red-600  border-red-600' :
                             'bg-gray-100 border-gray-200'
              }`}>
                {i < step
                  ? <Check className="w-3.5 h-3.5 text-white" />
                  : <Icon className={`w-3.5 h-3.5 ${i === step ? 'text-white' : 'text-gray-400'}`} />
                }
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-1.5 transition-colors ${i < step ? 'bg-red-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step label */}
        <div className="mb-4">
          <p className="text-[10px] text-red-600 uppercase tracking-widest font-semibold">
            Step {step + 1} of {STEPS.length} — {STEPS[step].subtitle}
          </p>
          <h2 className="text-base font-bold text-gray-900 mt-0.5">{STEPS[step].title}</h2>
        </div>

        {serverError && (
          <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs text-center">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1 */}
          {step === 0 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Your Name</label>
                  <input value={form.name} onChange={set('name')} placeholder="Ankit Verma" className={ic('name')} />
                  <Err f="name" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Contact Phone</label>
                  <input type="tel" value={form.contact_phone} onChange={set('contact_phone')} placeholder="9876543210" className={ic('contact_phone')} />
                  <Err f="contact_phone" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email Address</label>
                <input type="email" value={form.email} onChange={set('email')} placeholder="business@example.com" className={ic('email')} />
                <Err f="email" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Min. 8 characters" className={`${ic('password')} pr-10`} />
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Err f="password" />
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 1 && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Business Name</label>
                <input value={form.business_name} onChange={set('business_name')} placeholder="TechPro Pvt Ltd" className={ic('business_name')} />
                <Err f="business_name" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">GST Number <span className="text-gray-400 font-normal">(Optional)</span></label>
                <input value={form.gst_number} onChange={set('gst_number')} placeholder="22AAAAA0000A1Z5" className={ic('gst_number')} />
              </div>
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-blue-700 text-xs leading-relaxed">Your GST number helps verify your business. You can add it later from your brand owner dashboard.</p>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 2 && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Street Address</label>
                <input value={form.address} onChange={set('address')} placeholder="123, Industrial Area, Sector 4" className={ic('address')} />
                <Err f="address" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                  <input value={form.city} onChange={set('city')} placeholder="Delhi" className={ic('city')} />
                  <Err f="city" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
                  <input value={form.state} onChange={set('state')} placeholder="Delhi" className={ic('state')} />
                  <Err f="state" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Pincode</label>
                <input value={form.pincode} onChange={set('pincode')} placeholder="110001" maxLength={6} className={ic('pincode')} />
                <Err f="pincode" />
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 3 && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">GST / Business Document</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-4 p-4 border-2 border-dashed border-gray-200 hover:border-red-300 hover:bg-red-50/50 rounded-xl cursor-pointer transition-colors group"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${gstFileName ? 'bg-green-50' : 'bg-gray-100 group-hover:bg-red-100'}`}>
                    {gstFileName ? <Check className="w-5 h-5 text-green-600" /> : <Upload className="w-5 h-5 text-gray-400 group-hover:text-red-500" />}
                  </div>
                  <div>
                    {gstFileName ? (
                      <>
                        <p className="text-green-700 text-sm font-medium">{gstFileName}</p>
                        <p className="text-gray-400 text-xs">Click to replace</p>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-700 text-sm">Upload GST certificate or business ID</p>
                        <p className="text-gray-400 text-xs">PDF, JPG, PNG — max 5 MB</p>
                      </>
                    )}
                  </div>
                </div>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                  onChange={e => { const f = e.target.files?.[0] ?? null; setForm(p => ({ ...p, gst_doc: f })); setGstFileName(f?.name ?? ''); }} />
              </div>
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-amber-700 text-xs text-center leading-relaxed">
                  Your application will be reviewed within 1–2 business days and you'll be notified via email once approved.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className={`flex gap-3 mt-5 ${step > 0 ? 'justify-between' : 'justify-end'}`}>
            {step > 0 && (
              <button type="button" onClick={prev}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl font-semibold text-sm transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next}
                className="flex items-center gap-1.5 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="submit" disabled={isPending}
                className="flex items-center justify-center gap-1.5 px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Store className="w-4 h-4" />}
                {isPending ? 'Submitting…' : 'Submit Application'}
              </button>
            )}
          </div>
        </form>

        <p className="mt-4 text-center text-gray-500 text-xs">
          Already have an account?{' '}
          <Link href="/login" className="text-red-600 hover:text-red-700 font-medium transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
