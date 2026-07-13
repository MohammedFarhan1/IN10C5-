'use client';

import { useState, useTransition } from 'react';
import { bulkUploadProductsWithVariants } from '@/app/actions/seller';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SellerSidebar from '@/components/SellerSidebar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Upload, FileCode, CheckCircle2, AlertCircle, Copy, Sparkles } from 'lucide-react';

const EXAMPLE_JSON = `[
  {
    "product_id": "TSHIRT-OVERSIZED-001",
    "product_name": "Oversized Cotton T-Shirt",
    "brand": "Vericart Basics",
    "category": "Clothing",
    "description": "Heavyweight cotton oversized t-shirt for everyday wear.",
    "main_image": "https://images.example.com/products/tshirt-front.jpg",
    "gallery_images": [
      "https://images.example.com/products/tshirt-back.jpg"
    ],
    "variants": [
      {
        "custom_variant_id": "BLK-M",
        "size": "M",
        "color": "Black",
        "price": 799,
        "mrp": 999,
        "stock_quantity": 25
      }
    ]
  },
  {
    "product_id": "SNKR-URBAN-002",
    "product_name": "Urban Street Sneakers",
    "brand": "Vericart Footwear",
    "category": "Footwear",
    "description": "Lightweight urban sneakers designed for daily comfort and street-style fashion.",
    "main_image": "https://images.example.com/products/sneaker-main.jpg",
    "gallery_images": [
      "https://images.example.com/products/sneaker-side.jpg",
      "https://images.example.com/products/sneaker-top.jpg"
    ],
    "variants": [
      {
        "custom_variant_id": "WHT-42",
        "size": "42",
        "color": "White",
        "price": 2499,
        "mrp": 2999,
        "stock_quantity": 18
      },
      {
        "custom_variant_id": "BLK-43",
        "size": "43",
        "color": "Black",
        "price": 2499,
        "mrp": 2999,
        "stock_quantity": 12
      }
    ]
  }
]`;

