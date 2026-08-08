import dbConnect from "@/config/DBConnect";
import Address from "@/config/models/address";
import User from "@/config/models/user";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";
import SelectAddressButton from "./SelectAddressButton";
import styles from "./page.module.css";
import mongoose from "mongoose";

export const metadata: Metadata = {
  title: "Addresses",
  robots: {
    index: false,
    follow: false,
  },
};

type AddressPageProps = {
  searchParams: Promise<{
    returnTo?: string;
  }>;
};

type AddressRecord = {
  _id: string;
  name?: string;
  ph?: string;
  pin?: string;
  at?: string;
  po?: string;
  dist?: string;
  state?: string;
};

type UserAddressFields = {
  addressIds?: string[];
  selectedAddress?: string;
};

const MAX_ADDRESSES = 5;

function readRequiredField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getSafeReturnTo(value: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "";
  }

  return value;
}

function getSavedAddressIds(user: UserAddressFields) {
  return Array.from(
    new Set(
      (Array.isArray(user.addressIds) ? user.addressIds : [])
        .filter((addressId): addressId is string => Boolean(addressId))
        .map((addressId) => String(addressId))
    )
  );
}

function saveAddressIdsOnUser(user: UserAddressFields, addressIds: string[]) {
  user.addressIds = addressIds;
}

async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  await dbConnect();
  return User.findOne({ email: session.user.email });
}

async function addAddress(formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  const returnTo = getSafeReturnTo(readRequiredField(formData, "returnTo"));

  if (!user) {
    throw new Error("You must be signed in to add an address.");
  }

  const savedAddressIds = getSavedAddressIds(user);

  if (savedAddressIds.length >= MAX_ADDRESSES) {
    throw new Error("You can save a maximum of 5 addresses.");
  }

  const address = await Address.create({
    userId: String(user._id),
    name: readRequiredField(formData, "name"),
    ph: readRequiredField(formData, "ph"),
    pin: readRequiredField(formData, "pin"),
    at: readRequiredField(formData, "at"),
    po: readRequiredField(formData, "po"),
    dist: readRequiredField(formData, "dist"),
    state: readRequiredField(formData, "state"),
  });

  const addressId = String(address._id);
  saveAddressIdsOnUser(user, [...savedAddressIds, addressId]);
  user.selectedAddress = addressId;
  await user.save();

  revalidatePath("/address");

  if (returnTo) {
    revalidatePath("/order");
    redirect(returnTo);
  }
}

async function selectAddress(formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  const addressId = readRequiredField(formData, "addressId");
  const returnTo = getSafeReturnTo(readRequiredField(formData, "returnTo"));

  if (!user) {
    throw new Error("You must be signed in to select an address.");
  }

  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    throw new Error("Invalid address.");
  }

  const address = await Address.findOne({
    _id: addressId,
    userId: String(user._id),
  });

  if (!address) {
    throw new Error("Address not found.");
  }

  const savedAddressIds = getSavedAddressIds(user);

  if (!savedAddressIds.includes(addressId)) {
    throw new Error("Address is not saved on this user.");
  }

  saveAddressIdsOnUser(user, savedAddressIds);
  user.selectedAddress = addressId;
  await user.save();

  revalidatePath("/address");

  if (returnTo) {
    revalidatePath("/order");
    redirect(returnTo);
  }
}

export default async function AddressPage({ searchParams }: AddressPageProps) {
  const { returnTo: rawReturnTo } = await searchParams;
  const returnTo = getSafeReturnTo(rawReturnTo || "");
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className={styles.pageShell}>
        <section className={styles.container}>
          <h1 className={styles.heading}>Address</h1>
          <p className={styles.emptyText}>Please sign in to manage addresses.</p>
        </section>
      </main>
    );
  }

  const savedAddressIds = getSavedAddressIds(user);

  const addresses = savedAddressIds.length
    ? await Address.find({
        _id: { $in: savedAddressIds },
        userId: String(user._id),
      })
        .sort({ createdAt: -1 })
        .lean<AddressRecord[]>()
    : [];

  const selectedAddressId = user.selectedAddress
    ? String(user.selectedAddress)
    : "";
  const canAddAddress = savedAddressIds.length < MAX_ADDRESSES;

  return (
    <main className={styles.pageShell}>
      <section className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.heading}>Delivery Address</h1>
          <p className={styles.subheading}>
            Add an address or choose where future orders should be delivered.
          </p>
        </div>

        <div className={styles.contentGrid}>
          <form action={addAddress} className={styles.form}>
            <h2 className={styles.sectionTitle}>Add Address</h2>
            <input name="returnTo" type="hidden" value={returnTo} />
            {!canAddAddress ? (
              <p className={styles.limitText}>You have saved 5 addresses.</p>
            ) : null}
            <label className={styles.formGroup}>
              <span>Name</span>
              <input disabled={!canAddAddress} name="name" type="text" required />
            </label>
            <label className={styles.formGroup}>
              <span>Phone</span>
              <input disabled={!canAddAddress} name="ph" type="tel" required />
            </label>
            <label className={styles.formGroup}>
              <span>PIN</span>
              <input disabled={!canAddAddress} name="pin" type="text" required />
            </label>
            <label className={styles.formGroup}>
              <span>Address</span>
              <input disabled={!canAddAddress} name="at" type="text" required />
            </label>
            <label className={styles.formGroup}>
              <span>Post Office</span>
              <input disabled={!canAddAddress} name="po" type="text" required />
            </label>
            <label className={styles.formGroup}>
              <span>District</span>
              <input disabled={!canAddAddress} name="dist" type="text" required />
            </label>
            <label className={styles.formGroup}>
              <span>State</span>
              <input disabled={!canAddAddress} name="state" type="text" required />
            </label>
            <button
              className={styles.primaryButton}
              disabled={!canAddAddress}
              type="submit"
            >
              Add and Select
            </button>
          </form>

          <div className={styles.addressList}>
            <h2 className={styles.sectionTitle}>Saved Addresses</h2>
            {addresses.length > 0 ? (
              <div className={styles.cards}>
                {addresses.map((address) => {
                  const addressId = String(address._id);
                  const isSelected = selectedAddressId === addressId;

                  return (
                    <article
                      className={`${styles.addressCard} ${
                        isSelected ? styles.selectedCard : ""
                      }`}
                      key={addressId}
                    >
                      <div className={styles.cardHeader}>
                        <h3>{address.name || "Unnamed address"}</h3>
                        {isSelected ? (
                          <span className={styles.selectedBadge}>Selected</span>
                        ) : null}
                      </div>
                      <p>{address.at}</p>
                      <p>
                        {address.po}, {address.dist}
                      </p>
                      <p>
                        {address.state} - {address.pin}
                      </p>
                      <p>Phone: {address.ph}</p>
                      <form action={selectAddress}>
                        <input name="addressId" type="hidden" value={addressId} />
                        <input name="returnTo" type="hidden" value={returnTo} />
                        <SelectAddressButton isSelected={isSelected} />
                      </form>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className={styles.emptyText}>No saved addresses yet.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
