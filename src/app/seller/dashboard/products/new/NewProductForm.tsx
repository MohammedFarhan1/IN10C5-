'use client';

import { useActionState, useState } from 'react';
import type { ReactNode } from 'react';
import { createProduct } from '@/app/actions/seller';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SellerSidebar from '@/components/SellerSidebar';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight, Fingerprint, Info, Loader2, Save } from 'lucide-react';
import { sanitizeCode } from '@/lib/verification-id';

type SellerSummary = {
  business_name?: string | null;
  verification_status?: string | null;
};

const STEPS = [
  'Basic Product Info',
  'Manufacturing Details',
  'Pricing & Inventory',
  'Product Media',
  'Verification Identity',
] as const;

export default function NewProductForm({ seller }: { seller: SellerSummary | null }) {
  const [state, action, pending] = useActionState(createProduct, undefined);
  const [activeStep, setActiveStep] = useState(0);
  const [modelCode, setModelCode] = useState('');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <SellerSidebar seller={seller} />

          <main className="flex-1">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <Link href="/seller/dashboard/products" className="text-gray-400 hover:text-gray-900 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
                  <p className="text-sm text-gray-500 mt-1">Complete each section without losing your place.</p>
                </div>
              </div>
            </div>

            <div className="grid xl:grid-cols-[260px_1fr] gap-6">
              <aside className="bg-white border border-gray-200 rounded-2xl p-3 h-fit shadow-sm">
                {STEPS.map((step, index) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setActiveStep(index)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition ${
                      activeStep === index ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                      activeStep === index ? 'bg-white text-red-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-sm font-semibold">{step}</span>
                  </button>
                ))}
              </aside>

              <section className="bg-white border border-gray-200 rounded-2xl p-6 lg:p-8 shadow-sm">
                {state?.message && (
                  <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {state.message}
                  </div>
                )}
                {state?.success && (
                  <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
                    Product created successfully with verification identities.
                  </div>
                )}

                <form action={action} className="space-y-6">
                  <FormPanel active={activeStep === 0} title="Basic Product Info">
                    <div className="grid md:grid-cols-2 gap-5">
                      <Field name="name" label="Product Name" required placeholder="Sony WH-1000XM5" error={state?.errors?.name?.[0]} />
                      <Field name="brand" label="Brand" required placeholder="Sony" error={state?.errors?.brand?.[0]} />
                      <SelectField name="category" label="Category" error={state?.errors?.category?.[0]} />
                      <Field name="product_id" label="Product ID" placeholder="WB-001" mono error={state?.errors?.product_id?.[0]} />

                      {/* Model Code – used in verification IDs */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Model Code <span className="text-red-500">*</span>
                          <span className="ml-2 text-xs text-gray-400 font-normal">(used in every verification ID for this product)</span>
                        </label>
                        <input
                          name="product_code"
                          type="text"
                          required
                          value={modelCode}
                          onChange={(e) => setModelCode(sanitizeCode(e.target.value, true))}
                          placeholder="SNY-XM5"
                          maxLength={20}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition"
                        />
                        {/* Live ID preview */}
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-gray-400">Preview:</span>
                          <code className="text-xs font-mono text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                            TRU-{modelCode || '???'}-[VARIANT]-0001-[K7QF]
                          </code>
                        </div>
                        {state?.errors?.product_code && (
                          <p className="text-red-600 text-xs mt-1">{state.errors.product_code[0]}</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <TextareaField name="description" label="Product Description" required rows={4} placeholder="Detailed product description..." error={state?.errors?.description?.[0]} />
                      </div>
                      <div className="md:col-span-2">
                        <TextareaField
                          name="specifications"
                          label="Product Specifications"
                          rows={3}
                          placeholder='{"Color":"Black","Warranty":"1 year"}'
                          hint='Use JSON, for example {"Color":"Black","Material":"Aluminium"}'
                          mono
                        />
                      </div>
                    </div>
                  </FormPanel>

                  <FormPanel active={activeStep === 1} title="Manufacturing Details">
                    <div className="grid md:grid-cols-2 gap-5">
                      <Field name="batch_number" label="Batch Number" required placeholder="BATCH-2026-05" mono error={state?.errors?.batch_number?.[0]} />
                      <Field name="country_of_origin" label="Country of Origin" required placeholder="India" error={state?.errors?.country_of_origin?.[0]} />
                      <Field name="manufacturing_date" label="Manufacturing Date" type="date" error={state?.errors?.manufacturing_date?.[0]} />
                      <Field name="expiry_date" label="Expiry Date" type="date" error={state?.errors?.expiry_date?.[0]} />
                      <div className="md:col-span-2">
                        <TextareaField
                          name="manufacturing_details"
                          label="Manufacturing Details"
                          required
                          rows={4}
                          placeholder="Factory, line, compliance, and production notes..."
                          error={state?.errors?.manufacturing_details?.[0]}
                        />
                      </div>
                    </div>
                  </FormPanel>

                  <FormPanel active={activeStep === 2} title="Pricing & Inventory">
                    <div className="grid md:grid-cols-3 gap-5">
                      <Field name="price" label="Price" type="number" required min="0" placeholder="29990" error={state?.errors?.price?.[0]} />
                      <Field name="compare_price" label="Compare Price" type="number" min="0" placeholder="34990" error={state?.errors?.compare_price?.[0]} />
                      <Field name="quantity" label="Quantity" type="number" required min="0" placeholder="100" error={state?.errors?.quantity?.[0]} />
                    </div>
                  </FormPanel>

                  <FormPanel active={activeStep === 3} title="Product Media">
                    <TextareaField
                      name="image_url"
                      label="Product Images"
                      rows={6}
                      placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                      hint="Add multiple URLs separated by commas or newlines. The first one will be the main image."
                      mono
                      error={state?.errors?.image_url?.[0]}
                    />
                  </FormPanel>

                  <FormPanel active={activeStep === 4} title="Verification Identity">
                    {/* Hidden field – no longer used but kept for action compat */}
                    <input type="hidden" name="verification_id" value={modelCode || 'AUTO'} />

                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 mb-5">
                      <div className="flex items-start gap-3">
                        <Fingerprint className="w-8 h-8 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-gray-900 text-sm font-bold mb-1">How Trusta Verification IDs work</p>
                          <p className="text-gray-600 text-xs leading-relaxed">
                            Every physical unit gets a unique ID in the format{' '}
                            <code className="font-mono text-blue-700 bg-blue-100 px-1 py-0.5 rounded">
                              TRU-{modelCode || 'MODEL'}-VARIANT-0001-K7QF
                            </code>
                            . After saving this product, go to each variant and click <strong>"Generate Verification IDs"</strong> to create and download the printed labels.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {[
                        { step: '1', text: 'Save this product with a Model Code (set in Basic Info above).' },
                        { step: '2', text: 'Open a variant and enter a short Variant Code (e.g. BLK, 128GB).' },
                        { step: '3', text: 'Click "Generate Verification IDs" and set the quantity.' },
                        { step: '4', text: 'Download the CSV / print the table and attach IDs to physical units.' },
                        { step: '5', text: 'Buyers scan or type their ID on trusta.in/verify to confirm authenticity.' },
                      ].map(({ step, text }) => (
                        <div key={step} className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {step}
                          </span>
                          <p className="text-gray-600 text-sm pt-0.5">{text}</p>
                        </div>
                      ))}
                    </div>

                    {!modelCode && (
                      <div className="mt-5 flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs">
                        <Info className="w-4 h-4 flex-shrink-0" />
                        Go back to <strong>Basic Product Info</strong> and set a Model Code to enable ID generation.
                      </div>
                    )}
                  </FormPanel>

                  <div className="pt-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveStep((step) => Math.max(0, step - 1))}
                        disabled={activeStep === 0}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 text-gray-600 font-medium text-sm transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" /> Previous
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveStep((step) => Math.min(STEPS.length - 1, step + 1))}
                        disabled={activeStep === STEPS.length - 1}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 text-gray-600 font-medium text-sm transition-colors"
                      >
                        Next <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link href="/seller/dashboard/products" className="px-5 py-2.5 rounded-xl text-gray-500 font-medium hover:bg-gray-100 transition-colors">
                        Cancel
                      </Link>
                      <button type="submit" disabled={pending} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors shadow-sm">
                        {pending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {pending ? 'Saving...' : 'Save Product'}
                      </button>
                    </div>
                  </div>
                </form>
              </section>
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function FormPanel({ active, title, children }: { active: boolean; title: string; children: ReactNode }) {
  return (
    <section className={active ? 'block' : 'hidden'}>
      <div className="mb-5">
        <p className="text-xs text-red-600 uppercase tracking-widest font-bold">Product Setup</p>
        <h2 className="text-xl font-bold text-gray-900 mt-1">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({
  name,
  label,
  type = 'text',
  placeholder,
  required,
  min,
  mono,
  error,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  min?: string;
  mono?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        min={min}
        placeholder={placeholder}
        className={`w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition ${mono ? 'font-mono' : ''}`}
      />
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}

function TextareaField({
  name,
  label,
  placeholder,
  rows,
  required,
  hint,
  mono,
  error,
}: {
  name: string;
  label: string;
  placeholder?: string;
  rows: number;
  required?: boolean;
  hint?: string;
  mono?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-gray-400 text-xs mb-2">{hint}</p>}
      <textarea
        name={name}
        required={required}
        rows={rows}
        placeholder={placeholder}
        className={`w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition ${mono ? 'font-mono' : ''}`}
      />
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}

function SelectField({ name, label, error }: { name: string; label: string; error?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <select name={name} required className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition appearance-none">
        <option value="electronics">Electronics</option>
        <option value="fashion">Fashion</option>
        <option value="home">Home & Kitchen</option>
        <option value="automotive">Automotive</option>
        <option value="appliances">Appliances</option>
        <option value="furniture">Furniture</option>
      </select>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}