export default function BulkUploadForm({ seller }: { seller: any }) {
  const router = useRouter();
  const [jsonText, setJsonText] = useState('');
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{ count: number; variantCount: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);

  let parsedCount = 0;
  let parsedVariantCount = 0;
  let isValidJson = false;

  if (jsonText.trim()) {
    try {
      const parsed = JSON.parse(jsonText);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      parsedCount = arr.length;
      arr.forEach(item => {
        if (Array.isArray(item?.variants)) {
          parsedVariantCount += item.variants.length;
        }
      });
      isValidJson = true;
    } catch {
      isValidJson = false;
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        setJsonText(result);
        setErrorMessage(null);
      }
    };
    reader.readAsText(file);
  };

  const handleCopyExample = () => {
    navigator.clipboard.writeText(EXAMPLE_JSON);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLoadExample = () => {
    setJsonText(EXAMPLE_JSON);
    setErrorMessage(null);
  };

  const handleSubmit = () => {
    setErrorMessage(null);
    setSuccessResult(null);

    if (!jsonText.trim()) {
      setErrorMessage('Please paste or upload a JSON payload.');
      return;
    }

    startTransition(async () => {
      const res = await bulkUploadProductsWithVariants(jsonText);
      if (res.success) {
        setSuccessResult({ count: res.count ?? 0, variantCount: res.variantCount ?? 0 });
        setTimeout(() => {
          router.push('/seller/dashboard/products');
        }, 2000);
      } else {
        setErrorMessage(res.error || 'Failed to bulk upload products.');
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <SellerSidebar seller={seller} />

          <main className="flex-1">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Link href="/seller/dashboard/products" className="text-gray-400 hover:text-gray-900 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Bulk Upload Products</h1>
              </div>
              <button
                onClick={() => setShowTemplate(!showTemplate)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
              >
                <FileCode className="w-4 h-4 text-red-600" />
                {showTemplate ? 'Hide Template' : 'View Template & Guidelines'}
              </button>
            </div>

            {/* Template / Guidelines */}
            {showTemplate && (
              <div className="mb-8 p-6 bg-blue-50 border border-blue-100 rounded-2xl shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div>
                    <h3 className="text-gray-900 font-semibold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" /> JSON Structure & Variant Mapping
                    </h3>
                    <p className="text-gray-500 text-xs mt-1">
                      Custom keys like <code className="text-blue-600 bg-blue-100 px-1 rounded">size</code> or <code className="text-blue-600 bg-blue-100 px-1 rounded">color</code> are automatically saved into <code className="text-blue-600 bg-blue-100 px-1 rounded">attributes</code>.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-stretch md:self-auto">
                    <button
                      onClick={handleCopyExample}
                      className="flex-1 md:flex-auto flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-medium transition-colors shadow-sm"
                    >
                      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy Template'}
                    </button>
                    <button
                      onClick={handleLoadExample}
                      className="flex-1 md:flex-auto px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors"
                    >
                      Load Sample Data
                    </button>
                  </div>
                </div>

                <pre className="p-4 bg-gray-900 border border-gray-700 rounded-xl text-xs text-blue-300 font-mono overflow-x-auto max-h-80 select-all">
                  {EXAMPLE_JSON}
                </pre>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-4xl shadow-sm">
              {errorMessage && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <div>{errorMessage}</div>
                </div>
              )}

              {successResult && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-600" />
                  <div>
                    Successfully inserted <span className="font-bold">{successResult.count}</span> products and <span className="font-bold">{successResult.variantCount}</span> variants! Redirecting...
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* File Upload */}
                <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-200 hover:border-red-400 rounded-2xl flex flex-col items-center justify-center text-center transition-colors group relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition duration-200">
                    <Upload className="w-6 h-6 text-red-600" />
                  </div>
                  <p className="text-gray-900 font-medium text-sm mb-1">Upload .json File</p>
                  <p className="text-gray-400 text-xs">Drag and drop or click to browse</p>
                </div>

                {/* Stats */}
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Payload Detection</span>
                    <div className="mt-2 flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${jsonText.trim() ? (isValidJson ? 'bg-green-500 animate-pulse' : 'bg-red-500') : 'bg-gray-300'}`} />
                      <span className="text-sm font-medium text-gray-700">
                        {jsonText.trim() ? (isValidJson ? 'Valid JSON Detected' : 'Syntax Error in JSON') : 'Awaiting Input...'}
                      </span>
                    </div>
                  </div>

                  {isValidJson && (
                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100 text-center">
                      <div className="bg-white border border-gray-200 p-2 rounded-xl shadow-sm">
                        <div className="text-lg font-bold text-red-600">{parsedCount}</div>
                        <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Products</div>
                      </div>
                      <div className="bg-white border border-gray-200 p-2 rounded-xl shadow-sm">
                        <div className="text-lg font-bold text-purple-600">{parsedVariantCount}</div>
                        <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Variants</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* JSON Editor */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Paste JSON Array directly</label>
                  {jsonText.trim() && (
                    <button onClick={() => setJsonText('')} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                      Clear Editor
                    </button>
                  )}
                </div>
                <textarea
                  rows={12}
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder={`[\n  {\n    "product_id": "CODE-001",\n    "product_name": "Example Item",\n    ...\n  }\n]`}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-blue-300 placeholder-gray-600 focus:ring-2 focus:ring-red-500/30 focus:border-red-400 font-mono text-xs tracking-wide focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                <Link href="/seller/dashboard/products" className="px-6 py-3 rounded-xl text-gray-500 font-medium hover:bg-gray-100 transition-colors text-sm">
                  Cancel
                </Link>
                <button
                  onClick={handleSubmit}
                  disabled={isPending || !jsonText.trim() || !isValidJson}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-semibold transition-colors shadow-sm text-sm"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isPending ? 'Processing...' : 'Submit Bulk Payload'}
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
