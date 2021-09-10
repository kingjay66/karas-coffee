import React, { useState } from 'react';
import { XIcon } from '@heroicons/react/solid';
import { Link, useParams } from 'react-router-dom';

import { Button } from '../components/Button';
import { Input } from '../components/Form';
import { Gallery } from '../components/Gallery';

import { useCart } from '../hooks/useCart';
import { useProduct } from '../hooks/useProduct';
import { useReviewMutation } from '../hooks/useReviewMutation';
import { useProductReview, useProductReviews } from '../hooks/useReviews';
import { ReviewCard, ReviewCardSkeleton } from '../components/ReviewCard';
import { emptyArray } from '../utils';
import { WriteReviewCard } from '../components/WriteReviewCard';
import { useUser } from '../hooks/useUser';

export function Product() {
  const user = useUser();
  const { id } = useParams();
  const product = useProduct(id);
  const { addToCart, removeFromCart, getItem, setQuantity } = useCart();

  if (product.isLoading) {
    return <div />;
  }

  if (product.isError || !product.data) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-600">
        Sorry, something went wrong loading this product.
      </div>
    );
  }

  const cartItem = getItem(product.data);

  return (
    <>
      <section className="mt-8">
        <div className="grid grid-cols-2 gap-12">
          <div>
            <Gallery images={product.data.images} />
          </div>
          <div>
            <Link to="/" className="block mb-4 text-sm text-gray-600 hover:underline">
              &laquo; Back to products
            </Link>
            <h1 className="mb-2 text-4xl font-extrabold tracking-wide">{product.data.name}</h1>
            <div className="text-3xl text-gray-600">${product.data.metadata.price_usd}</div>
            <p className="mt-6 text-gray-600">{product.data.description}</p>
            <div className="mt-6">
              {!!cartItem && (
                <div className="flex items-center mt-4">
                  <div className="flex-grow">
                    <Input
                      id={`quantity-${product.data.id}`}
                      type="number"
                      label="Quantity"
                      value={cartItem.quantity}
                      max="100"
                      min="1"
                      onChange={(e) => {
                        let quantity = parseInt(e.target.value);
                        if (isNaN(quantity) || quantity < 1) quantity = 1;
                        if (quantity > 100) quantity = 100;
                        setQuantity(product.data!, quantity);
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-center flex-shrink-0 w-10">
                    <XIcon
                      role="button"
                      className="w-5 h-5 mt-7 hover:opacity-50"
                      onClick={() => removeFromCart(product.data!)}
                    />
                  </div>
                </div>
              )}
              {!cartItem && <Button onClick={() => addToCart(product.data!)}>Add to cart</Button>}
            </div>
          </div>
        </div>
      </section>
      <section className="max-w-xl mx-auto mt-25">
        {!!user && <Review productId={product.data.id} />}
        <ListReviews productId={product.data.id} />
      </section>
    </>
  );
}

function Review({ productId }: { productId: string }) {
  const user = useUser();

  if (!user?.data) return null;

  const review = useProductReview(productId, user?.data!.uid);
  const addReview = useReviewMutation(productId);
  const [edit, setEdit] = useState<boolean>(false);

  const userReview = review.data;

  return (
    <section className="mt-24">
      <div className="max-w-xl mx-auto">
        <div className="mt-8">
          {review.status === 'loading' && <ReviewCardSkeleton />}
          {!edit && review.status === 'success' && !!userReview && (
            <>
              <ReviewCard review={userReview!} />
              <div className="mt-4">
                <Button onClick={() => setEdit(true)}>Edit your review</Button>
              </div>
            </>
          )}
          {review.status === 'success' && !userReview && (
            <WriteReviewCard
              onSubmit={async (values) => {
                await addReview.mutateAsync({
                  rating: values.stars,
                  message: values.message,
                });
              }}
            />
          )}
          {!!edit && !!userReview && (
            <>
              <WriteReviewCard
                initialMessage={userReview.message}
                initialStars={userReview.rating}
                onSubmit={async (values) => {
                  await addReview.mutateAsync({
                    rating: values.stars,
                    message: values.message,
                  });
                  setEdit(false);
                }}
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function ListReviews({ productId }: { productId: string }) {
  const reviews = useProductReviews(productId);

  const wrapper = (children: React.ReactNode) => <div className="py-12">{children}</div>;

  return (
    <div className="mt-12">
      <h2 className="mb-2 text-3xl font-extrabold tracking-wide">Reviews</h2>
      <div className="divide-y">
        {reviews.status === 'loading' && emptyArray(5).map(() => wrapper(<ReviewCardSkeleton />))}
        {reviews.status === 'success' && (
          <>
            {reviews.data.length === 0 && (
              <p className="mt-4 text-gray-600">
                There are no reviews for this product, grab a coffee and be the first to write one!
              </p>
            )}
            {reviews.data.map((review) => wrapper(<ReviewCard review={review} />))}
          </>
        )}
      </div>
    </div>
  );
}
