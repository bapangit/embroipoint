"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Product {
  _id: string;
  title: string;
  description:string;
  price: string;
  image1?: string;
  image2?: string;
  image3?: string;
  image4?: string;
  image5?: string;
}

const Drafts = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'admin') {
      router.push('/');
    } else {
      fetchDrafts();
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session || session.user.role !== 'admin') {
    return <div>Access Denied</div>;
  }

  const fetchDrafts = async () => {
    try {
      const res = await fetch("/api/products/drafts");
      const data = await res.json();

      setProducts(data.products || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      setDeletingId(productId);

      const res = await fetch(`/api/products/create-product/${productId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        setProducts((currentProducts) =>
          currentProducts.filter((product) => product._id !== productId),
        );
      }
    } catch (error) {
      console.log(error);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Draft Products</h1>

      {products.length === 0 ? (
        <p>No draft products found</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          {products.map((product) => {
            const previewImage = [
              product.image1,
              product.image2,
              product.image3,
              product.image4,
              product.image5,
            ].find((image) => image?.startsWith("http"));

            return (
              <div
                key={product._id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  padding: "15px",
                }}
              >
                <div
                  onClick={() => router.push(`/admin/addproduct?id=${product._id}`)}
                  style={{ cursor: "pointer" }}
                >
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt={product.title}
                      style={{
                        width: "100%",
                        height: "200px",
                        objectFit: "cover",
                        borderRadius: "10px",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "200px",
                        display: "grid",
                        placeItems: "center",
                        background: "#f3f4f6",
                        color: "#64748b",
                        borderRadius: "10px",
                      }}
                    >
                      No image
                    </div>
                  )}

                  <h3>{product.title || "Untitled Product"}</h3>
                  <p>Rs. {product.price || "0"}</p>
                  <p
                    style={{
                      color: "orange",
                      fontWeight: "bold",
                    }}
                  >
                    Draft
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(product._id)}
                  disabled={deletingId === product._id}
                  style={{
                    marginTop: "12px",
                    width: "100%",
                    padding: "10px 12px",
                    border: "none",
                    borderRadius: "8px",
                    background: deletingId === product._id ? "#cbd5e1" : "#dc2626",
                    color: "#fff",
                    cursor: deletingId === product._id ? "not-allowed" : "pointer",
                  }}
                >
                  {deletingId === product._id ? "Deleting..." : "Delete Draft"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Drafts;
