import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../components';
import { CommercePage, Field, Pagination, ResourceFeedback, fieldStyle, useCommerceMutation } from '../components/commerce/CommerceUI';
import { ProductCard } from '../components/commerce/ProductCatalog';
import { decimalPrice, minorPrice } from '../components/commerce/shop';
import useCommerceResource from '../components/commerce/useCommerceResource';
import { useAuth } from '../contexts/AuthContext';
import { businessService, shopService } from '../services/api';

function ProductForm({ product, businessId, close, saved }) {
  const [priceError, setPriceError] = useState('');
  const load = useCallback(() => businessService.getBusinessImages(businessId), [businessId]);
  const images = useCommerceResource(load);
  const mutation = useCommerceMutation();

  function submit(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const priceMinor = minorPrice(fields.get('price').trim());
    if (priceMinor == null) {
      setPriceError('Enter a price from R0.01 to R1,000,000 using up to two decimal places.');
      return;
    }
    setPriceError('');
    mutation.run(async () => {
      await shopService.saveProduct(product.id, {
        name: fields.get('name'),
        description: fields.get('description'),
        category: fields.get('category'),
        priceMinor,
        stock: fields.get('stock') === '' ? null : Number(fields.get('stock')),
        active: fields.has('active'),
        available: fields.has('available'),
        imageId: fields.has('imageId') ? fields.get('imageId') || null : product.imageId || null,
        revision: product.revision ?? null,
      });
      saved();
    });
  }

  return (
    <Card className="p-5">
      <form onSubmit={submit} className="space-y-4">
        <h2 className="text-lg font-semibold">{product.id ? 'Edit product' : 'New product'}</h2>
        <Field label="Product name" name="name" required maxLength={120} defaultValue={product.name} />
        <Field label="Description" name="description" multiline required maxLength={2000} defaultValue={product.description} />
        <Field label="Product category" name="category" required maxLength={120} defaultValue={product.category} />
        <Field label="Price (ZAR)" name="price" inputMode="decimal" maxLength={10} required
          defaultValue={product.priceMinor == null ? '' : decimalPrice(product.priceMinor)} />
        {priceError && <p role="alert">{priceError}</p>}
        <Field label="Available stock (optional)" name="stock" type="number" min="0" max="1000000" step="1" defaultValue={product.stock ?? ''} />
        <p className="text-sm text-neutral-600">Leave stock blank to manage availability manually.</p>
        <ResourceFeedback resource={images} />
        {images.data && (
          <Field label="Product image">
            <select className={fieldStyle} name="imageId" defaultValue={product.imageId || ''}>
              <option value="">No image</option>
              {images.data.map((image, index) => (
                <option key={image.id} value={image.id}>{image.fileName || `Gallery image ${index + 1}`}</option>
              ))}
            </select>
          </Field>
        )}
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" className="size-5" name="available" defaultChecked={product.available ?? true} /> Accept orders for this product
        </label>
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" className="size-5" name="active" defaultChecked={product.active ?? true} /> Show product on business profile
        </label>
        {mutation.error && <p role="alert">{mutation.error.message}</p>}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={mutation.busy}>{mutation.busy ? 'Saving…' : 'Save product'}</Button>
          <Button type="button" variant="secondary" disabled={mutation.busy} onClick={close}>Close form</Button>
        </div>
      </form>
    </Card>
  );
}

function CatalogManager({ business }) {
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState(null);
  const [saved, setSaved] = useState(false);
  const load = useCallback(() => shopService.products(page), [page]);
  const resource = useCommerceResource(load);
  return (
    <>
      <ResourceFeedback resource={resource} />
      {saved && <p role="status">Product saved.</p>}
      {editing && (
        <ProductForm key={editing.id || 'new'} product={editing} businessId={business.id}
          close={() => { setEditing(null); resource.retry(); }}
          saved={() => { setEditing(null); setSaved(true); resource.retry(); }} />
      )}
      {resource.data && (
        <>
          {!editing && <Button type="button" onClick={() => { setEditing({}); setSaved(false); }}>Add product</Button>}
          {!resource.data.content.length && <p>Your catalog is empty.</p>}
          {resource.data.content.map((product) => (
            <Card className="p-5" key={product.id}>
              <ProductCard product={product}>
                <p>{product.active ? 'Visible on business profile' : 'Hidden from business profile'}</p>
                <p>{product.available ? 'Accepting orders' : 'Orders paused'} · {product.stock == null ? 'Manual stock' : `${product.stock} in stock`}</p>
                {!editing && <Button type="button" variant="secondary" onClick={() => {
                  setEditing(product);
                  setSaved(false);
                }}>Edit {product.name}</Button>}
              </ProductCard>
            </Card>
          ))}
        </>
      )}
      <Pagination page={page} totalPages={page + (resource.data?.hasNext ? 2 : 1)} setPage={setPage} />
    </>
  );
}

function BusinessProducts() {
  const load = useCallback(async () => (await businessService.getMyBusinesses()).content[0] || null, []);
  const business = useCommerceResource(load);
  return (
    <>
      <Link className="btn-secondary" to="/orders/incoming">Incoming orders</Link>
      <ResourceFeedback resource={business} />
      {business.data === null && (
        <Card className="space-y-3 p-5">
          <p>Create a business profile before adding products.</p>
          <Link className="btn-primary" to="/business-profile">Manage business profile</Link>
        </Card>
      )}
      {business.data && <CatalogManager business={business.data} />}
    </>
  );
}

export default function ManageProducts() {
  const { user } = useAuth();
  return (
    <CommercePage title="Manage products">
      {user?.accountType === 'BUSINESS' ? <BusinessProducts /> : <p>Product management is available to business accounts.</p>}
    </CommercePage>
  );
}
