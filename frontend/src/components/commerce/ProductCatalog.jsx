import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '..';
import { shopService } from '../../services/api';
import { maxProducts, maxQuantity, useCart } from './CartContext';
import { Pagination, ResourceFeedback } from './CommerceUI';
import { formatMinor } from './shop';
import useCommerceResource from './useCommerceResource';

export function ProductCard({ product, children }) {
  return (
    <article className="grid gap-3 border-t border-neutral-200 pt-4 sm:grid-cols-[auto_1fr]">
      {product.imageUrl && (
        <img src={product.imageUrl} alt="" loading="lazy" className="h-24 w-24 rounded-lg object-cover" />
      )}
      <div className="min-w-0 space-y-2 break-words">
        <h3 className="font-semibold">{product.name}</h3>
        <p className="text-sm text-neutral-600">{product.category}</p>
        <p className="whitespace-pre-wrap">{product.description}</p>
        <p className="font-semibold text-kasi-green">{formatMinor(product.priceMinor)}</p>
        {children}
      </div>
    </article>
  );
}

export default function ProductCatalog({ business, owner }) {
  const { cart, add } = useCart();
  const [page, setPage] = useState(0);
  const [replacement, setReplacement] = useState(null);
  const [message, setMessage] = useState('');
  const load = useCallback(() => shopService.catalog(business.id, page), [business.id, page]);
  const resource = useCommerceResource(load);

  function addProduct(product) {
    if (cart && cart.businessId !== business.id) {
      setReplacement(product);
      setMessage('');
      return;
    }
    const line = cart?.items.find((item) => item.productId === product.id);
    if (line?.quantity >= maxQuantity || (!line && cart?.items.length >= maxProducts)) {
      setMessage('Your cart has reached its quantity limit.');
      return;
    }
    add(business, product);
    setMessage(`${product.name} added to your cart.`);
  }

  return (
    <Card className="p-5 space-y-4">
      <h2 className="text-lg font-semibold">Products</h2>
      <div className="flex flex-wrap gap-2">
        {owner && <Link className="btn-secondary" to="/products/manage">Manage products</Link>}
        {cart && <Link className="btn-secondary" to="/cart">View cart ({cart.items.reduce((sum, item) => sum + item.quantity, 0)})</Link>}
      </div>
      {message && <p role="status">{message}</p>}
      {replacement && (
        <div role="group" aria-label="Replace current cart" className="space-y-2 rounded-lg bg-kasi-green-light p-4">
          <p>Your cart contains products from {cart?.businessName}. Each order is for one business. Replace your cart with {replacement.name}?</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => {
              add(business, replacement);
              setMessage(`${replacement.name} added to your cart.`);
              setReplacement(null);
            }}>Replace cart</Button>
            <Button type="button" variant="secondary" onClick={() => setReplacement(null)}>Keep current cart</Button>
          </div>
        </div>
      )}
      <ResourceFeedback resource={resource} />
      {resource.data && (
        <>
          {resource.data.content.length === 0 && <p className="text-sm text-neutral-600">No products listed yet.</p>}
          {resource.data.content.map((product) => (
            <ProductCard key={product.id} product={product}>
              <p className="text-sm">{product.available ? 'Available for collection' : 'Currently unavailable'}</p>
              {!owner && <Button type="button" disabled={!product.available || !!replacement} onClick={() => addProduct(product)}>Add to cart</Button>}
            </ProductCard>
          ))}
        </>
      )}
      {page > 0 || resource.data?.hasNext ? (
        <Pagination page={page} totalPages={page + (resource.data?.hasNext ? 2 : 1)} setPage={setPage} />
      ) : null}
    </Card>
  );
}
