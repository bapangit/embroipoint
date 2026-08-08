"use client";

import Image from "next/image";
import type { MouseEvent, TouchEvent } from "react";
import { useRef, useState } from "react";
import { GrNext } from "react-icons/gr";
import styles from "./ProductImageSlider.module.css";

type ProductImageSliderProps = {
  image1?: string;
  image2?: string;
  image3?: string;
  image4?: string;
  image5?: string;
  alt: string;
  height?: string;
  borderRadius?: string;
  aspectRatio?: string;
  sizes?: string;
  preloadFirstImage?: boolean;
};

const isValidImage = (value?: string) =>
  Boolean(value && value.trim() && value.startsWith("http"));

export default function ProductImageSlider({
  image1,
  image2,
  image3,
  image4,
  image5,
  alt,
  height = "280px",
  borderRadius = "10px",
  aspectRatio,
  sizes = "(max-width: 768px) 360px, 540px",
  preloadFirstImage = false,
}: ProductImageSliderProps) {
  const images = [image1, image2, image3, image4, image5].filter(
    isValidImage
  ) as string[];
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const currentIndex =
    images.length === 0 ? 0 : Math.min(activeIndex, images.length - 1);
  const isFirstSlide = currentIndex === 0;
  const isLastSlide = currentIndex === images.length - 1;

  if (images.length === 0) {
    return (
      <div
        style={{
          width: "100%",
          height,
          aspectRatio,
          display: "grid",
          placeItems: "center",
          background: "#f3f4f6",
          color: "#64748b",
          borderRadius,
          marginBottom: "12px",
        }}
      >
        No image
      </div>
    );
  }

  const goToSlide = (index: number) => {
    setActiveIndex(Math.max(0, Math.min(index, images.length - 1)));
    setDragOffset(0);
  };

  const goToPrevious = () => {
    goToSlide(currentIndex - 1);
  };

  const goToNext = () => {
    goToSlide(currentIndex + 1);
  };

  const handleSliderControlClick = (
    event: MouseEvent<HTMLButtonElement>,
    action: () => void
  ) => {
    event.preventDefault();
    event.stopPropagation();
    action();
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (images.length <= 1) {
      return;
    }

    const touch = event.touches[0];

    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
    setIsDragging(true);
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (!touchStart.current || images.length <= 1) {
      return;
    }

    const touch = event.touches[0];
    const diffX = touch.clientX - touchStart.current.x;
    const diffY = touch.clientY - touchStart.current.y;

    if (Math.abs(diffY) > Math.abs(diffX)) {
      return;
    }

    if ((isFirstSlide && diffX > 0) || (isLastSlide && diffX < 0)) {
      setDragOffset(0);
      return;
    }

    setDragOffset(diffX);
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (!touchStart.current || images.length <= 1) {
      touchStart.current = null;
      setIsDragging(false);
      setDragOffset(0);
      return;
    }

    const touch = event.changedTouches[0];
    const diffX = touch.clientX - touchStart.current.x;
    const diffY = touch.clientY - touchStart.current.y;
    const sliderWidth = sliderRef.current?.clientWidth || 0;
    const minimumSwipeDistance = Math.min(80, sliderWidth * 0.22);

    touchStart.current = null;
    setIsDragging(false);
    setDragOffset(0);

    if (
      Math.abs(diffX) < minimumSwipeDistance ||
      Math.abs(diffX) <= Math.abs(diffY)
    ) {
      return;
    }

    if (diffX > 0 && !isFirstSlide) {
      goToPrevious();
      return;
    }

    if (diffX < 0 && !isLastSlide) {
      goToNext();
    }
  };

  return (
    <div className={styles.root} style={{ width: "100%", height, aspectRatio }}>
      <div
        ref={sliderRef}
        className={styles.viewport}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => {
          touchStart.current = null;
          setIsDragging(false);
          setDragOffset(0);
        }}
        style={{
          height: "100%",
          borderRadius,
        }}
      >
        <div
          className={styles.track}
          style={{
            transform: `translateX(calc(${-currentIndex * 100}% + ${dragOffset}px))`,
            transition: isDragging ? "none" : undefined,
          }}
        >
          {images.map((image, index) => (
            <div className={styles.slide} key={`${image}-${index}`}>
              {Math.abs(index - currentIndex) <= 1 ? (
                <Image
                  src={image}
                  alt={`${alt} ${index + 1}`}
                  fill
                  sizes={sizes}
                  preload={preloadFirstImage && index === 0}
                  {...(preloadFirstImage && index === 0
                    ? {}
                    : { loading: "lazy" as const })}
                  style={{
                    objectFit: "cover",
                  }}
                />
              ) : null}
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(event) => handleSliderControlClick(event, goToPrevious)}
              aria-label="Show previous product image"
              disabled={isFirstSlide}
              className={`${styles.navButton} ${styles.navButtonLeft}`}
            >
              <GrNext aria-hidden="true" className={styles.navIconPrevious} />
            </button>
            <button
              type="button"
              onClick={(event) => handleSliderControlClick(event, goToNext)}
              aria-label="Show next product image"
              disabled={isLastSlide}
              className={`${styles.navButton} ${styles.navButtonRight}`}
            >
              <GrNext aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className={styles.dots}>
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={(event) =>
                handleSliderControlClick(event, () => goToSlide(index))
              }
              aria-label={`Show product image ${index + 1}`}
              aria-pressed={currentIndex === index}
              className={`${styles.dot} ${
                currentIndex === index ? styles.dotActive : ""
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
