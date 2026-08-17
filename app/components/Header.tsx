"use client";

import { signIn, useSession } from "next-auth/react";
import { LuShoppingCart } from "react-icons/lu";
import { IoMdAdd } from "react-icons/io";
import { RiAdminFill, RiDraftLine } from "react-icons/ri";
import { GiHamburgerMenu } from "react-icons/gi";
import SearchComp from "../../components/SearchComponent";
import ProfileComp from "../../components/ProfileComponent";
import Link from "next/link";
import { type MouseEvent, useState } from "react";
import { MdOutlineLocalShipping } from "react-icons/md";
import Image from "next/image";


type HeaderProps = {
  styles: Record<string, string>;
};

export default function Header({ styles }: HeaderProps) {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);

  const isAdmin = session?.user?.role === "admin";

  const handleCartClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (status === "loading") {
      event.preventDefault();
      return;
    }

    if (!session) {
      event.preventDefault();
      signIn("google", { callbackUrl: "/cart" });
    }
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.hamburger_container}>
          <button 
            className={styles.hamburger_button}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <GiHamburgerMenu size={24} />
          </button>
        </div>
        <SearchComp styles={styles} />
        <Link href="/" className={styles.logo_link}> 
          <Image
            className={styles.logo_image}
            src="/logo-v3.png"
            alt="Catelina"
            width={800}
            height={355}
            priority
          />
        </Link>
        <nav className={styles.nav}>
          <ol className={styles.ol}>
            <li className={styles.icon_style}>
              <Link href="/products">Products</Link>
            </li>
            <li>
              <Link href="/categories">Categories</Link>
            </li>
            <li>
              <Link href="/most-ordered">Most Ordered</Link>
            </li>
            <li>
              <Link href="/about">About</Link>
            </li>
          </ol>
        </nav>
        <div className={styles.header_secondary_nav}>
          <ul>
            {isAdmin && (
              <li>
                <button
                  type="button"
                  className={styles.admin_panel_button}
                  onClick={() => setAdminPanelOpen(true)}
                  aria-label="Open admin panel"
                  aria-haspopup="dialog"
                  aria-expanded={adminPanelOpen}
                >
                  <RiAdminFill className="icon" />
                </button>
              </li>
            )}
            
            <li>
              <Link href="/cart" aria-label="View cart" onClick={handleCartClick}>
                <LuShoppingCart className="icon" />
              </Link>
            </li>
            <li>
              <ProfileComp styles={styles} />
            </li>
          </ul>
        </div>
      </header>
      
      {menuOpen && (
        <>
          <div 
            className={styles.modal_overlay}
            onClick={() => setMenuOpen(false)}
          />
          <div className={styles.mobile_menu_modal}>
            <nav className={styles.mobile_menu_nav}>
              <ol className={styles.mobile_menu_ol}>
                <li>
                  <Link href="/products" onClick={() => setMenuOpen(false)}>Products</Link>
                </li>
                <li>
                  <Link href="/categories" onClick={() => setMenuOpen(false)}>Categories</Link>
                </li>
                <li>
                  <Link href="/most-ordered" onClick={() => setMenuOpen(false)}>Most Ordered</Link>
                </li>
                <li>
                  <Link href="/about" onClick={() => setMenuOpen(false)}>About</Link>
                </li>
              </ol>
            </nav>
          </div>
        </>
      )}

      {adminPanelOpen && (
        <>
          <div
            className={styles.modal_overlay}
            onClick={() => setAdminPanelOpen(false)}
          />
          <div
            className={styles.admin_panel_modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-panel-title"
          >
            <div className={styles.admin_panel_header}>
              <h2 id="admin-panel-title">Admin Panel</h2>
              <button
                type="button"
                className={styles.admin_panel_close}
                onClick={() => setAdminPanelOpen(false)}
                aria-label="Close admin panel"
              >
                x
              </button>
            </div>
            <nav className={styles.admin_panel_nav}>
              <Link
                href="/admin/addproduct"
                className={styles.admin_panel_link}
                onClick={() => setAdminPanelOpen(false)}
              >
                <IoMdAdd className="icon" />
                <span>Add Product</span>
              </Link>
              <Link
                href="/admin/drafts"
                className={styles.admin_panel_link}
                onClick={() => setAdminPanelOpen(false)}
              >
                <RiDraftLine className="icon" />
                <span>Drafts</span>
              </Link>
              <Link
                href="/admin/orders"
                className={styles.admin_panel_link}
                onClick={() => setAdminPanelOpen(false)}
              >
                <MdOutlineLocalShipping className="icon" />
                <span>Orders</span>
              </Link>
            </nav>
          </div>
        </>
      )}
    </>
  );
}
