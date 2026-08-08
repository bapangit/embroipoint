"use client";

import { use, useState, ChangeEvent, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import {
  careInstructionOptions,
  closureOptions,
  dressShapeOptions,
  dressCategories,
  dressesSubcategoryOptions,
  fabricOptions,
  fitOptions,
  necklineOptions,
  occasionOptions,
  packSizeOptions,
  patternOptions,
  sleeveStyleOptions,
} from "@/config/productInfoOpt";

type AddProductPageProps = {
  searchParams: Promise<{ id?: string | string[] }>;
};

type ImageIndex = 1 | 2 | 3 | 4 | 5;

type ProductImportFields = Partial<{
  title: string;
  description: string;
  price: string;
  prevPrice: string;
  category: string;
  fabric: string;
  pattern: string;
  occasion: string;
  fit: string;
  neckline: string;
  closure: string;
  packSize: string;
  dressesSubcategory: string;
  sleeveStyle: string;
  dressShape: string;
  careInstructions: string;
}>;

const AddProduct = ({ searchParams }: AddProductPageProps) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef2 = useRef<HTMLInputElement>(null);
  const imageInputRef3 = useRef<HTMLInputElement>(null);
  const imageInputRef4 = useRef<HTMLInputElement>(null);
  const imageInputRef5 = useRef<HTMLInputElement>(null);
  const initializedProductKeyRef = useRef<string | null>(null);
  const resolvedSearchParams = use(searchParams);
  const draftId =
    typeof resolvedSearchParams.id === "string"
      ? resolvedSearchParams.id
      : Array.isArray(resolvedSearchParams.id)
        ? resolvedSearchParams.id[0]
        : undefined;

  useEffect(() => {
    if (status === 'loading') return; // Still loading
    if (!session || session.user.role !== 'admin') {
      router.push('/'); // Redirect to home or unauthorized page
    }
  }, [session, status, router]);

  const [productId, setProductId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [prevPrice, setPrevPrice] = useState("");
  const [category, setCategory] = useState("");
  const [fabric, setFabric] = useState("");
  const [pattern, setPattern] = useState("");
  const [occasion, setOccasion] = useState("");
  const [fit, setFit] = useState("");
  const [neckline, setNeckline] = useState("");
  const [closure, setClosure] = useState("");
  const [packSize, setPackSize] = useState("");
  const [dressesSubcategory, setDressesSubcategory] = useState("");
  const [sleeveStyle, setSleeveStyle] = useState("");
  const [dressShape, setDressShape] = useState("");
  const [careInstructions, setCareInstructions] = useState("");
  const [preview, setPreview] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const [preview2, setPreview2] = useState("");
  const [imageUrl2, setImageUrl2] = useState("");
  const [uploading2, setUploading2] = useState(false);
  const [preview3, setPreview3] = useState("");
  const [imageUrl3, setImageUrl3] = useState("");
  const [uploading3, setUploading3] = useState(false);
  const [preview4, setPreview4] = useState("");
  const [imageUrl4, setImageUrl4] = useState("");
  const [uploading4, setUploading4] = useState(false);
  const [preview5, setPreview5] = useState("");
  const [imageUrl5, setImageUrl5] = useState("");
  const [uploading5, setUploading5] = useState(false);
  const [deletingImage, setDeletingImage] = useState<ImageIndex | null>(null);
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);
  const [jsonImportText, setJsonImportText] = useState("");
  const [jsonImportError, setJsonImportError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "admin") return;

    const productKey = draftId ?? "new-product";

    if (initializedProductKeyRef.current === productKey) return;

    initializedProductKeyRef.current = productKey;

    const initializeProduct = async () => {
      try {
        if (draftId) {
          const res = await fetch(`/api/products/create-product/${draftId}`);
          const data = await res.json();

          if (data.success && data.product) {
            setProductId(data.product._id || draftId);
            setTitle(data.product.title || "");
            setDescription(data.product.description || "");
            setPrice(data.product.price || "");
            setPrevPrice(data.product.prevPrice || "");
            setCategory(data.product.category || "");
            setFabric(data.product.fabric || "");
            setPattern(data.product.pattern || "");
            setOccasion(data.product.occasion || "");
            setFit(data.product.fit || "");
            setNeckline(data.product.neckline || "");
            setClosure(data.product.closure || "");
            setPackSize(data.product.packSize || "");
            setDressesSubcategory(data.product.dressesSubcategory || "");
            setSleeveStyle(data.product.sleeveStyle || "");
            setDressShape(data.product.dressShape || "");
            setCareInstructions(data.product.careInstructions || "");
            setImageUrl(data.product.image1 || "");
            setPreview(data.product.image1 || "");
            setImageUrl2(data.product.image2 || "");
            setPreview2(data.product.image2 || "");
            setImageUrl3(data.product.image3 || "");
            setPreview3(data.product.image3 || "");
            setImageUrl4(data.product.image4 || "");
            setPreview4(data.product.image4 || "");
            setImageUrl5(data.product.image5 || "");
            setPreview5(data.product.image5 || "");
            return;
          }
        }

        const res = await fetch("/api/products/create-draft", {
          method: "POST",
        });
        const data = await res.json();

        if (data.success) {
          setProductId(data.product._id);
        }
      } catch (error) {
        initializedProductKeyRef.current = null;
        console.log(error);
      }
    };

    initializeProduct();
  }, [draftId, session, status]);

  const getImageInput = (index: ImageIndex) => {
    const inputs = {
      1: imageInputRef,
      2: imageInputRef2,
      3: imageInputRef3,
      4: imageInputRef4,
      5: imageInputRef5,
    };

    return inputs[index].current;
  };

  const getImageUrl = (index: ImageIndex) => {
    const urls = {
      1: imageUrl,
      2: imageUrl2,
      3: imageUrl3,
      4: imageUrl4,
      5: imageUrl5,
    };

    return urls[index];
  };

  const getPreview = (index: ImageIndex) => {
    const previews = {
      1: preview,
      2: preview2,
      3: preview3,
      4: preview4,
      5: preview5,
    };

    return previews[index];
  };

  const getUploading = (index: ImageIndex) => {
    const uploadStates = {
      1: uploading,
      2: uploading2,
      3: uploading3,
      4: uploading4,
      5: uploading5,
    };

    return uploadStates[index];
  };

  const setImageUrlByIndex = (index: ImageIndex, url: string) => {
    const setters = {
      1: setImageUrl,
      2: setImageUrl2,
      3: setImageUrl3,
      4: setImageUrl4,
      5: setImageUrl5,
    };

    setters[index](url);
  };

  const setPreviewByIndex = (index: ImageIndex, url: string) => {
    const setters = {
      1: setPreview,
      2: setPreview2,
      3: setPreview3,
      4: setPreview4,
      5: setPreview5,
    };

    setters[index](url);
  };

  const setUploadingByIndex = (index: ImageIndex, isUploading: boolean) => {
    const setters = {
      1: setUploading,
      2: setUploading2,
      3: setUploading3,
      4: setUploading4,
      5: setUploading5,
    };

    setters[index](isUploading);
  };

  const clearImageInput = (index: ImageIndex) => {
    const input = getImageInput(index);

    if (input) {
      input.value = "";
    }
  };

  const deleteCloudinaryImage = async (
    url: string,
    index: ImageIndex,
    clearProductImage = false,
  ) => {
    if (!url) return;

    const response = await fetch("/api/products/delete-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId,
        imageField: `image${index}`,
        imageUrl: url,
        clearProductImage,
      }),
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to delete image");
    }
  };

  /* HANDLE IMAGE CHANGE | SAVE TO DRAFT */
  const handleImageChange = async (
    e: ChangeEvent<HTMLInputElement>,
    index: ImageIndex,
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const previousImageUrl = getImageUrl(index);
    const previousPreviewUrl = getPreview(index);
    const nextPreviewUrl = URL.createObjectURL(file);

    setPreviewByIndex(index, nextPreviewUrl);

    try {
      setUploadingByIndex(index, true);

      const formData = new FormData();

      formData.append("file", file);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
      );

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await res.json();
      if (data.secure_url) {
        // optional save to db instantly
        const saveImageResponse = await fetch(`/api/products/create-product/${productId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            [`image${index}`]: data.secure_url,
          }),
        });
        const saveImageData = await saveImageResponse.json();

        if (!saveImageResponse.ok || !saveImageData.success) {
          try {
            await deleteCloudinaryImage(data.secure_url, index);
          } catch (deleteError) {
            console.log(deleteError);
          }

          throw new Error(saveImageData.message || "Failed to save image");
        }

        setImageUrlByIndex(index, data.secure_url);

        if (previousImageUrl && previousImageUrl !== data.secure_url) {
          try {
            await deleteCloudinaryImage(previousImageUrl, index);
          } catch (deleteError) {
            console.log(deleteError);
            alert(
              deleteError instanceof Error
                ? `New image saved, but old image was not deleted: ${deleteError.message}`
                : "New image saved, but old image was not deleted",
            );
          }
        }
      }
    } catch (error) {
      console.log(error);

      setImageUrlByIndex(index, previousImageUrl);
      setPreviewByIndex(index, previousPreviewUrl);

      clearImageInput(index);
      alert(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setUploadingByIndex(index, false);
    }
  };

  /* SAVE PRODUCT */
  const saveProduct = async (published: boolean) => {
    const saveMode = published ? "publish" : "draft";

    try {
      setSaving(saveMode);

      const response = await fetch(
        `/api/products/create-product/${productId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            description:description,
            price,
            prevPrice,
            category,
            fabric,
            pattern,
            occasion,
            fit,
            neckline,
            closure,
            packSize,
            dressesSubcategory,
            sleeveStyle,
            dressShape,
            careInstructions,
            image1: imageUrl,
            image2: imageUrl2,
            image3: imageUrl3,
            image4: imageUrl4,
            image5: imageUrl5,
            published,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        alert(published ? "Product published" : "Product saved to draft");
        console.log(data.product);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setSaving(null);
    }
  };

  const parseProductImport = (value: string): ProductImportFields => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      throw new Error("Paste product JSON first");
    }

    const parseAsJson = (text: string) => JSON.parse(text) as unknown;
    const parsedValue = (() => {
      try {
        return parseAsJson(trimmedValue);
      } catch {
        const objectText = trimmedValue.startsWith("{")
          ? trimmedValue
          : `{${trimmedValue}}`;
        const normalizedText = objectText
          .replace(/([{,]\s*)([A-Za-z_$][\w$]*)(\s*:)/g, '$1"$2"$3')
          .replace(/,\s*([}\]])/g, "$1");

        return parseAsJson(normalizedText);
      }
    })();

    if (!parsedValue || typeof parsedValue !== "object" || Array.isArray(parsedValue)) {
      throw new Error("Paste a product object, not a list or plain value");
    }

    return parsedValue as ProductImportFields;
  };

  const applyProductImport = () => {
    try {
      const productData = parseProductImport(jsonImportText);

      if (productData.title !== undefined) setTitle(String(productData.title));
      if (productData.description !== undefined) {
        setDescription(String(productData.description));
      }
      if (productData.price !== undefined) setPrice(String(productData.price));
      if (productData.prevPrice !== undefined) {
        setPrevPrice(String(productData.prevPrice));
      }
      if (productData.category !== undefined) setCategory(String(productData.category));
      if (productData.fabric !== undefined) setFabric(String(productData.fabric));
      if (productData.pattern !== undefined) setPattern(String(productData.pattern));
      if (productData.occasion !== undefined) setOccasion(String(productData.occasion));
      if (productData.fit !== undefined) setFit(String(productData.fit));
      if (productData.neckline !== undefined) setNeckline(String(productData.neckline));
      if (productData.closure !== undefined) setClosure(String(productData.closure));
      if (productData.packSize !== undefined) setPackSize(String(productData.packSize));
      if (productData.dressesSubcategory !== undefined) {
        setDressesSubcategory(String(productData.dressesSubcategory));
      }
      if (productData.sleeveStyle !== undefined) {
        setSleeveStyle(String(productData.sleeveStyle));
      }
      if (productData.dressShape !== undefined) {
        setDressShape(String(productData.dressShape));
      }
      if (productData.careInstructions !== undefined) {
        setCareInstructions(String(productData.careInstructions));
      }

      setJsonImportError("");
    } catch (error) {
      setJsonImportError(
        error instanceof Error ? error.message : "Could not parse product JSON",
      );
    }
  };

  const deleteImage = async (index: ImageIndex) => {
    const url = getImageUrl(index);

    if (!url) return;

    try {
      setDeletingImage(index);
      await deleteCloudinaryImage(url, index, true);

      setImageUrlByIndex(index, "");
      setPreviewByIndex(index, "");

      clearImageInput(index);
    } catch (error) {
      console.log(error);
      alert(error instanceof Error ? error.message : "Failed to delete image");
    } finally {
      setDeletingImage(null);
    }
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session || session.user.role !== 'admin') {
    return <div>Access Denied</div>;
  }

  const imageInputItems = [
    { index: 1 as const, inputRef: imageInputRef },
    { index: 2 as const, inputRef: imageInputRef2 },
    { index: 3 as const, inputRef: imageInputRef3 },
    { index: 4 as const, inputRef: imageInputRef4 },
    { index: 5 as const, inputRef: imageInputRef5 },
  ];

  return (
    <div className={styles.pageShell}>
      <h2>{draftId ? "Edit Product" : "Add New Product"}</h2>
      <p>Product ID: {productId}</p>

      <div className={styles.importSection}>
        <div className={styles.formGroup}>
          <label>Paste Product JSON</label>
          <textarea
            placeholder='title: "Black Flared Anarkali Dress", price: "3899", category: "Salwar Suits"'
            value={jsonImportText}
            onChange={(e) => {
              setJsonImportText(e.target.value);
              setJsonImportError("");
            }}
            rows={8}
          />
          {jsonImportError && (
            <p className={styles.importError}>{jsonImportError}</p>
          )}
        </div>
        <button
          type="button"
          className={`${styles.button} ${styles.importButton}`}
          onClick={applyProductImport}
        >
          Fill Fields
        </button>
      </div>

      <div className={styles.formGroup}>
        <label>Product Title</label>

        <input
          type="text"
          placeholder="Enter product title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Product Description</label>

        <input
          type="text"
          placeholder="Enter product Sescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Price</label>

        <input
          type="number"
          placeholder="Enter product price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Prev Price</label>

        <input
          type="number"
          placeholder="Enter product prev price"
          value={prevPrice}
          onChange={(e) => setPrevPrice(e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Category</label>

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Select category</option>
          {dressCategories.map((option) => (
            <option key={option.name} value={option.name}>
              {option.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.infoSection}>
        <h3 className={styles.sectionTitle}>Product Information</h3>
        <div className={styles.infoGrid}>
          <div className={styles.formGroup}>
            <label>Material</label>

            <select value={fabric} onChange={(e) => setFabric(e.target.value)}>
              <option value="">Select material</option>
              {fabricOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Pattern</label>
            <select value={pattern} onChange={(e) => setPattern(e.target.value)}>
              <option value="">Select pattern</option>
              {patternOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Occasion</label>
            <select value={occasion} onChange={(e) => setOccasion(e.target.value)}>
              <option value="">Select occasion</option>
              {occasionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Fit</label>
            <select value={fit} onChange={(e) => setFit(e.target.value)}>
              <option value="">Select fit</option>
              {fitOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Neckline</label>
            <select value={neckline} onChange={(e) => setNeckline(e.target.value)}>
              <option value="">Select neckline</option>
              {necklineOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Closure</label>
            <select value={closure} onChange={(e) => setClosure(e.target.value)}>
              <option value="">Select closure</option>
              {closureOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Pack Size</label>
            <select value={packSize} onChange={(e) => setPackSize(e.target.value)}>
              <option value="">Select pack size</option>
              {packSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Dresses Subcategory</label>
            <select
              value={dressesSubcategory}
              onChange={(e) => setDressesSubcategory(e.target.value)}
            >
              <option value="">Select subcategory</option>
              {dressesSubcategoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Sleeve Style</label>
            <select
              value={sleeveStyle}
              onChange={(e) => setSleeveStyle(e.target.value)}
            >
              <option value="">Select sleeve style</option>
              {sleeveStyleOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Dress Shape</label>
            <select
              value={dressShape}
              onChange={(e) => setDressShape(e.target.value)}
            >
              <option value="">Select dress shape</option>
              {dressShapeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Care Instructions</label>
            <select
              value={careInstructions}
              onChange={(e) => setCareInstructions(e.target.value)}
            >
              <option value="">Select care instructions</option>
              {careInstructionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={styles.imageSection}>
        <h3 className={styles.sectionTitle}>Product Images</h3>
        <div className={styles.imageGrid}>
          {imageInputItems.map(({ index, inputRef }) => {
            const currentPreview = getPreview(index);
            const currentImageUrl = getImageUrl(index);
            const currentUploading = getUploading(index);

            return (
              <div key={index} className={styles.imageCard}>
                <div className={styles.formGroup}>
                  <label>Product Image {index}</label>

                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      handleImageChange(e, index);
                    }}
                  />
                </div>
                {currentUploading && (
                  <p className={styles.uploadStatus}>Uploading image...</p>
                )}
                {currentPreview && (
                  <div className={styles.previewBox}>
                    <img
                      src={currentPreview}
                      alt={`Preview ${index}`}
                      className={styles.previewImage}
                    />
                  </div>
                )}
                {currentImageUrl && (
                  <div className={styles.uploadSuccess}>
                    <p>Uploaded Successfully</p>
                    <p>{currentImageUrl}</p>
                  </div>
                )}

                {currentImageUrl && (
                  <button
                    type="button"
                    className={styles.deleteButton}
                    disabled={deletingImage === index || currentUploading}
                    onClick={() => {
                      deleteImage(index);
                    }}
                  >
                    {deletingImage === index ? "Deleting..." : "Delete"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className={styles.buttonRow}>
        <button
          type="button"
          onClick={() => saveProduct(false)}
          className={`${styles.button} ${styles.secondaryButton}`}
          disabled={saving !== null}
        >
          {saving === "draft" ? "Saving Draft..." : "Save to Draft"}
        </button>
        <button
          type="button"
          onClick={() => saveProduct(true)}
          className={styles.button}
          disabled={saving !== null}
        >
          {saving === "publish" ? "Publishing..." : "Publish"}
        </button>
      </div>
    </div>
  );
};

export default AddProduct;
