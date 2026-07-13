'use client';

import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Star, CheckCircle, Shield, Package, Heart, ShoppingCart, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Product, Review, ProductVariant } from '@/types';
import { addToCart, toggleWishlist } from '@/app/actions/customer';
import toast from 'react-hot-toast';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { id } = await params;
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        if (data.success) {
          setProduct(data.data.product);
          setReviews(data.data.reviews || []);
          if (data.data.product.has_variants && data.data.product.variants?.length > 0) {
            const first = data.data.product.variants[0];
            setSelectedVariant(first);
            setSelectedAttrs(first.attributes);
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [params]);

  const attrGroups = useMemo(() => {
    if (!product?.variants?.length) return {};
    const groups: Record<string, Set<string>> = {};
    for (const v of product.variants) {
      for (const [k, val] of Object.entries(v.attributes ?? {})) {
        if (!groups[k]) groups[k] = new Set();
        groups[k].add(val);
      }
    }
    return groups;
  }, [product?.variants]);

  const handleAttrSelect = (key: string, value: string) => {
    const newAttrs = { ...selectedAttrs, [key]: value };
    setSelectedAttrs(newAttrs);
    const matched = product?.variants?.find((v) =>
      Object.entries(newAttrs).every(([k, val]) => v.attributes[k] === val)
    );
    if (matched) { setSelectedVariant(matched); setSelectedImage(0); }
  };

  const displayImages = selectedVariant?.images?.length ? selectedVariant.images : (product?.images ?? []);
  const displayPrice   = selectedVariant?.price          ?? product?.price          ?? 0;
  const displayCompare = selectedVariant?.compare_price  ?? product?.compare_price;
  const displayQty     = selectedVariant?.quantity       ?? product?.quantity       ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse grid md:grid-cols-2 gap-8">
            <div className="bg-gray-200 aspect-square rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-6 bg-gray-200 rounded w-1/2" />
              <div className="h-12 bg-gray-200 rounded w-1/4" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <Package className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h1>
          <Link href="/products" className="text-red-600 hover:text-red-700 font-medium transition-colors">← Back to products</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = async () => {
    const result = await addToCart(product.id, quantity);
    if (result.success) toast.success('Added to cart!');
    else toast.error(result.error || 'Failed to add to cart');
  };

  const handleWishlist = async () => {
    const result = await toggleWishlist(product.id);
    if (result.success) {
      setWishlisted(result.wishlisted ?? false);
      toast.success(result.wishlisted ? 'Added to wishlist' : 'Removed from wishlist');
    }
  };

  const seller = product.seller;
  const discount = displayCompare && displayCompare > displayPrice
    ? Math.round(((displayCompare - displayPrice) / displayCompare) * 100)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-gray-900 transition-colors">Products</Link>
          <span>/</span>
          <span className="text-gray-700">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 mb-10">
          {/* Images */}
          <div className="md:col-span-5 max-w-lg mx-auto md:mx-0 w-full">
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-3 aspect-square flex items-center justify-center p-8 shadow-sm">
              {displayImages[selectedImage] ? (
                <img src={displayImages[selectedImage]} alt={product.name} className="w-full h-full object-contain" />
              ) : (
                <Package className="w-14 h-14 text-gray-200" />
              )}
            </div>
            {displayImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {displayImages.map((image, idx) => (
                  <button key={idx} onClick={() => setSelectedImage(idx)}
                    className={`aspect-square bg-white rounded-xl overflow-hidden border-2 transition-colors p-1.5 ${
                      selectedImage === idx ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <img src={image} alt={`View ${idx + 1}`} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="md:col-span-7">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">{product.category}</p>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

            {/* Authenticity badge */}
            {product.authenticity_verified && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 border border-green-200 rounded-xl w-fit">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-700 text-sm">Authenticity Verified</p>
                  {product.certificate_id && (
                    <p className="text-xs text-green-600">Cert ID: {product.certificate_id}</p>
                  )}
                </div>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-5">
              <p className="text-4xl font-bold text-gray-900">₹{displayPrice.toLocaleString()}</p>
              {displayCompare && displayCompare > displayPrice && (
                <>
                  <p className="text-gray-400 line-through text-xl">₹{displayCompare.toLocaleString()}</p>
                  <span className="text-green-700 text-sm font-bold bg-green-50 border border-green-100 px-2.5 py-0.5 rounded-full">
                    {discount}% off
                  </span>
                </>
              )}
            </div>

            {/* Variant Selectors */}
            {product.has_variants && Object.keys(attrGroups).length > 0 && (
              <div className="mb-6 space-y-4 p-5 bg-white border border-gray-200 rounded-2xl">
                {Object.entries(attrGroups).map(([attrKey, values]) => (
                  <div key={attrKey}>
                    <p className="text-sm text-gray-500 mb-2 font-medium">
                      {attrKey}:&nbsp;
                      <span className="text-gray-900 font-bold">{selectedAttrs[attrKey] ?? '—'}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[...values].map((val) => {
                        const isSelected = selectedAttrs[attrKey] === val;
                        const testAttrs = { ...selectedAttrs, [attrKey]: val };
                        const matchedV = product.variants?.find((v) =>
                          Object.entries(testAttrs).every(([k, tv]) => !tv || v.attributes[k] === tv)
                        );
                        const isOutOfStock = matchedV ? matchedV.quantity === 0 : false;
                        return (
                          <button key={val} onClick={() => handleAttrSelect(attrKey, val)}
                            disabled={isOutOfStock} title={isOutOfStock ? 'Out of stock' : val}
                            className={`relative px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-red-600 border-red-600 text-white shadow-sm'
                                : isOutOfStock
                                  ? 'border-gray-100 text-gray-300 cursor-not-allowed line-through'
                                  : 'border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-600 hover:bg-red-50'
                            }`}>
                            {val}
                            {isOutOfStock && <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {selectedVariant && (
                  <div className="flex gap-4 pt-2 text-xs text-gray-400 font-mono border-t border-gray-100">
                    {selectedVariant.variant_id && <span>ID: {selectedVariant.variant_id}</span>}
                    {selectedVariant.seller_sku && <span>SKU: {selectedVariant.seller_sku}</span>}
                  </div>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Trust Score',       value: `${product.trust_score}%`, cls: 'text-red-600' },
                { label: 'Verified Reviews',  value: product.verified_buyer_reviews, cls: 'text-green-600' },
                { label: 'In Stock',          value: displayQty, cls: displayQty > 0 ? 'text-blue-600' : 'text-red-600' },
              ].map(({ label, value, cls }) => (
                <div key={label} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
                  <p className="text-gray-400 text-xs">{label}</p>
                  <p className={`text-xl font-bold ${cls} mt-1`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Seller */}
            {seller && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-900 font-semibold flex items-center gap-1.5">
                      {seller.business_name}
                      {seller.verification_status === 'approved' && <CheckCircle className="w-4 h-4 text-green-600" />}
                    </p>
                    <p className="text-gray-400 text-sm mt-0.5">Trust Score: {seller.trust_score}%</p>
                  </div>
                  <Link href={`/seller/${product.seller_id}`}
                    className="px-4 py-1.5 bg-gray-900 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors font-medium">
                    View Store
                  </Link>
                </div>
              </div>
            )}

            {/* Cart Actions */}
            <div className="flex gap-3 mb-5">
              <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 transition-colors font-semibold">−</button>
                <span className="px-4 text-gray-900 font-semibold border-x border-gray-200">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(displayQty, quantity + 1))} className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 transition-colors font-semibold">+</button>
              </div>
              <button onClick={handleAddToCart} disabled={displayQty === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-colors py-2.5 shadow-sm">
                <ShoppingCart className="w-4 h-4" />
                {displayQty === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button onClick={handleWishlist}
                className={`px-4 py-2.5 border rounded-xl transition-colors ${
                  wishlisted
                    ? 'bg-pink-50 border-pink-200 text-pink-600'
                    : 'bg-white border-gray-200 text-gray-400 hover:text-pink-500 hover:border-pink-200'
                }`}>
                <Heart className={`w-5 h-5 ${wishlisted ? 'fill-pink-500' : ''}`} />
              </button>
            </div>

            {/* Verification badge */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <h3 className="font-bold text-green-700 mb-1 flex items-center gap-2 text-sm">
                <ShieldCheck className="w-4 h-4 text-green-600" /> Authenticity Guarantee
              </h3>
              <p className="text-green-600 text-xs leading-relaxed">
                Every physical item includes a unique Verification ID. Scan it after delivery to confirm authenticity and register ownership in the Trusta registry.
              </p>
            </div>
          </div>
        </div>

        {/* Specs + Description */}
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Specifications</h2>
            <div className="space-y-2">
              {Object.entries(product.specifications || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-500 text-sm capitalize">{key}</span>
                  <span className="text-gray-900 font-medium text-sm">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Description</h2>
            <p className="text-gray-500 leading-relaxed text-sm mb-4">{product.description}</p>
            {product.authenticity_verified && (
              <div className="space-y-2 pt-4 border-t border-gray-100">
                <h3 className="font-bold text-gray-700 text-sm">Verification Info</h3>
                <p className="flex items-center gap-2 text-gray-500 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  {product.verification_date
                    ? `Verified on ${new Date(product.verification_date).toLocaleDateString()}`
                    : 'Authenticity Verified'}
                </p>
                {product.certificate_id && (
                  <p className="flex items-center gap-2 text-gray-500 text-sm">
                    <Shield className="w-4 h-4 text-blue-600" /> Cert ID: {product.certificate_id}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Verified Customer Reviews</h2>
          {reviews.length > 0 ? (
            <div className="space-y-5">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 pb-5 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{review.profile?.name || 'Customer'}</p>
                      <p className="text-gray-400 text-xs">{new Date(review.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                  </div>
                  {review.title && <p className="text-gray-900 font-medium text-sm mb-1">{review.title}</p>}
                  <p className="text-gray-500 text-sm leading-relaxed">{review.comment}</p>
                  {review.verified_purchase && (
                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Verified Purchase
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8 text-sm">No reviews yet. Be the first to review this product!</p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
